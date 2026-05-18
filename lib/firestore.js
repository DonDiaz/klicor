import { FieldValue, Timestamp } from "firebase-admin/firestore";
import crypto from "node:crypto";
import { revalidateTag } from "next/cache";
import sharp from "sharp";
import { ADMIN_SETTINGS_DEFAULTS, normalizeAdminSettings, normalizeOrigin, normalizePlan, resolveUserAccountStatus } from "@/lib/admin-config";
import { normalizeBookingConfig } from "@/lib/booking-config";
import { normalizeBusinessHours } from "@/lib/business-hours";
import { DEFAULT_BUSINESS_CATEGORY, isBusinessModuleEligible, normalizeBusinessCategory, normalizeBusinessType } from "@/lib/business-categories";
import { normalizeCommerceConfig, resolveDefaultCommerceModeForBusinessCategory } from "@/lib/commerce-config";
import { ACCOUNT_STATES, GRACE_DAYS, HARD_SUSPENSION_DAYS, PLAN_SLUG, RESERVED_USERNAMES, TRIAL_DAYS } from "@/lib/constants";
import { normalizeDorikaProfile } from "@/lib/dorika-profile";
import { isDorikaEligibleBusiness } from "@/lib/dorika-eligibility";
import { generateBrandedQrBuffer, STABLE_QR_VERSION } from "@/lib/branded-qr";
import { assertNoActivePlanDowngrade } from "@/lib/billing-rules";
import { resolveCityName, resolveDepartmentName } from "@/lib/colombia-locations";
import { getAdminDb, getAdminStorage } from "@/lib/firebase-admin";
import { buildPaymentMethodsSignature, hasPaymentMethodData, normalizePaymentMethods } from "@/lib/payment-methods";
import { normalizeLegalAcceptance } from "@/lib/legal-consent";
import { sendAdminBillingProfileUpdated, sendAdminPaymentApproved } from "@/lib/mailer";
import { buildStableProfileUrl } from "@/lib/public-profile-links";
import { invalidatePublicProfileCache } from "@/lib/public-profiles";
import { normalizeProfileLinks } from "@/lib/profile-links";
import { normalizeKlicorModule, normalizeKlicorPlan, resolveDefaultModuleAccess, resolveUserModuleAccess, shouldRestrictToPrimaryModuleOnProfileChange } from "@/lib/plans";
import { APPEARANCE_DEFAULTS, normalizeAppearance, normalizeCustomThemes } from "@/lib/theme-system";
import { buildWhatsappLink, getUsernameChangeDate, sanitizeSlug, toDate } from "@/lib/utils";

const PUBLIC_LINK_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";
const PUBLIC_LINK_LENGTH = 6;
const RECOVERY_EMAIL_MIN_INTERVAL_MS = 60 * 1000;
const RECOVERY_EMAIL_WINDOW_MS = 60 * 60 * 1000;
const RECOVERY_EMAIL_MAX_PER_WINDOW = 5;
const PROFILE_IMAGE_WIDTH = 1200;
const PROFILE_AVATAR_SIZE = 384;
const ANALYTICS_KEY_MAX_LENGTH = 80;

function usersCollection() {
  return getAdminDb().collection("users");
}

function usernamesCollection() {
  return getAdminDb().collection("usernames");
}

function publicLinksCollection() {
  return getAdminDb().collection("publicLinks");
}

function settingsCollection() {
  return getAdminDb().collection("settings");
}

function paymentsCollection() {
  return getAdminDb().collection("payments");
}

function analyticsCollection() {
  return getAdminDb().collection("analytics");
}

function normalizeAnalyticsKey(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, ANALYTICS_KEY_MAX_LENGTH);
}

function hashRecoveryToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function normalizeEmail(email = "") {
  return String(email || "").trim().toLowerCase();
}

function addDaysFrom(date = new Date(), days = 0) {
  const next = new Date(date);
  next.setDate(next.getDate() + Number(days || 0));
  return next;
}

function isPermanentTrialAccount(user = {}) {
  const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL);
  return Boolean(adminEmail)
    && user.role === "admin"
    && Boolean(user.emailVerified)
    && normalizeEmail(user.email) === adminEmail;
}

function buildModuleAccessPayload(user = {}, { plan = "", selectedModule = "" } = {}) {
  const resolvedPlan = normalizePlan(plan || user.plan || user.status || "trial");
  const module = normalizeKlicorModule(selectedModule || user.commercialModule || user.module);
  const moduleAccess = resolveDefaultModuleAccess({
    plan: resolvedPlan,
    businessCategory: user.businessCategory || DEFAULT_BUSINESS_CATEGORY,
    businessType: user.businessType || user.dorikaProfile?.businessType || "",
    selectedModule: module,
  });

  return {
    moduleAccess,
    commercialModule: resolvedPlan === "commercial" || resolvedPlan === "institutional"
      ? module || (moduleAccess.commerce ? "commerce" : moduleAccess.booking ? "booking" : "")
      : "",
  };
}

function buildRecoveryEmailRateLimitPayload(current = {}, now = new Date()) {
  const lastSentAt = toDate(current.recoveryEmailLastSentAt);
  if (lastSentAt && now.getTime() - lastSentAt.getTime() < RECOVERY_EMAIL_MIN_INTERVAL_MS) {
    throw new Error("Espera un minuto antes de enviar otro correo de verificación.");
  }

  const windowStartedAt = toDate(current.recoveryEmailWindowStartedAt);
  const insideWindow = windowStartedAt && now.getTime() - windowStartedAt.getTime() < RECOVERY_EMAIL_WINDOW_MS;
  const sendCount = insideWindow ? Number(current.recoveryEmailSendCount || 0) : 0;

  if (sendCount >= RECOVERY_EMAIL_MAX_PER_WINDOW) {
    throw new Error("Has alcanzado el límite de correos de verificación por ahora. Intenta más tarde.");
  }

  return {
    recoveryEmailLastSentAt: Timestamp.fromDate(now),
    recoveryEmailWindowStartedAt: insideWindow ? Timestamp.fromDate(windowStartedAt) : Timestamp.fromDate(now),
    recoveryEmailSendCount: sendCount + 1,
  };
}

function createPublicLinkId(length = PUBLIC_LINK_LENGTH) {
  const bytes = crypto.randomBytes(length);
  let value = "";

  for (let index = 0; index < length; index += 1) {
    value += PUBLIC_LINK_ALPHABET[bytes[index] % PUBLIC_LINK_ALPHABET.length];
  }

  return value;
}

