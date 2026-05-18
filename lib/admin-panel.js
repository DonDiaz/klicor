import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import {
  ADMIN_ACCOUNT_STATUS_OPTIONS,
  ADMIN_ORIGIN_OPTIONS,
  ADMIN_PLAN_OPTIONS,
  ADMIN_SETTINGS_DEFAULTS,
  normalizeAccountStatus,
  normalizeAdminSettings,
  normalizeOrigin,
  normalizePlan,
  resolveAccountStatusLabel,
  resolveAccountStatusTone,
  resolveOriginLabel,
  resolvePlanAnnualPrice,
  resolvePlanLabel,
  resolveUserAccountStatus,
  getPlanAccessDays,
} from "@/lib/admin-config";
import { normalizeBusinessCategory, resolveBusinessCategoryLabel, resolveBusinessTypeLabel } from "@/lib/business-categories";
import { ACCOUNT_STATES } from "@/lib/constants";
import { getAdminAuth, getAdminDb, getAdminStorage } from "@/lib/firebase-admin";
import { getAccountView, getAdminSettings } from "@/lib/firestore";
import { listAgencyAccounts } from "@/lib/agency";
import { buildStableProfileUrl, buildVanityProfileUrl } from "@/lib/public-profile-links";
import { invalidatePublicProfileCache } from "@/lib/public-profiles";
import { normalizeKlicorModule, resolveDefaultModuleAccess } from "@/lib/plans";
import { formatDate, toDate } from "@/lib/utils";

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

function partnersCollection() {
  return getAdminDb().collection("partners");
}

function adminLogsCollection() {
  return getAdminDb().collection("adminLogs");
}

async function deleteQueryDocuments(query) {
  const snapshot = await query.get().catch(() => ({ docs: [] }));
  if (!snapshot.docs?.length) {
    return 0;
  }

  const database = getAdminDb();
  let deleted = 0;

  for (let index = 0; index < snapshot.docs.length; index += 400) {
    const batch = database.batch();
    const chunk = snapshot.docs.slice(index, index + 400);
    chunk.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    deleted += chunk.length;
  }

  return deleted;
}

async function deleteUserStorageAssets(uid, user = {}) {
  const bucket = getAdminStorage();
  const deletions = [];

  if (user.publicLinkId) {
    deletions.push(bucket.file(`qr/${user.publicLinkId}.png`).delete({ ignoreNotFound: true }));
  }

  deletions.push(bucket.deleteFiles({ prefix: `profiles/${uid}/`, force: true }));
  deletions.push(bucket.deleteFiles({ prefix: `payment-qr/${uid}/`, force: true }));

  const results = await Promise.allSettled(deletions);
  const rejected = results.find((result) => result.status === "rejected");
  if (rejected) {
    throw rejected.reason;
  }
}

function addDaysFrom(date = new Date(), days = 0) {
  const next = new Date(date);
  next.setDate(next.getDate() + Number(days || 0));
  return next;
}

function getDateIso(date) {
  return date ? date.toISOString().slice(0, 10) : "";
}

