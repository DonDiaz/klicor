import { FieldValue, Timestamp } from "firebase-admin/firestore";
import crypto from "node:crypto";
import QRCode from "qrcode";
import { ACCOUNT_STATES, GRACE_DAYS, HARD_SUSPENSION_DAYS, PLAN_SLUG, RESERVED_USERNAMES, TRIAL_DAYS } from "@/lib/constants";
import { getAdminDb, getAdminStorage } from "@/lib/firebase-admin";
import { buildStableProfileUrl } from "@/lib/public-profile-links";
import { invalidatePublicProfileCache } from "@/lib/public-profiles";
import { normalizeProfileLinks } from "@/lib/profile-links";
import { APPEARANCE_DEFAULTS, normalizeAppearance } from "@/lib/theme-system";
import { buildWhatsappLink, getCancellationDate, getGraceEnd, getTrialEnd, getUsernameChangeDate, sanitizeSlug, toDate } from "@/lib/utils";

const PUBLIC_LINK_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";
const PUBLIC_LINK_LENGTH = 6;

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

function hashRecoveryToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function isPermanentTrialAccount(user = {}) {
  return user.role === "admin" || user.email === process.env.ADMIN_EMAIL;
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

export async function generateAndStoreStableQr(publicLinkId) {
  if (!publicLinkId) {
    throw new Error("No existe un identificador permanente para el QR");
  }

  const qrPath = `qr/${publicLinkId}.png`;
  const url = buildStableProfileUrl(publicLinkId);
  const pngBuffer = await QRCode.toBuffer(url, {
    type: "png",
    width: 400,
    errorCorrectionLevel: "M",
    margin: 2,
  });

  const bucket = getAdminStorage();
  await bucket.file(qrPath).save(pngBuffer, {
    contentType: "image/png",
    resumable: false,
    public: true,
  });

  return {
    qrPath,
    qrUrl: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(qrPath)}?alt=media`,
    qrVersion: "stable",
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
    (nextUser.qrVersion !== "stable" || !nextUser.qrPath || !nextUser.qrUrl)
  ) {
    const qrData = await generateAndStoreStableQr(nextUser.publicLinkId);
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
    const data = {
      annualPrice: 55000,
      currency: "COP",
      trialDays: TRIAL_DAYS,
      graceDays: GRACE_DAYS,
      hardSuspensionDays: HARD_SUSPENSION_DAYS,
      updatedAt: FieldValue.serverTimestamp(),
    };
    await ref.set(data);
    return data;
  }
  return snap.data();
}

export async function ensureUserProfile({ uid, email, name = "", photoURL = "", role = "user" }) {
  const ref = usersCollection().doc(uid);
  const snap = await ref.get();
  const now = new Date();

  if (snap.exists) {
    const current = snap.data();

    if (isPermanentTrialAccount({ ...current, email, role })) {
      const updates = {
        email,
        role: "admin",
        plan: "trial",
        status: ACCOUNT_STATES.TRIAL,
        trialEndsAt: null,
        expiresAt: null,
        graceUntil: null,
        cancellationAt: null,
        paymentPrice: null,
        updatedAt: FieldValue.serverTimestamp(),
      };
      await ref.set(updates, { merge: true });
      return ensureStableProfileAccess({ id: snap.id, ...current, ...updates });
    }

    return ensureStableProfileAccess({ id: snap.id, ...current });
  }

  const permanentTrial = isPermanentTrialAccount({ email, role });
  const data = {
    uid,
    email,
    username: "",
    usernameLower: "",
    businessName: name || "Tu negocio",
    photo: photoURL || "",
    links: {
      whatsapp: "",
      instagram: "",
      facebook: "",
      tiktok: "",
      website: "",
    },
    profileLinks: [],
    paymentQrUrl: "",
    paymentQrPath: "",
    qrUrl: "",
    qrPath: "",
    plan: "trial",
    role: permanentTrial ? "admin" : role,
    status: ACCOUNT_STATES.TRIAL,
    trialEndsAt: permanentTrial ? null : Timestamp.fromDate(getTrialEnd(now)),
    expiresAt: null,
    graceUntil: null,
    cancellationAt: null,
    lastUsernameChangeAt: null,
    usernameChangeAvailableAt: null,
    publicLinkId: await createUniquePublicLinkId(uid),
    paymentPrice: null,
    emailVerified: false,
    backupEmail: "",
    backupEmailVerified: false,
    backupEmailVerificationTokenHash: null,
    backupEmailVerificationExpiresAt: null,
    recoveryPhone: "",
    recoveryPhoneVerified: false,
    recoveryUpdatedAt: null,
    settings: APPEARANCE_DEFAULTS,
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

export async function getUserByUid(uid) {
  const snap = await usersCollection().doc(uid).get();
  if (!snap.exists) return null;
  return ensureStableProfileAccess({ id: snap.id, ...snap.data() });
}

export async function getUserByUsername(username) {
  const slug = sanitizeSlug(username);
  const usernameSnap = await usernamesCollection().doc(slug).get();
  if (!usernameSnap.exists) return null;
  return getUserByUid(usernameSnap.data().uid);
}

export async function getUserByPublicLinkId(publicLinkId) {
  const slug = String(publicLinkId || "").trim().toLowerCase();
  if (!slug) return null;

  const snap = await publicLinksCollection().doc(slug).get();
  if (!snap.exists || snap.data()?.active === false) return null;

  return getUserByUid(snap.data().uid);
}

export async function isUsernameAvailable(username, currentUid) {
  const slug = sanitizeSlug(username);
  if (!slug || RESERVED_USERNAMES.includes(slug)) return false;
  const snap = await usernamesCollection().doc(slug).get();
  if (!snap.exists) return true;
  return snap.data().uid === currentUid;
}

export async function uploadProfilePhoto(uid, file) {
  return uploadImageAsset({
    uid,
    file,
    directory: "profiles",
    filename: "cover",
    maxSizeBytes: 2 * 1024 * 1024,
    sizeErrorMessage: "La imagen debe pesar menos de 2MB",
  });
}

export async function uploadPaymentQrImage(uid, file) {
  return uploadImageAsset({
    uid,
    file,
    directory: "payment-qr",
    filename: "official",
    maxSizeBytes: 4 * 1024 * 1024,
    sizeErrorMessage: "El QR oficial debe pesar menos de 4MB",
  });
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
    instagram: profileLinks.find((item) => item.type === "instagram")?.value || "",
    facebook: profileLinks.find((item) => item.type === "facebook")?.value || "",
    tiktok: profileLinks.find((item) => item.type === "tiktok")?.value || "",
    website: profileLinks.find((item) => item.type === "website")?.value || "",
  };
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
    const available = await isUsernameAvailable(slug, uid);
    if (!available) {
      throw new Error("Ese usuario ya está en uso o no está permitido");
    }
    const nextChangeAllowed = toDate(current.usernameChangeAvailableAt);
    if (!permanentTrial && nextChangeAllowed && new Date() < nextChangeAllowed) {
      throw new Error("Solo puedes cambiar el usuario una vez cada 30 días");
    }
  }

  const profileLinks = normalizeProfileLinks(input.profileLinks);
  const currentProfileLinks = normalizeProfileLinks(current.profileLinks, current.links);
  const nextPaymentKey = profileLinks.find((item) => item.type === "payment_key")?.value || "";
  const currentPaymentKey = currentProfileLinks.find((item) => item.type === "payment_key")?.value || "";
  const paymentKeyChanged = nextPaymentKey !== currentPaymentKey;
  const settings = normalizeAppearance(input.appearance);
  const payload = {
    businessName: input.businessName,
    username: slug,
    usernameLower: slug,
    profileLinks,
    links: toLegacyLinks(profileLinks),
    settings,
    onboardingCompleted: true,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (assets.photo) {
    const uploadedPhoto = await uploadProfilePhoto(uid, assets.photo);
    payload.photo = uploadedPhoto.url;
  }

  if (assets.paymentQrImage) {
    const uploadedQr = await uploadPaymentQrImage(uid, assets.paymentQrImage);
    payload.paymentQrUrl = uploadedQr.url;
    payload.paymentQrPath = uploadedQr.path;
  } else if (!nextPaymentKey || paymentKeyChanged) {
    payload.paymentQrUrl = "";
    payload.paymentQrPath = "";
  }

  if (usernameChanged) {
    payload.lastUsernameChangeAt = Timestamp.fromDate(new Date());
    payload.usernameChangeAvailableAt = permanentTrial ? null : Timestamp.fromDate(getUsernameChangeDate(new Date()));
  }

  await getAdminDb().runTransaction(async (transaction) => {
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
  const nextUser = await ensureStableProfileAccess({ id: updated.id, ...updated.data() });
  invalidatePublicProfileCache({
    currentUsername: nextUser.usernameLower,
    previousUsername: currentSlug,
    publicLinkId: nextUser.publicLinkId,
  });
  return nextUser;
}

export function getAccountView(user) {
  const trialEndsAt = toDate(user.trialEndsAt);
  const expiresAt = toDate(user.expiresAt);
  const graceUntil = toDate(user.graceUntil);
  const cancellationAt = toDate(user.cancellationAt);
  const profileLinks = normalizeProfileLinks(user.profileLinks, user.links);
  const primaryWhatsapp = profileLinks.find((item) => item.type === "whatsapp");

  return {
    ...user,
    trialEndsAt,
    expiresAt,
    graceUntil,
    cancellationAt,
    backupEmailVerificationExpiresAt: toDate(user.backupEmailVerificationExpiresAt),
    profileLinks,
    settings: normalizeAppearance(user.settings),
    stablePublicUrl: buildStableProfileUrl(user.publicLinkId),
    whatsappUrl: primaryWhatsapp?.url || buildWhatsappLink(user.links?.whatsapp || ""),
  };
}

export async function saveRecoverySettings(uid, input) {
  const ref = usersCollection().doc(uid);
  const snap = await ref.get();
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

  let verification = null;

  if (backupChanged) {
    payload.backupEmailVerified = false;
    if (nextBackupEmail) {
      const token = crypto.randomBytes(24).toString("hex");
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
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

  await ref.update(payload);
  const updated = await ref.get();
  return {
    user: { id: updated.id, ...updated.data() },
    verification,
  };
}

export async function resendBackupEmailVerification(uid) {
  const ref = usersCollection().doc(uid);
  const snap = await ref.get();
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

  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

  await ref.update({
    backupEmailVerificationTokenHash: hashRecoveryToken(token),
    backupEmailVerificationExpiresAt: Timestamp.fromDate(expiresAt),
    recoveryUpdatedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return {
    email: backupEmail,
    token,
    expiresAt,
    businessName: current.businessName || "",
  };
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

    const expiresAt = new Date(renewalBase);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const payload = {
      plan: PLAN_SLUG,
      status: ACCOUNT_STATES.ACTIVE,
      trialEndsAt: null,
      expiresAt: Timestamp.fromDate(expiresAt),
      graceUntil: null,
      cancellationAt: null,
      paymentPrice: paymentData.amount || settings.annualPrice,
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
  });

  const updatedUser = await getUserByUid(uid);
  invalidatePublicProfileCache({
    currentUsername: updatedUser?.usernameLower,
    publicLinkId: updatedUser?.publicLinkId,
  });
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

export async function updateBillingPrice(price) {
  await settingsCollection().doc("billing").set({
    annualPrice: price,
    currency: "COP",
    trialDays: TRIAL_DAYS,
    graceDays: GRACE_DAYS,
    hardSuspensionDays: HARD_SUSPENSION_DAYS,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

export async function trackClick(username, button) {
  const slug = sanitizeSlug(username);
  await analyticsCollection().doc(`${slug}_${button}`).set({
    username: slug,
    button,
    total: FieldValue.increment(1),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

export async function runBillingSweep() {
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
        graceUntil: Timestamp.fromDate(getGraceEnd(trialEndsAt)),
        cancellationAt: Timestamp.fromDate(getCancellationDate(trialEndsAt)),
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
        graceUntil: Timestamp.fromDate(getGraceEnd(expiresAt)),
        cancellationAt: Timestamp.fromDate(getCancellationDate(expiresAt)),
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