async function createUniquePublicLinkId(uid) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const publicLinkId = createPublicLinkId();
    const snap = await publicLinksCollection().doc(publicLinkId).get();

    if (!snap.exists || snap.data()?.uid === uid) {
      return publicLinkId;
    }
  }

  throw new Error("No pudimos reservar un enlace permanente. Intenta de nuevo.");
}

async function syncPublicLinkRecord(user) {
  if (!user?.publicLinkId) return;

  const ref = publicLinksCollection().doc(user.publicLinkId);
  const snap = await ref.get();
  const currentUsername = user.usernameLower || "";

  if (
    snap.exists &&
    snap.data()?.uid === user.uid &&
    snap.data()?.username === currentUsername &&
    snap.data()?.active === true
  ) {
    return;
  }

  await ref.set({
    uid: user.uid,
    username: currentUsername,
    active: true,
    createdAt: snap.exists ? snap.data()?.createdAt || FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

export async function generateAndStoreStableQr(publicLinkId, { logoSource = "" } = {}) {
  if (!publicLinkId) {
    throw new Error("No existe un identificador permanente para el QR");
  }

  const qrPath = `qr/${publicLinkId}.png`;
  const url = buildStableProfileUrl(publicLinkId);
  const pngBuffer = await generateBrandedQrBuffer(url, { size: 400, logoSource });

  const bucket = getAdminStorage();
  await bucket.file(qrPath).save(pngBuffer, {
    contentType: "image/png",
    resumable: false,
    public: true,
  });

  return {
    qrPath,
    qrUrl: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(qrPath)}?alt=media`,
    qrVersion: STABLE_QR_VERSION,
  };
}

async function ensureStableProfileAccess(user) {
  if (!user?.uid) return user;

  const ref = usersCollection().doc(user.uid);
  let nextUser = { ...user };

  if (!nextUser.publicLinkId) {
    const publicLinkId = await createUniquePublicLinkId(user.uid);
    await ref.set({
      publicLinkId,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    nextUser.publicLinkId = publicLinkId;
  }

  await syncPublicLinkRecord(nextUser);

  if (
    nextUser.usernameLower &&
    (nextUser.qrVersion !== STABLE_QR_VERSION || !nextUser.qrPath || !nextUser.qrUrl)
  ) {
    const qrData = await generateAndStoreStableQr(nextUser.publicLinkId, {
      logoSource: nextUser.photo || "",
    });
    await ref.set({
      ...qrData,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    nextUser = {
      ...nextUser,
      ...qrData,
    };
  }

  return nextUser;
}

export async function getAdminSettings() {
  const ref = settingsCollection().doc("billing");
  const snap = await ref.get();
  if (!snap.exists) {
    const data = normalizeAdminSettings({
      ...ADMIN_SETTINGS_DEFAULTS,
      currency: "COP",
      trialDays: TRIAL_DAYS,
      graceDays: GRACE_DAYS,
      hardSuspensionDays: HARD_SUSPENSION_DAYS,
    });
    await ref.set(data);
    return data;
  }
  return normalizeAdminSettings(snap.data());
}

export async function ensureUserProfile({ uid, email, name = "", photoURL = "", role = "user", emailVerified = false }) {
  const ref = usersCollection().doc(uid);
  const snap = await ref.get();
  const now = new Date();
  const normalizedRole = role === "admin" ? "admin" : "user";
  const adminSettings = await getAdminSettings();

  if (snap.exists) {
    const current = snap.data();
    const baseUpdates = {
      email,
      emailVerified: Boolean(emailVerified),
      role: normalizedRole,
      ownerName: String(current.ownerName || name || "").trim(),
      phone: String(current.phone || current.billingProfile?.billingPhone || "").trim(),
      city: String(current.city || current.billingProfile?.city || "").trim(),
      origin: normalizeOrigin(current.origin),
      partnerId: String(current.partnerId || "").trim(),
      accountStatus: resolveUserAccountStatus(current),
      startsAt: current.startsAt || current.createdAt || Timestamp.fromDate(now),
      adminNotes: String(current.adminNotes || "").trim(),
      amountPaid: Number.isFinite(Number(current.amountPaid)) ? Number(current.amountPaid) : current.paymentPrice || null,
      lastPaymentAt: current.lastPaymentAt || null,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (isPermanentTrialAccount({ ...current, ...baseUpdates })) {
      const updates = {
        ...baseUpdates,
        email,
        plan: "trial",
        status: ACCOUNT_STATES.TRIAL,
        trialEndsAt: null,
        expiresAt: null,
        graceUntil: null,
        cancellationAt: null,
        paymentPrice: null,
        accountStatus: "trial",
      };
      await ref.set(updates, { merge: true });
      return ensureStableProfileAccess({ id: snap.id, ...current, ...updates });
    }

    await ref.set(baseUpdates, { merge: true });
    return ensureStableProfileAccess({ id: snap.id, ...current, ...baseUpdates });
  }

  const permanentTrial = isPermanentTrialAccount({ email, role: normalizedRole, emailVerified });
  const data = {
    uid,
    email,
    username: "",
    usernameLower: "",
    businessName: "",
    businessCategory: DEFAULT_BUSINESS_CATEGORY,
    businessType: "",
    businessHeadline: "",
    businessSubheadline: "",
    photo: photoURL || "",
    photoThumb: "",
    photoPath: "",
    photoThumbPath: "",
    links: {
      whatsapp: "",
      email: "",
      instagram: "",
      facebook: "",
      tiktok: "",
      website: "",
    },
    profileLinks: [],
    paymentMethods: [],
    paymentQrUrl: "",
    paymentQrPath: "",
    qrUrl: "",
    qrPath: "",
    plan: "trial",
    ...buildModuleAccessPayload({ businessCategory: DEFAULT_BUSINESS_CATEGORY }, { plan: "trial" }),
    role: normalizedRole,
    status: ACCOUNT_STATES.TRIAL,
    accountStatus: "trial",
    origin: "organico",
    partnerId: "",
    ownerName: String(name || "").trim(),
    phone: "",
    city: "",
    adminNotes: "",
    startsAt: Timestamp.fromDate(now),
    trialEndsAt: permanentTrial ? null : Timestamp.fromDate(addDaysFrom(now, adminSettings.trialDays)),
    expiresAt: null,
    graceUntil: null,
    cancellationAt: null,
    lastUsernameChangeAt: null,
    usernameChangeAvailableAt: null,
    publicLinkId: await createUniquePublicLinkId(uid),
    paymentPrice: null,
    lastPaymentAt: null,
    amountPaid: null,
    emailVerified: Boolean(emailVerified),
    backupEmail: "",
    backupEmailVerified: false,
    backupEmailVerificationTokenHash: null,
    backupEmailVerificationExpiresAt: null,
    recoveryEmailLastSentAt: null,
    recoveryEmailWindowStartedAt: null,
    recoveryEmailSendCount: 0,
    recoveryPhone: "",
    recoveryPhoneVerified: false,
    recoveryUpdatedAt: null,
    contactCardEnabled: false,
    contactCardName: "",
    contactCardTitle: "",
    contactCardWhatsappLinkId: "",
    contactCardPhone: "",
    bookingConfig: normalizeBookingConfig(),
    businessHours: normalizeBusinessHours(),
    dorikaProfile: normalizeDorikaProfile({ enabled: true }, { businessCategory: DEFAULT_BUSINESS_CATEGORY }),
    billingProfile: normalizeBillingProfile(),
    settings: APPEARANCE_DEFAULTS,
    customThemes: [],
    onboardingCompleted: false,
    welcomeEmailSent: false,
    expiryReminderSentAt: null,
    suspensionEmailSentAt: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await ref.set(data);
  return ensureStableProfileAccess({ id: uid, ...data });
}

export async function recordUserLegalAcceptance(uid, input = {}, metadata = {}) {
  if (!uid) return null;

  const acceptance = normalizeLegalAcceptance(input);
  if (!acceptance.accepted) {
    throw new Error("Debes aceptar los terminos y condiciones para crear o usar tu cuenta.");
  }

  const ref = usersCollection().doc(uid);
  const consentRef = ref.collection("legalConsents").doc();
  const payload = {
    ...acceptance,
    ip: String(metadata.ip || "").slice(0, 120),
    userAgent: String(metadata.userAgent || "").slice(0, 500),
    createdAt: FieldValue.serverTimestamp(),
  };

  await getAdminDb().runTransaction(async (transaction) => {
    transaction.set(consentRef, payload);
    transaction.set(ref, {
      legalConsent: {
        ...acceptance,
        lastConsentId: consentRef.id,
        updatedAt: FieldValue.serverTimestamp(),
      },
      termsAccepted: true,
      termsAcceptedAt: FieldValue.serverTimestamp(),
      termsVersion: acceptance.termsVersion,
      privacyVersion: acceptance.privacyVersion,
      paymentsVersion: acceptance.paymentsVersion,
      acceptableUseVersion: acceptance.acceptableUseVersion,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  });

  return { id: consentRef.id, ...payload };
}

export async function getUserByUid(uid) {
  const snap = await usersCollection().doc(uid).get();
  if (!snap.exists) return null;
  return ensureStableProfileAccess({ id: snap.id, ...snap.data() });
}

export async function getUserByUsername(username) {
  const slug = sanitizeSlug(username);
  if (!slug || slug.length > 30) return null;
  const usernameSnap = await usernamesCollection().doc(slug).get();
  if (!usernameSnap.exists) return null;
  return getUserByUid(usernameSnap.data().uid);
}

export async function getUserByPublicLinkId(publicLinkId) {
  const slug = String(publicLinkId || "").trim().toLowerCase();
  if (!slug || slug.length > 80) return null;

  const snap = await publicLinksCollection().doc(slug).get();
  if (!snap.exists || snap.data()?.active === false) return null;

  return getUserByUid(snap.data().uid);
}

async function getUsernameConflictUid(slug, currentUid) {
  if (!slug) return null;

  const usernameSnap = await usernamesCollection().doc(slug).get();
  if (usernameSnap.exists) {
    const reservedUid = String(usernameSnap.data()?.uid || "").trim();
    if (reservedUid && reservedUid !== currentUid) {
      return reservedUid;
    }
  }

  const [lowercaseUsersSnap, legacyUsersSnap] = await Promise.all([
    usersCollection().where("usernameLower", "==", slug).limit(5).get(),
    usersCollection().where("username", "==", slug).limit(5).get(),
  ]);

  const conflictingDoc = [...lowercaseUsersSnap.docs, ...legacyUsersSnap.docs].find((doc) => doc.id !== currentUid);
  return conflictingDoc?.id || null;
}

export async function isUsernameAvailable(username, currentUid) {
  const slug = sanitizeSlug(username);
  if (!slug || slug.length < 3 || slug.length > 30 || RESERVED_USERNAMES.includes(slug)) return false;
  const conflictUid = await getUsernameConflictUid(slug, currentUid);
  return !conflictUid;
}

export async function uploadProfilePhoto(uid, file) {
  const maxSizeBytes = 2 * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error("La imagen debe pesar menos de 2MB");
  }

  const allowed = ["image/png", "image/jpeg", "image/webp"];
  if (!allowed.includes(file.type)) {
    throw new Error("Formato de imagen no permitido");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const image = sharp(buffer).rotate();
  const metadata = await image.metadata();
  const bucket = getAdminStorage();
  const basePath = `profiles/${uid}`;
  const mainPath = `${basePath}/main.webp`;
  const thumbPath = `${basePath}/avatar.webp`;

  const [mainBuffer, thumbBuffer] = await Promise.all([
    image.clone()
      .resize({
        width: PROFILE_IMAGE_WIDTH,
        height: PROFILE_IMAGE_WIDTH,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer(),
    image.clone()
      .resize(PROFILE_AVATAR_SIZE, PROFILE_AVATAR_SIZE, {
        fit: "cover",
        position: "centre",
      })
      .webp({ quality: 74 })
      .toBuffer(),
  ]);

  await Promise.all([
    bucket.file(mainPath).save(mainBuffer, {
      contentType: "image/webp",
      resumable: false,
      public: true,
    }),
    bucket.file(thumbPath).save(thumbBuffer, {
      contentType: "image/webp",
      resumable: false,
      public: true,
    }),
  ]);

  await Promise.allSettled([
    bucket.file(`${basePath}/cover.jpg`).delete({ ignoreNotFound: true }),
    bucket.file(`${basePath}/cover.png`).delete({ ignoreNotFound: true }),
    bucket.file(`${basePath}/cover.webp`).delete({ ignoreNotFound: true }),
  ]);

  return {
    path: mainPath,
    url: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(mainPath)}?alt=media`,
    thumbPath,
    thumbUrl: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(thumbPath)}?alt=media`,
    width: Number(metadata.width || 0) || 0,
    height: Number(metadata.height || 0) || 0,
  };
}

export async function uploadPaymentQrImage(uid, file, methodId = "official") {
  const safeMethodId = String(methodId || "official").replace(/[^a-z0-9-_]/gi, "-").toLowerCase();
  return uploadImageAsset({
    uid,
    file,
    directory: "payment-qr",
    filename: `official-${safeMethodId}`,
    maxSizeBytes: 4 * 1024 * 1024,
    sizeErrorMessage: "El QR oficial debe pesar menos de 4MB",
  });
}

export async function uploadDorikaCoverImage(uid, file) {
  const maxSizeBytes = 5 * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error("La portada para Dorika debe pesar menos de 5MB");
  }

  const allowed = ["image/png", "image/jpeg", "image/webp"];
  if (!allowed.includes(file.type)) {
    throw new Error("Formato de imagen no permitido");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const image = sharp(buffer).rotate();
  const path = `dorika-covers/${uid}/cover.webp`;
  const output = await image
    .resize({
      width: 1440,
      height: 810,
      fit: "cover",
      position: "centre",
    })
    .webp({ quality: 82 })
    .toBuffer();

  const bucket = getAdminStorage();
  const downloadToken = crypto.randomUUID();
  await bucket.file(path).save(output, {
    contentType: "image/webp",
    resumable: false,
    metadata: {
      cacheControl: "public, max-age=31536000, immutable",
      metadata: {
        firebaseStorageDownloadTokens: downloadToken,
      },
    },
  });

  return {
    path,
    url: buildFirebaseStorageDownloadUrl(bucket.name, path, downloadToken),
  };
}

function buildFirebaseStorageDownloadUrl(bucketName, path, token = "") {
  const tokenParam = token ? `&token=${encodeURIComponent(token)}` : "";
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(path)}?alt=media${tokenParam}`;
}

export async function ensureDorikaCoverDownloadUrl(uid, user = {}) {
  const dorikaProfile = normalizeDorikaProfile(user.dorikaProfile, user);
  const coverPath = dorikaProfile.coverImagePath;
  const coverUrl = dorikaProfile.coverImageUrl;

  if (!uid || !coverPath || /[?&]token=/i.test(coverUrl)) {
    return user;
  }

  const bucket = getAdminStorage();
  const file = bucket.file(coverPath);
  const [exists] = await file.exists().catch(() => [false]);
  if (!exists) return user;

  const [metadata] = await file.getMetadata().catch(() => [{}]);
  const currentMetadata = metadata?.metadata || {};
  const existingToken = String(currentMetadata.firebaseStorageDownloadTokens || "")
    .split(",")
    .map((item) => item.trim())
    .find(Boolean);
  const downloadToken = existingToken || crypto.randomUUID();

  if (!existingToken) {
    try {
      await file.setMetadata({
        cacheControl: "public, max-age=31536000, immutable",
        metadata: {
          ...currentMetadata,
          firebaseStorageDownloadTokens: downloadToken,
        },
      });
    } catch {
      return user;
    }
  }

  const nextCoverUrl = buildFirebaseStorageDownloadUrl(bucket.name, coverPath, downloadToken);
  const nextDorikaProfile = {
    ...(user.dorikaProfile || {}),
    coverImagePath: coverPath,
    coverImageUrl: nextCoverUrl,
  };

  await usersCollection().doc(uid).set({
    dorikaProfile: nextDorikaProfile,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  return {
    ...user,
    dorikaProfile: nextDorikaProfile,
  };
}

async function uploadImageAsset({ uid, file, directory, filename, maxSizeBytes, sizeErrorMessage }) {
  if (file.size > maxSizeBytes) {
    throw new Error(sizeErrorMessage);
  }

  const allowed = ["image/png", "image/jpeg", "image/webp"];
  if (!allowed.includes(file.type)) {
    throw new Error("Formato de imagen no permitido");
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${directory}/${uid}/${filename}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const bucket = getAdminStorage();
  await bucket.file(path).save(buffer, {
    contentType: file.type,
    resumable: false,
    public: true,
  });

  return {
    path,
    url: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media`,
  };
}

function toLegacyLinks(profileLinks) {
  return {
    whatsapp: profileLinks.find((item) => item.type === "whatsapp")?.value || "",
    email: profileLinks.find((item) => item.type === "email")?.value || "",
    instagram: profileLinks.find((item) => item.type === "instagram")?.value || "",
    facebook: profileLinks.find((item) => item.type === "facebook")?.value || "",
    tiktok: profileLinks.find((item) => item.type === "tiktok")?.value || "",
    website: profileLinks.find((item) => item.type === "website")?.value || "",
  };
}

function invalidatePublicCommerceCacheForUser(user = {}) {
  const slug = sanitizeSlug(user.usernameLower || user.username || "");
  const mode = normalizeCommerceConfig(user.commerce, user).activeMode || user.commerceMode || "";
  if (slug) revalidateTag(`public-commerce:${slug}`);
  if (slug && mode) revalidateTag(`public-commerce:${slug}:${mode}`);
}

function invalidatePublicCommerceCacheForMode(username = "", mode = "") {
  const slug = sanitizeSlug(username);
  const cleanMode = String(mode || "").trim();
  if (slug) revalidateTag(`public-commerce:${slug}`);
  if (slug && cleanMode) revalidateTag(`public-commerce:${slug}:${cleanMode}`);
}

function normalizeBillingProfile(input = {}) {
  const documentType = String(input.documentType || "").trim().toLowerCase();
  const department = resolveDepartmentName(input.department || "");
  const city = resolveCityName(department, input.city || "");
  const taxResponsibility = String(input.taxResponsibility || "").trim().toLowerCase();

  return {
    legalName: String(input.legalName || "").trim(),
    documentType: ["nit", "cc", "ce", "passport", "other"].includes(documentType) ? documentType : "nit",
    documentNumber: String(input.documentNumber || "").trim(),
    verificationDigit: String(input.verificationDigit || "").trim(),
    taxResponsibility: ["si", "no"].includes(taxResponsibility) ? taxResponsibility : "",
    billingEmail: String(input.billingEmail || "").trim().toLowerCase(),
    billingPhone: String(input.billingPhone || "").trim(),
    address: String(input.address || "").trim(),
    city,
    department,
    country: String(input.country || "").trim() || "Colombia",
  };
}

function buildBillingProfileSignature(profile = {}) {
  const normalized = normalizeBillingProfile(profile);
  return JSON.stringify({
    legalName: normalized.legalName,
    documentType: normalized.documentType,
    documentNumber: normalized.documentNumber,
    verificationDigit: normalized.verificationDigit,
    taxResponsibility: normalized.taxResponsibility,
    billingEmail: normalized.billingEmail,
    billingPhone: normalized.billingPhone,
    address: normalized.address,
    city: normalized.city,
    department: normalized.department,
    country: normalized.country,
  });
}

function hasBillingProfileData(profile = {}) {
  const normalized = normalizeBillingProfile(profile);
  return Boolean(
    normalized.legalName
    || normalized.documentNumber
    || normalized.verificationDigit
    || normalized.taxResponsibility
    || normalized.billingEmail
    || normalized.billingPhone
    || normalized.address
    || normalized.city
    || normalized.department,
  );
}

export async function updateUserProfile(uid, input, assets = {}) {
  const ref = usersCollection().doc(uid);
  const currentSnap = await ref.get();
  if (!currentSnap.exists) {
    throw new Error("Usuario no encontrado");
  }

  const current = await ensureStableProfileAccess({ id: currentSnap.id, ...currentSnap.data() });
  const slug = sanitizeSlug(input.username);
  const currentSlug = current.usernameLower || "";
  const usernameChanged = slug !== currentSlug;
  const permanentTrial = isPermanentTrialAccount(current);

  if (usernameChanged) {
    const conflictUid = await getUsernameConflictUid(slug, uid);
    if (conflictUid) {
      throw new Error("Ese usuario ya está en uso o no está permitido");
    }
    const nextChangeAllowed = toDate(current.usernameChangeAvailableAt);
    if (!permanentTrial && nextChangeAllowed && new Date() < nextChangeAllowed) {
      throw new Error("Solo puedes cambiar el usuario una vez cada 30 días");
    }
  }

  const profileLinks = normalizeProfileLinks(input.profileLinks).filter((item) => item.type !== "payment_key");
  const currentProfileLinks = normalizeProfileLinks(current.profileLinks, current.links);
  let paymentMethods = normalizePaymentMethods(input.paymentMethods, currentProfileLinks, current.paymentQrUrl, current.paymentQrPath);
  const currentPaymentMethods = normalizePaymentMethods(current.paymentMethods, currentProfileLinks, current.paymentQrUrl, current.paymentQrPath);
  const paymentMethodsChanged = buildPaymentMethodsSignature(paymentMethods) !== buildPaymentMethodsSignature(currentPaymentMethods);
  const hasConfiguredPaymentMethods = hasPaymentMethodData(paymentMethods);
  const settings = normalizeAppearance(input.appearance);
  const customThemes = normalizeCustomThemes(input.customThemes);
  const billingProfile = normalizeBillingProfile(input.billingProfile);
  const billingProfileChanged = buildBillingProfileSignature(current.billingProfile) !== buildBillingProfileSignature(billingProfile);
  const businessHours = normalizeBusinessHours(input.businessHours);
  const businessCategory = normalizeBusinessCategory(input.businessCategory);
  const businessType = normalizeBusinessType(input.businessType || input.dorikaProfile?.businessType || "", businessCategory);
  let dorikaProfile = normalizeDorikaProfile(input.dorikaProfile, {
    ...current,
    businessCategory,
    businessType,
    city: billingProfile.city,
    billingProfile,
  });
  if (!isDorikaEligibleBusiness({ ...current, city: billingProfile.city, billingProfile, dorikaProfile })) {
    dorikaProfile = {
      ...dorikaProfile,
      enabled: false,
    };
  }
  const selectedWhatsappLinkId = profileLinks.some((item) => item.type === "whatsapp" && item.id === input.contactCard.whatsappLinkId)
    ? input.contactCard.whatsappLinkId
    : "";
  const payload = {
    businessName: input.businessName,
    businessCategory,
    businessType,
    businessHeadline: String(input.businessHeadline || "").trim(),
    businessSubheadline: String(input.businessSubheadline || "").trim(),
    username: slug,
    usernameLower: slug,
    profileLinks,
    paymentMethods: [],
    links: toLegacyLinks(profileLinks),
    settings,
    customThemes,
    onboardingCompleted: true,
    contactCardEnabled: Boolean(input.contactCard.enabled),
    contactCardName: String(input.contactCard.name || "").trim(),
    contactCardTitle: String(input.contactCard.title || "").trim(),
    contactCardWhatsappLinkId: selectedWhatsappLinkId,
    contactCardPhone: String(input.contactCard.phone || "").trim(),
    billingProfile,
    ...(billingProfileChanged ? { billingProfileUpdatedAt: FieldValue.serverTimestamp() } : {}),
    businessHours,
    city: billingProfile.city,
    dorikaProfile: {
      ...dorikaProfile,
      category: businessCategory,
      businessType,
    },
    updatedAt: FieldValue.serverTimestamp(),
  };

  const businessCategoryChanged = businessCategory !== normalizeBusinessCategory(current.businessCategory);
  const businessTypeChanged = businessType !== normalizeBusinessType(current.businessType || current.dorikaProfile?.businessType || "", current.businessCategory);
  if ((businessCategoryChanged || businessTypeChanged) && shouldRestrictToPrimaryModuleOnProfileChange(current)) {
    Object.assign(payload, buildModuleAccessPayload({ ...current, businessCategory, businessType }, { plan: current.plan || current.status }));
  } else if (current.status === ACCOUNT_STATES.TRIAL && current.plan === "trial" && !current.moduleAccess) {
    Object.assign(payload, buildModuleAccessPayload({ ...current, businessCategory, businessType }, { plan: "trial" }));
  }

  const currentCommerceConfig = normalizeCommerceConfig(current.commerce, current);
  const recommendedCommerceMode = resolveDefaultCommerceModeForBusinessCategory(businessCategory);
  const nextModuleAccess = resolveUserModuleAccess({ ...current, ...payload });
  const shouldSwitchCommerceMode = businessCategoryChanged
    && nextModuleAccess.commerce
    && currentCommerceConfig.activeMode
    && recommendedCommerceMode
    && currentCommerceConfig.activeMode !== recommendedCommerceMode;
  if (shouldSwitchCommerceMode) {
    payload.commerceMode = recommendedCommerceMode;
    payload.commerce = {
      ...currentCommerceConfig,
      activeMode: recommendedCommerceMode,
      updatedAt: FieldValue.serverTimestamp(),
    };
  }

  if (assets.photo) {
    const uploadedPhoto = await uploadProfilePhoto(uid, assets.photo);
    payload.photo = uploadedPhoto.url;
    payload.photoThumb = uploadedPhoto.thumbUrl;
    payload.photoPath = uploadedPhoto.path;
    payload.photoThumbPath = uploadedPhoto.thumbPath;
  }

  if (assets.dorikaCover) {
    const uploadedDorikaCover = await uploadDorikaCoverImage(uid, assets.dorikaCover);
    dorikaProfile = {
      ...dorikaProfile,
      category: businessCategory,
      businessType,
      coverImageUrl: uploadedDorikaCover.url,
      coverImagePath: uploadedDorikaCover.path,
    };
    payload.dorikaProfile = dorikaProfile;
  }

  const paymentQrImagesByMethod = assets.paymentQrImagesByMethod || {};
  const removePaymentQrIds = new Set(assets.removePaymentQrIds || []);

  paymentMethods = await Promise.all(paymentMethods.map(async (method) => {
    const nextMethod = { ...method };

    if (removePaymentQrIds.has(method.id)) {
      nextMethod.qrImageUrl = "";
      nextMethod.qrPath = "";
    }

    const qrFile = paymentQrImagesByMethod[method.id];
    if (qrFile) {
      const uploadedQr = await uploadPaymentQrImage(uid, qrFile, method.id);
      nextMethod.qrImageUrl = uploadedQr.url;
      nextMethod.qrPath = uploadedQr.path;
    }

    return nextMethod;
  }));

  payload.paymentMethods = paymentMethods;
  payload.paymentQrUrl = "";
  payload.paymentQrPath = "";

  if (usernameChanged) {
    payload.lastUsernameChangeAt = Timestamp.fromDate(new Date());
    payload.usernameChangeAvailableAt = permanentTrial ? null : Timestamp.fromDate(getUsernameChangeDate(new Date()));
  }

  await getAdminDb().runTransaction(async (transaction) => {
    if (slug) {
      const usernameRef = usernamesCollection().doc(slug);
      const usernameSnap = await transaction.get(usernameRef);
      const reservedUid = String(usernameSnap.data()?.uid || "").trim();
      if (usernameSnap.exists && reservedUid && reservedUid !== uid) {
        throw new Error("Ese usuario ya está en uso o no está permitido");
      }
    }

    if (usernameChanged && currentSlug) {
      transaction.set(usernamesCollection().doc(currentSlug), {
        uid,
        current: false,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    if (slug) {
      transaction.set(usernamesCollection().doc(slug), {
        uid,
        current: true,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    if (current.publicLinkId) {
      transaction.set(publicLinksCollection().doc(current.publicLinkId), {
        uid,
        username: slug,
        active: true,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    transaction.update(ref, payload);
  });

  const updated = await ref.get();
  let nextUser = await ensureStableProfileAccess({ id: updated.id, ...updated.data() });
  if (assets.photo) {
    const qrData = await generateAndStoreStableQr(nextUser.publicLinkId, {
      logoSource: nextUser.photo || "",
    });
    await ref.set({
      ...qrData,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    nextUser = {
      ...nextUser,
      ...qrData,
    };
  }
  invalidatePublicProfileCache({
    currentUsername: nextUser.usernameLower,
    previousUsername: currentSlug,
    publicLinkId: nextUser.publicLinkId,
  });
  invalidatePublicCommerceCacheForUser(nextUser);
  if (shouldSwitchCommerceMode) {
    invalidatePublicCommerceCacheForMode(nextUser.usernameLower, currentCommerceConfig.activeMode);
  }
  if (billingProfileChanged && hasBillingProfileData(billingProfile)) {
    sendAdminBillingProfileUpdated({ user: nextUser }).catch((error) => {
      console.error("[billing-profile-email]", error?.message || error);
    });
  }
  return nextUser;
}

export function getAccountView(user) {
  const trialEndsAt = toDate(user.trialEndsAt);
  const expiresAt = toDate(user.expiresAt);
  const graceUntil = toDate(user.graceUntil);
  const cancellationAt = toDate(user.cancellationAt);
  const profileLinks = normalizeProfileLinks(user.profileLinks, user.links);
  const paymentMethods = normalizePaymentMethods(user.paymentMethods, profileLinks, user.paymentQrUrl, user.paymentQrPath);
  const primaryWhatsapp = profileLinks.find((item) => item.type === "whatsapp");

  return {
    ...user,
    trialEndsAt,
    expiresAt,
    graceUntil,
    cancellationAt,
    accountStatus: resolveUserAccountStatus(user),
    origin: normalizeOrigin(user.origin),
    ownerName: String(user.ownerName || "").trim(),
    phone: String(user.phone || user.contactCardPhone || user.billingProfile?.billingPhone || "").trim(),
    city: String(user.city || user.billingProfile?.city || "").trim(),
    partnerId: String(user.partnerId || "").trim(),
    adminNotes: String(user.adminNotes || "").trim(),
    startsAt: toDate(user.startsAt || user.createdAt),
    lastPaymentAt: toDate(user.lastPaymentAt),
    amountPaid: Number.isFinite(Number(user.amountPaid)) ? Number(user.amountPaid) : 0,
    backupEmailVerificationExpiresAt: toDate(user.backupEmailVerificationExpiresAt),
    profileLinks,
    paymentMethods,
    billingProfile: normalizeBillingProfile(user.billingProfile),
    businessHours: normalizeBusinessHours(user.businessHours),
    bookingConfig: normalizeBookingConfig(user.bookingConfig || user),
    commerce: normalizeCommerceConfig(user.commerce, user),
    dorikaProfile: normalizeDorikaProfile(user.dorikaProfile, user),
    settings: normalizeAppearance(user.settings),
    customThemes: normalizeCustomThemes(user.customThemes),
    businessCategory: normalizeBusinessCategory(user.businessCategory),
    businessType: normalizeBusinessType(user.businessType || user.dorikaProfile?.businessType || "", user.businessCategory),
    businessHeadline: String(user.businessHeadline || "").trim(),
    businessSubheadline: String(user.businessSubheadline || "").trim(),
    stablePublicUrl: buildStableProfileUrl(user.publicLinkId),
    whatsappUrl: primaryWhatsapp?.url || buildWhatsappLink(user.links?.whatsapp || ""),
  };
}

export async function saveRecoverySettings(uid, input) {
  const ref = usersCollection().doc(uid);
  let verification = null;
  await getAdminDb().runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists) {
      throw new Error("Usuario no encontrado");
    }

    const current = snap.data();
    const nextBackupEmail = String(input.backupEmail || "").trim().toLowerCase();
    const nextPhone = String(input.recoveryPhone || "").trim();
    const backupChanged = nextBackupEmail !== String(current.backupEmail || "").trim().toLowerCase();
    const phoneChanged = nextPhone !== String(current.recoveryPhone || "").trim();

    const payload = {
      backupEmail: nextBackupEmail,
      recoveryPhone: nextPhone,
      recoveryUpdatedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (backupChanged) {
      payload.backupEmailVerified = false;
      if (nextBackupEmail) {
        const now = new Date();
        const token = crypto.randomBytes(24).toString("hex");
        const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24);
        Object.assign(payload, buildRecoveryEmailRateLimitPayload(current, now));
        payload.backupEmailVerificationTokenHash = hashRecoveryToken(token);
        payload.backupEmailVerificationExpiresAt = Timestamp.fromDate(expiresAt);
        verification = { token, expiresAt, email: nextBackupEmail };
      } else {
        payload.backupEmailVerificationTokenHash = null;
        payload.backupEmailVerificationExpiresAt = null;
      }
    }

    if (phoneChanged) {
      payload.recoveryPhoneVerified = false;
    }

    transaction.update(ref, payload);
  });
  const updated = await ref.get();
  return {
    user: { id: updated.id, ...updated.data() },
    verification,
  };
}

export async function resendBackupEmailVerification(uid) {
  const ref = usersCollection().doc(uid);
  let result = null;

  await getAdminDb().runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists) {
      throw new Error("Usuario no encontrado");
    }

    const current = snap.data();
    const backupEmail = String(current.backupEmail || "").trim().toLowerCase();
    if (!backupEmail) {
      throw new Error("Primero agrega un correo de respaldo");
    }

    if (current.backupEmailVerified) {
      throw new Error("El correo de respaldo ya está verificado");
    }

    const now = new Date();
    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24);

    transaction.update(ref, {
      ...buildRecoveryEmailRateLimitPayload(current, now),
      backupEmailVerificationTokenHash: hashRecoveryToken(token),
      backupEmailVerificationExpiresAt: Timestamp.fromDate(expiresAt),
      recoveryUpdatedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    result = {
      email: backupEmail,
      token,
      expiresAt,
      businessName: current.businessName || "",
    };
  });

  return result;
}

export async function verifyBackupEmail(uid, token) {
  const ref = usersCollection().doc(uid);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new Error("Usuario no encontrado");
  }

  const current = snap.data();
  const expiresAt = toDate(current.backupEmailVerificationExpiresAt);
  const expectedHash = current.backupEmailVerificationTokenHash;
  const receivedHash = hashRecoveryToken(String(token || ""));

  if (!expectedHash || !expiresAt || expiresAt < new Date()) {
    throw new Error("El enlace de verificación venció o ya no es válido");
  }

  if (expectedHash !== receivedHash) {
    throw new Error("El enlace de verificación no es válido");
  }

  await ref.update({
    backupEmailVerified: true,
    backupEmailVerificationTokenHash: null,
    backupEmailVerificationExpiresAt: null,
    recoveryUpdatedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const updated = await ref.get();
  return { id: updated.id, ...updated.data() };
}

export async function activateUserSubscription(uid, paymentData) {
  const settings = await getAdminSettings();
  const paymentRef = paymentsCollection().doc(String(paymentData.id));
  const userRef = usersCollection().doc(uid);
  let shouldNotifyAdminPayment = false;

  await getAdminDb().runTransaction(async (transaction) => {
    const [paymentSnap, userSnap] = await Promise.all([
      transaction.get(paymentRef),
      transaction.get(userRef),
    ]);

    if (!userSnap.exists) {
      throw new Error("Usuario no encontrado");
    }

    const current = userSnap.data();
    if (isPermanentTrialAccount(current || {})) {
      return;
    }

    if (paymentSnap.exists && paymentSnap.data()?.activatedAt) {
      return;
    }

    const now = new Date();
    const activeExpiry = toDate(current?.expiresAt);
    const trialExpiry = current?.status === ACCOUNT_STATES.TRIAL ? toDate(current?.trialEndsAt) : null;
    const futureDates = [activeExpiry, trialExpiry].filter((date) => date && date > now);
    const renewalBase = futureDates.length
      ? new Date(Math.max(...futureDates.map((date) => date.getTime())))
      : new Date(now);

    const metadata = paymentData.raw?.metadata || {};
    const activatedPlan = normalizePlan(paymentData.plan || metadata.plan || PLAN_SLUG);
    const paymentType = paymentData.paymentType || metadata.payment_type || metadata.paymentType || "subscription";
    const metadataNewExpiresAt = toDate(paymentData.newExpiresAt || metadata.new_expires_at || metadata.newExpiresAt);
    assertNoActivePlanDowngrade({
      status: current?.status,
      currentPlan: normalizePlan(current?.plan || current?.status),
      requestedPlan: activatedPlan,
      currentExpiresAt: activeExpiry,
      now,
    });
    const expiresAt = paymentType === "upgrade" && metadataNewExpiresAt
      ? metadataNewExpiresAt
      : new Date(renewalBase);
    if (!(paymentType === "upgrade" && metadataNewExpiresAt)) {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }
    const modulePayload = buildModuleAccessPayload(current, {
      plan: activatedPlan,
      selectedModule: paymentData.module || metadata.module || current?.commercialModule,
    });

    const payload = {
      plan: activatedPlan,
      ...modulePayload,
      status: ACCOUNT_STATES.ACTIVE,
      accountStatus: "active",
      trialEndsAt: null,
      expiresAt: Timestamp.fromDate(expiresAt),
      graceUntil: null,
      cancellationAt: null,
      paymentPrice: paymentData.amount || settings.annualPrice,
      startsAt: current?.startsAt || Timestamp.fromDate(now),
      lastPaymentAt: Timestamp.fromDate(now),
      amountPaid: paymentData.amount || settings.annualPrice,
      billingPaymentType: paymentType,
      billingFromPlan: paymentData.fromPlan || metadata.from_plan || metadata.fromPlan || "",
      billingToPlan: paymentData.toPlan || metadata.to_plan || metadata.toPlan || activatedPlan,
      billingCreditAmount: Number(paymentData.creditAmount ?? metadata.credit_amount ?? metadata.creditAmount ?? 0) || 0,
      origin: normalizeOrigin(current?.origin),
      partnerId: String(current?.partnerId || "").trim(),
      expiryReminderSentAt: null,
      suspensionEmailSentAt: null,
      updatedAt: FieldValue.serverTimestamp(),
    };

    transaction.update(userRef, payload);
    transaction.set(paymentRef, {
      ...paymentData,
      uid,
      activatedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      ...(paymentSnap.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    }, { merge: true });
    shouldNotifyAdminPayment = true;
  });

  const updatedUser = await getUserByUid(uid);
  invalidatePublicProfileCache({
    currentUsername: updatedUser?.usernameLower,
    publicLinkId: updatedUser?.publicLinkId,
  });
  if (shouldNotifyAdminPayment && updatedUser) {
    sendAdminPaymentApproved({ user: updatedUser, payment: paymentData }).catch((error) => {
      console.error("[billing-payment-email]", error?.message || error);
    });
  }
}

export async function storePaymentAttempt(uid, paymentData) {
  const ref = paymentsCollection().doc(paymentData.id);
  const snap = await ref.get();

  await ref.set({
    ...paymentData,
    uid,
    updatedAt: FieldValue.serverTimestamp(),
    ...(snap.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
  }, { merge: true });
}

export async function enableUserModule(uid, module) {
  const normalizedModule = normalizeKlicorModule(module);
  if (!normalizedModule) {
    throw new Error("Selecciona un módulo válido.");
  }

  const ref = usersCollection().doc(uid);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new Error("Usuario no encontrado");
  }

  const current = snap.data();
  if (!["trial", "active"].includes(current.status)) {
    throw new Error("Tu cuenta no tiene permisos para habilitar módulos.");
  }

  const plan = normalizeKlicorPlan(current.plan || current.status);
  if (plan === "basic") {
    throw new Error("El plan Básico no incluye módulos operativos.");
  }
  if (plan === "commercial") {
    throw new Error("En Comercial solo puedes usar un módulo. Actualiza a Plus para usar Comercio y Agenda.");
  }

  if (!isBusinessModuleEligible(current, normalizedModule)) {
    const label = normalizedModule === "booking" ? "Agenda" : "Comercio";
    throw new Error(`${label} no está disponible para este tipo de negocio.`);
  }

  const currentAccess = resolveUserModuleAccess(current);
  const nextAccess = {
    ...currentAccess,
    [normalizedModule]: true,
  };

  await ref.set({
    moduleAccess: nextAccess,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  const updatedUser = await getUserByUid(uid);
  invalidatePublicProfileCache({
    currentUsername: updatedUser?.usernameLower,
    publicLinkId: updatedUser?.publicLinkId,
  });
  invalidatePublicCommerceCacheForUser(updatedUser);
  if (updatedUser?.usernameLower) revalidateTag(`public-booking:${updatedUser.usernameLower}`);
  return updatedUser;
}

export async function updateBillingPrice(price) {
  const current = await getAdminSettings();
  const next = normalizeAdminSettings({
    ...current,
    annualPrice: price,
  });
  await settingsCollection().doc("billing").set({
    ...next,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

export async function trackClick(username, button) {
  const slug = sanitizeSlug(username);
  const metricKey = normalizeAnalyticsKey(button);
  if (!slug || !metricKey) return;

  await analyticsCollection().doc(`${slug}_${metricKey}`).set({
    username: slug,
    button: metricKey,
    total: FieldValue.increment(1),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

export async function runBillingSweep() {
  const settings = await getAdminSettings();
  const normalizedSettings = normalizeAdminSettings(settings);
  const now = new Date();
  const activeLike = await usersCollection().where("status", "in", [ACCOUNT_STATES.TRIAL, ACCOUNT_STATES.ACTIVE, ACCOUNT_STATES.GRACE_PERIOD, ACCOUNT_STATES.SUSPENDED]).get();
  const actions = [];

  for (const doc of activeLike.docs) {
    const user = doc.data();

    if (isPermanentTrialAccount(user)) {
      continue;
    }

    const trialEndsAt = toDate(user.trialEndsAt);
    const expiresAt = toDate(user.expiresAt);
    const graceUntil = toDate(user.graceUntil);
    const cancellationAt = toDate(user.cancellationAt);

    if (user.status === ACCOUNT_STATES.TRIAL && trialEndsAt && now > trialEndsAt) {
      await doc.ref.update({
        status: ACCOUNT_STATES.GRACE_PERIOD,
        accountStatus: "pending_payment",
        graceUntil: Timestamp.fromDate(addDaysFrom(trialEndsAt, normalizedSettings.graceDays)),
        cancellationAt: Timestamp.fromDate(addDaysFrom(trialEndsAt, normalizedSettings.hardSuspensionDays)),
        updatedAt: FieldValue.serverTimestamp(),
      });
      invalidatePublicProfileCache({
        currentUsername: user.usernameLower,
        publicLinkId: user.publicLinkId,
      });
      actions.push({ uid: user.uid, action: "trial_to_grace" });
      continue;
    }

    if (user.status === ACCOUNT_STATES.ACTIVE && expiresAt && now > expiresAt) {
      await doc.ref.update({
        status: ACCOUNT_STATES.GRACE_PERIOD,
        accountStatus: "pending_payment",
        graceUntil: Timestamp.fromDate(addDaysFrom(expiresAt, normalizedSettings.graceDays)),
        cancellationAt: Timestamp.fromDate(addDaysFrom(expiresAt, normalizedSettings.hardSuspensionDays)),
        updatedAt: FieldValue.serverTimestamp(),
      });
      invalidatePublicProfileCache({
        currentUsername: user.usernameLower,
        publicLinkId: user.publicLinkId,
      });
      actions.push({ uid: user.uid, action: "active_to_grace" });
      continue;
    }

    if (user.status === ACCOUNT_STATES.GRACE_PERIOD && graceUntil && now > graceUntil) {
      await doc.ref.update({
        status: ACCOUNT_STATES.SUSPENDED,
        accountStatus: "suspended",
        updatedAt: FieldValue.serverTimestamp(),
      });
      invalidatePublicProfileCache({
        currentUsername: user.usernameLower,
        publicLinkId: user.publicLinkId,
      });
      actions.push({ uid: user.uid, action: "grace_to_suspended" });
      continue;
    }

    if (user.status === ACCOUNT_STATES.SUSPENDED && cancellationAt && now > cancellationAt) {
      await doc.ref.update({
        status: ACCOUNT_STATES.CANCELLED,
        accountStatus: "expired",
        updatedAt: FieldValue.serverTimestamp(),
      });
      invalidatePublicProfileCache({
        currentUsername: user.usernameLower,
        publicLinkId: user.publicLinkId,
      });
      actions.push({ uid: user.uid, action: "suspended_to_cancelled" });
    }
  }

  return actions;
}