function formatCurrency(amount, currency = "COP") {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

function resolveOwnerName(user = {}) {
  return String(user.ownerName || user.contactCardName || "").trim();
}

function resolvePhone(user = {}) {
  return String(user.phone || user.contactCardPhone || user.billingProfile?.billingPhone || "").trim();
}

function resolveCity(user = {}) {
  return String(user.city || user.billingProfile?.city || "").trim();
}

function resolveNextExpiry(user = {}) {
  return toDate(user.expiresAt || user.trialEndsAt || user.graceUntil || user.cancellationAt);
}

function estimateAnnualValue(user = {}, settings = ADMIN_SETTINGS_DEFAULTS) {
  const plan = normalizePlan(user.plan);
  const paidAmount = Number(user.amountPaid || user.paymentPrice || 0);

  if (plan === "trial" || plan === "courtesy") {
    return 0;
  }

  if (paidAmount > 0) {
    return paidAmount;
  }

  return resolvePlanAnnualPrice(plan, settings);
}

function resolveDefaultPriceForPlan(plan, settings = ADMIN_SETTINGS_DEFAULTS) {
  const normalizedPlan = normalizePlan(plan);
  if (normalizedPlan === "courtesy" || normalizedPlan === "trial") {
    return 0;
  }
  return resolvePlanAnnualPrice(normalizedPlan, settings);
}

function buildAdminModuleAccessPayload(current = {}, plan = "", selectedModule = "") {
  const normalizedPlan = normalizePlan(plan || current.plan || "trial");
  const module = normalizeKlicorModule(selectedModule || current.commercialModule || current.module);
  const moduleAccess = resolveDefaultModuleAccess({
    plan: normalizedPlan,
    businessCategory: current.businessCategory,
    selectedModule: module,
  });

  return {
    moduleAccess,
    commercialModule: normalizedPlan === "commercial" || normalizedPlan === "institutional"
      ? module || (moduleAccess.commerce ? "commerce" : "booking")
      : "",
  };
}

function buildMonthlyGrowth(users = []) {
  const now = new Date();
  const items = [];

  for (let offset = 5; offset >= 0; offset -= 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;
    const total = users.filter((user) => {
      const createdAt = user.createdAt;
      if (!createdAt) return false;
      return `${createdAt.getFullYear()}-${createdAt.getMonth()}` === key;
    }).length;

    items.push({
      key,
      label: monthDate.toLocaleDateString("es-CO", { month: "short" }),
      total,
    });
  }

  return items;
}

function buildAdminUserSummary(user = {}, settings = ADMIN_SETTINGS_DEFAULTS, baseUrl = "") {
  const account = getAccountView(user);
  const createdAt = toDate(account.createdAt);
  const startsAt = toDate(account.startsAt || account.createdAt);
  const expiresAt = resolveNextExpiry(account);
  const lastPaymentAt = toDate(account.lastPaymentAt);
  const accountStatus = normalizeAccountStatus(account.accountStatus || resolveUserAccountStatus(account));
  const plan = normalizePlan(account.plan);
  const origin = normalizeOrigin(account.origin);
  const daysToExpiry = expiresAt
    ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    uid: account.uid,
    businessName: account.businessName || "Sin nombre",
    ownerName: resolveOwnerName(account),
    email: String(account.email || "").trim(),
    phone: resolvePhone(account),
    city: resolveCity(account),
    businessCategory: normalizeBusinessCategory(account.businessCategory),
    businessTypeLabel: resolveBusinessTypeLabel(account.businessType, account.businessCategory) || resolveBusinessCategoryLabel(account.businessCategory),
    origin,
    originLabel: resolveOriginLabel(origin),
    partnerId: String(account.partnerId || "").trim(),
    accountStatus,
    accountStatusLabel: resolveAccountStatusLabel(accountStatus),
    accountStatusTone: resolveAccountStatusTone(accountStatus),
    plan,
    planLabel: resolvePlanLabel(plan),
    createdAt,
    createdAtMs: createdAt?.getTime?.() || 0,
    createdAtIso: getDateIso(createdAt),
    createdAtLabel: createdAt ? formatDate(createdAt) : "Sin fecha",
    startsAt,
    startsAtMs: startsAt?.getTime?.() || 0,
    startsAtIso: getDateIso(startsAt),
    startsAtLabel: startsAt ? formatDate(startsAt) : "Sin fecha",
    expiresAt,
    expiresAtMs: expiresAt?.getTime?.() || 0,
    expiresAtIso: getDateIso(expiresAt),
    expiresAtLabel: expiresAt ? formatDate(expiresAt) : "Sin fecha",
    lastPaymentAt,
    lastPaymentAtMs: lastPaymentAt?.getTime?.() || 0,
    lastPaymentAtLabel: lastPaymentAt ? formatDate(lastPaymentAt) : "Sin pago",
    amountPaid: Number(account.amountPaid || account.paymentPrice || 0),
    amountPaidLabel: formatCurrency(Number(account.amountPaid || account.paymentPrice || 0), settings.currency),
    estimatedAnnualValue: estimateAnnualValue(account, settings),
    status: account.status,
    username: account.usernameLower || "",
    publicUrl: account.usernameLower ? buildVanityProfileUrl(account.usernameLower, baseUrl) : buildStableProfileUrl(account.publicLinkId, baseUrl),
    publicLinkId: account.publicLinkId || "",
    photo: account.photo || "",
    notes: String(account.adminNotes || "").trim(),
    daysToExpiry,
    renewSoon: Number.isFinite(daysToExpiry) && daysToExpiry >= 0 && daysToExpiry <= settings.renewalAlertDays,
    expired: accountStatus === "expired",
    pendingRenewal: accountStatus === "pending_payment",
  };
}

function buildAdminMetrics(users = [], settings = ADMIN_SETTINGS_DEFAULTS) {
  const totalUsers = users.length;
  const usersInTrial = users.filter((user) => user.accountStatus === "trial").length;
  const paidActiveUsers = users.filter((user) => user.accountStatus === "active" && !["trial", "courtesy"].includes(user.plan)).length;
  const expiredUsers = users.filter((user) => user.accountStatus === "expired").length;
  const suspendedUsers = users.filter((user) => user.accountStatus === "suspended").length;
  const pendingPaymentUsers = users.filter((user) => user.accountStatus === "pending_payment").length;
  const renewSoonUsers = users.filter((user) => user.renewSoon).length;
  const estimatedAnnualRevenue = users.reduce((sum, user) => sum + Number(user.estimatedAnnualValue || 0), 0);

  return {
    totalUsers,
    usersInTrial,
    paidActiveUsers,
    expiredUsers,
    suspendedUsers,
    pendingPaymentUsers,
    renewSoonUsers,
    estimatedAnnualRevenue,
    estimatedAnnualRevenueLabel: formatCurrency(estimatedAnnualRevenue, settings.currency),
    byOrigin: ADMIN_ORIGIN_OPTIONS.map((option) => ({
      key: option.value,
      label: option.label,
      total: users.filter((user) => user.origin === option.value).length,
    })),
    byStatus: ADMIN_ACCOUNT_STATUS_OPTIONS.map((option) => ({
      key: option.value,
      label: option.label,
      total: users.filter((user) => user.accountStatus === option.value).length,
    })),
    monthlyGrowth: buildMonthlyGrowth(users),
  };
}

function buildRenewalBuckets(users = [], settings = ADMIN_SETTINGS_DEFAULTS) {
  return {
    dueToday: users.filter((user) => user.daysToExpiry === 0),
    dueSoon: users.filter((user) => Number.isFinite(user.daysToExpiry) && user.daysToExpiry > 0 && user.daysToExpiry <= settings.renewalAlertDays),
    overdue: users.filter((user) => user.accountStatus === "expired" || user.accountStatus === "pending_payment"),
  };
}

function sortByNewest(a, b, field = "createdAt") {
  return (b?.[field]?.getTime?.() || 0) - (a?.[field]?.getTime?.() || 0);
}

function normalizeLogItem(doc) {
  const data = doc.data();
  const createdAt = toDate(data.createdAt);
  return {
    id: doc.id,
    action: data.action || "",
    summary: data.summary || "",
    actorUid: data.actorUid || "",
    actorEmail: data.actorEmail || "",
    targetUid: data.targetUid || "",
    metadata: data.metadata || {},
    createdAt,
    createdAtLabel: createdAt ? formatDate(createdAt) : "Sin fecha",
  };
}

export async function logAdminAction({ actor, action, summary, targetUid = "", metadata = {} }) {
  await adminLogsCollection().add({
    action,
    summary,
    targetUid,
    actorUid: actor?.uid || "",
    actorEmail: actor?.email || "",
    metadata,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function getAdminPanelSnapshot({ baseUrl = "" } = {}) {
  const [settings, usersSnap, partnersSnap, agencies] = await Promise.all([
    getAdminSettings(),
    usersCollection().get(),
    partnersCollection().limit(50).get().catch(() => ({ docs: [] })),
    listAgencyAccounts().catch(() => []),
  ]);

  const users = usersSnap.docs
    .map((doc) => buildAdminUserSummary({ uid: doc.id, ...doc.data() }, settings, baseUrl))
    .sort((left, right) => sortByNewest(left, right));

  return {
    settings,
    metrics: buildAdminMetrics(users, settings),
    users,
    agencies,
    renewalBuckets: buildRenewalBuckets(users, settings),
    overview: {
      partnerCount: partnersSnap.docs.length,
    },
  };
}

export async function saveAdminSettings(input, actor) {
  const current = await getAdminSettings();
  const next = normalizeAdminSettings({
    ...current,
    ...input,
  });

  await settingsCollection().doc("billing").set({
    ...next,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  await logAdminAction({
    actor,
    action: "settings.updated",
    summary: "Actualizó la configuración general del sistema.",
    metadata: {
      annualPrice: next.annualPrice,
      trialDays: next.trialDays,
      renewalAlertDays: next.renewalAlertDays,
    },
  });

  return next;
}

export async function getAdminUserDetail(uid, { baseUrl = "" } = {}) {
  const [settings, userSnap, paymentsSnap, logsSnap] = await Promise.all([
    getAdminSettings(),
    usersCollection().doc(uid).get(),
    paymentsCollection().where("uid", "==", uid).limit(50).get(),
    adminLogsCollection().where("targetUid", "==", uid).limit(50).get().catch(() => ({ docs: [] })),
  ]);

  if (!userSnap.exists) {
    throw new Error("Usuario no encontrado");
  }

  const rawUser = { uid: userSnap.id, ...userSnap.data() };
  const summary = buildAdminUserSummary(rawUser, settings, baseUrl);
  const account = getAccountView(rawUser);

  const payments = paymentsSnap.docs
    .map((doc) => {
      const data = doc.data();
      const createdAt = toDate(data.activatedAt || data.createdAt || data.updatedAt);
      return {
        id: doc.id,
        amount: Number(data.amount || 0),
        amountLabel: formatCurrency(Number(data.amount || 0), settings.currency),
        status: data.status || "",
        method: data.method || (data.manual ? "manual" : "mercado_pago"),
        notes: data.notes || data.statusDetail || "",
        createdAt,
        createdAtLabel: createdAt ? formatDate(createdAt) : "Sin fecha",
      };
    })
    .sort((left, right) => sortByNewest(left, right, "createdAt"));

  const logs = logsSnap.docs
    .map(normalizeLogItem)
    .sort((left, right) => sortByNewest(left, right, "createdAt"));

  return {
    settings,
    user: {
      ...summary,
      qrUrl: account.qrUrl || "",
      profileLinks: account.profileLinks || [],
      paymentMethods: account.paymentMethods || [],
      billingProfile: account.billingProfile,
      stablePublicUrl: account.stablePublicUrl || "",
      photo: account.photo || "",
    },
    payments,
    logs,
  };
}

export async function updateAdminUserDetails(uid, input, actor, { baseUrl = "" } = {}) {
  const ref = usersCollection().doc(uid);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new Error("Usuario no encontrado");
  }

  const current = snap.data();
  const nextPlan = normalizePlan(input.plan || current.plan);
  const nextStatus = resolveUserAccountStatus({
    ...current,
    plan: nextPlan,
  });

  await ref.set({
    businessName: String(input.businessName || current.businessName || "").trim(),
    ownerName: String(input.ownerName || "").trim(),
    phone: String(input.phone || "").trim(),
    city: String(input.city || "").trim(),
    businessCategory: normalizeBusinessCategory(input.businessCategory || current.businessCategory),
    origin: normalizeOrigin(input.origin || current.origin),
    partnerId: String(input.partnerId || "").trim(),
    plan: nextPlan,
    accountStatus: nextPlan === "courtesy" && nextStatus === "active" ? "courtesy" : nextStatus,
    adminNotes: String(input.adminNotes || "").trim(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  await logAdminAction({
    actor,
    action: "user.details_updated",
    summary: `Actualizó los datos administrativos de ${current.businessName || current.email || uid}.`,
    targetUid: uid,
    metadata: {
      origin: normalizeOrigin(input.origin || current.origin),
      plan: nextPlan,
    },
  });

  return getAdminUserDetail(uid, { baseUrl });
}

function parseDateInput(value) {
  const next = String(value || "").trim();
  if (!next) return null;
  const date = new Date(`${next}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function updateAdminUserAccess(uid, input, actor, { baseUrl = "" } = {}) {
  const settings = await getAdminSettings();
  const ref = usersCollection().doc(uid);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new Error("Usuario no encontrado");
  }

  const current = snap.data();
  const accountStatus = normalizeAccountStatus(input.accountStatus || current.accountStatus || resolveUserAccountStatus(current));
  const requestedPlan = normalizePlan(input.plan || current.plan);
  const plan = accountStatus === "trial"
    ? "trial"
    : requestedPlan === "trial"
      ? "commercial"
      : requestedPlan;
  const startsAt = parseDateInput(input.startsAt) || toDate(current.startsAt || current.createdAt) || new Date();
  const requestedExpiry = parseDateInput(input.expiresAt);
  const defaultDurationDays = getPlanAccessDays(plan, settings);
  const futureBase = toDate(current.expiresAt || current.trialEndsAt);
  const renewalBase = futureBase && futureBase > new Date() ? futureBase : new Date();

  let payload = {
    plan,
    ...buildAdminModuleAccessPayload(current, plan, input.module),
    accountStatus,
    startsAt: Timestamp.fromDate(startsAt),
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (accountStatus === "trial") {
    payload = {
      ...payload,
      plan: "trial",
      status: ACCOUNT_STATES.TRIAL,
      trialEndsAt: Timestamp.fromDate(requestedExpiry || addDaysFrom(startsAt, settings.trialDays)),
      expiresAt: null,
      graceUntil: null,
      cancellationAt: null,
      paymentPrice: null,
    };
  } else if (accountStatus === "active" || accountStatus === "courtesy") {
    const nextExpiry = requestedExpiry || addDaysFrom(renewalBase, defaultDurationDays);
    payload = {
      ...payload,
      plan: accountStatus === "courtesy" ? "courtesy" : plan,
      status: ACCOUNT_STATES.ACTIVE,
      accountStatus: accountStatus === "courtesy" ? "courtesy" : "active",
      trialEndsAt: null,
      expiresAt: Timestamp.fromDate(nextExpiry),
      graceUntil: null,
      cancellationAt: null,
      paymentPrice: resolveDefaultPriceForPlan(accountStatus === "courtesy" ? "courtesy" : plan, settings),
    };
  } else if (accountStatus === "pending_payment") {
    const baseExpiry = requestedExpiry || toDate(current.expiresAt || current.trialEndsAt) || new Date();
    payload = {
      ...payload,
      status: ACCOUNT_STATES.GRACE_PERIOD,
      trialEndsAt: current.status === ACCOUNT_STATES.TRIAL ? current.trialEndsAt : null,
      expiresAt: current.status === ACCOUNT_STATES.TRIAL ? null : Timestamp.fromDate(baseExpiry),
      graceUntil: Timestamp.fromDate(addDaysFrom(baseExpiry, settings.graceDays)),
      cancellationAt: Timestamp.fromDate(addDaysFrom(baseExpiry, settings.hardSuspensionDays)),
    };
  } else if (accountStatus === "suspended") {
    payload = {
      ...payload,
      status: ACCOUNT_STATES.SUSPENDED,
    };
  } else if (accountStatus === "expired") {
    payload = {
      ...payload,
      status: ACCOUNT_STATES.CANCELLED,
      graceUntil: null,
      cancellationAt: null,
    };
  }

  await ref.set(payload, { merge: true });

  await logAdminAction({
    actor,
    action: "user.access_updated",
    summary: `Actualizó el acceso de ${current.businessName || current.email || uid}.`,
    targetUid: uid,
    metadata: {
      plan: payload.plan,
      accountStatus: payload.accountStatus,
    },
  });

  return getAdminUserDetail(uid, { baseUrl });
}

export async function extendAdminUserAccess(uid, days, actor, { baseUrl = "" } = {}) {
  const ref = usersCollection().doc(uid);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new Error("Usuario no encontrado");
  }

  const current = snap.data();
  const base = toDate(current.expiresAt || current.trialEndsAt || current.graceUntil || current.createdAt) || new Date();
  const nextExpiry = addDaysFrom(base > new Date() ? base : new Date(), days);

  const payload = current.status === ACCOUNT_STATES.TRIAL
    ? {
      trialEndsAt: Timestamp.fromDate(nextExpiry),
      accountStatus: "trial",
      updatedAt: FieldValue.serverTimestamp(),
    }
    : {
      status: ACCOUNT_STATES.ACTIVE,
      accountStatus: normalizePlan(current.plan) === "courtesy" ? "courtesy" : "active",
      expiresAt: Timestamp.fromDate(nextExpiry),
      graceUntil: null,
      cancellationAt: null,
      updatedAt: FieldValue.serverTimestamp(),
    };

  await ref.set(payload, { merge: true });

  await logAdminAction({
    actor,
    action: "user.expiry_extended",
    summary: `Extendió ${days} días el acceso de ${current.businessName || current.email || uid}.`,
    targetUid: uid,
    metadata: { days },
  });

  return getAdminUserDetail(uid, { baseUrl });
}

export async function registerAdminManualPayment(uid, input, actor, { baseUrl = "" } = {}) {
  const settings = await getAdminSettings();
  const userRef = usersCollection().doc(uid);
  const paymentRef = paymentsCollection().doc(`manual_${uid}_${Date.now()}`);

  await getAdminDb().runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists) {
      throw new Error("Usuario no encontrado");
    }

    const current = userSnap.data();
    const plan = normalizePlan(input.plan || current.plan || "commercial");
    const durationDays = Number(input.durationDays || getPlanAccessDays(plan, settings));
    const now = new Date();
    const currentExpiry = toDate(current.expiresAt);
    const renewalBase = currentExpiry && currentExpiry > now ? currentExpiry : now;
    const expiresAt = addDaysFrom(renewalBase, durationDays);
    const amount = Number(input.amount || resolveDefaultPriceForPlan(plan, settings));

    transaction.set(userRef, {
      plan,
      ...buildAdminModuleAccessPayload(current, plan, input.module),
      status: ACCOUNT_STATES.ACTIVE,
      accountStatus: plan === "courtesy" ? "courtesy" : "active",
      trialEndsAt: null,
      expiresAt: Timestamp.fromDate(expiresAt),
      graceUntil: null,
      cancellationAt: null,
      startsAt: current.startsAt || Timestamp.fromDate(now),
      lastPaymentAt: Timestamp.fromDate(now),
      amountPaid: amount,
      paymentPrice: amount,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    transaction.set(paymentRef, {
      uid,
      amount,
      plan,
      status: "approved",
      method: String(input.method || "manual").trim(),
      notes: String(input.notes || "").trim(),
      manual: true,
      createdByUid: actor?.uid || "",
      createdByEmail: actor?.email || "",
      activatedAt: Timestamp.fromDate(now),
      createdAt: Timestamp.fromDate(now),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  });

  await logAdminAction({
    actor,
    action: "user.manual_payment",
    summary: `Registró un pago manual para ${uid}.`,
    targetUid: uid,
    metadata: {
      amount: Number(input.amount || 0),
      plan: normalizePlan(input.plan || "commercial"),
    },
  });

  return getAdminUserDetail(uid, { baseUrl });
}

export async function deleteAdminUserAccount(uid, actor) {
  if (!uid) {
    throw new Error("Usuario no válido");
  }

  if (actor?.uid === uid) {
    throw new Error("No puedes eliminar tu propia cuenta administradora desde este panel.");
  }

  const ref = usersCollection().doc(uid);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new Error("Usuario no encontrado");
  }

  const current = snap.data();
  if (current.role === "admin") {
    throw new Error("No puedes eliminar una cuenta administradora desde este panel.");
  }

  await Promise.all([
    deleteQueryDocuments(usernamesCollection().where("uid", "==", uid)),
    deleteQueryDocuments(publicLinksCollection().where("uid", "==", uid)),
    deleteQueryDocuments(paymentsCollection().where("uid", "==", uid)),
  ]);

  await ref.delete();
  await deleteUserStorageAssets(uid, current);

  try {
    await getAdminAuth().deleteUser(uid);
  } catch (error) {
    if (error?.code !== "auth/user-not-found") {
      throw error;
    }
  }

  invalidatePublicProfileCache({
    currentUsername: current.usernameLower || "",
    previousUsername: current.usernameLower || "",
    publicLinkId: current.publicLinkId || "",
  });

  await logAdminAction({
    actor,
    action: "user.deleted",
    summary: `Eliminó la cuenta de ${current.businessName || current.email || uid}.`,
    targetUid: uid,
    metadata: {
      deletedEmail: current.email || "",
      deletedBusinessName: current.businessName || "",
    },
  });

  return {
    ok: true,
    uid,
  };
}
