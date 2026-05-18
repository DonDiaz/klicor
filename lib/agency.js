import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { sendAgencyAccessRequestEmail } from "@/lib/mailer";
import { buildVanityProfileUrl } from "@/lib/public-profile-links";
import { toDate } from "@/lib/utils";

const REQUEST_TTL_DAYS = 7;
const REQUEST_RESEND_WAIT_MS = 24 * 60 * 60 * 1000;
const EDITABLE_BUSINESS_STATUSES = new Set(["trial", "active"]);

export const AGENCY_DEFAULT_PERMISSIONS = {
  links: true,
  design: true,
  commerce: true,
  booking: true,
  publicProfile: true,
  paymentMethods: true,
  analytics: true,
  subscriptionRenewal: true,
  dorika: false,
  billing: false,
  subscriptionAdmin: false,
  security: false,
  owner: false,
};

function agencyAccountsCollection() {
  return getAdminDb().collection("agencyAccounts");
}

function agencyRequestsCollection() {
  return getAdminDb().collection("agencyAccessRequests");
}

function usersCollection() {
  return getAdminDb().collection("users");
}

function normalizeEmail(email = "") {
  return String(email || "").trim().toLowerCase();
}

function normalizeStatus(status = "") {
  const value = String(status || "").trim().toLowerCase();
  return ["active", "inactive"].includes(value) ? value : "active";
}

function addDays(date = new Date(), days = 0) {
  const next = new Date(date);
  next.setDate(next.getDate() + Number(days || 0));
  return next;
}

function isExpired(request = {}, now = new Date()) {
  const expiresAt = toDate(request.expiresAt);
  return Boolean(expiresAt && expiresAt <= now);
}

function buildAgencyAccountView(id, data = {}) {
  const email = normalizeEmail(data.email || id);
  return {
    id,
    email,
    agencyName: String(data.agencyName || "").trim() || email,
    status: normalizeStatus(data.status),
    createdAt: toDate(data.createdAt)?.toISOString() || null,
    updatedAt: toDate(data.updatedAt)?.toISOString() || null,
  };
}

function buildRequestView(id, data = {}) {
  const expiresAt = toDate(data.expiresAt);
  const createdAt = toDate(data.createdAt);
  const respondedAt = toDate(data.respondedAt);
  const revokedAt = toDate(data.revokedAt);
  return {
    id,
    agencyId: data.agencyId || "",
    agencyEmail: normalizeEmail(data.agencyEmail),
    agencyName: String(data.agencyName || "").trim(),
    businessUid: data.businessUid || "",
    businessEmail: normalizeEmail(data.businessEmail),
    businessName: String(data.businessName || "").trim(),
    status: data.status || "pending",
    permissions: { ...AGENCY_DEFAULT_PERMISSIONS, ...(data.permissions || {}) },
    createdAt: createdAt?.toISOString() || null,
    expiresAt: expiresAt?.toISOString() || null,
    respondedAt: respondedAt?.toISOString() || null,
    revokedAt: revokedAt?.toISOString() || null,
    expired: data.status === "pending" && isExpired(data),
  };
}

function buildBusinessView(id, data = {}, baseUrl = "") {
  const agencyAccess = data.agencyAccess || {};
  return {
    uid: id,
    businessName: data.businessName || "Sin nombre",
    email: normalizeEmail(data.email),
    username: data.usernameLower || data.username || "",
    publicUrl: data.usernameLower || data.username ? buildVanityProfileUrl(data.usernameLower || data.username, baseUrl) : "",
    photo: data.photoThumb || data.photo || "",
    status: data.status || "trial",
    plan: data.plan || "trial",
    commercialModule: data.commercialModule || "",
    moduleAccess: data.moduleAccess || {},
    updatedAt: toDate(data.updatedAt)?.toISOString() || null,
    agencyAccess: {
      status: agencyAccess.status || "",
      acceptedAt: toDate(agencyAccess.acceptedAt)?.toISOString() || null,
      permissions: { ...AGENCY_DEFAULT_PERMISSIONS, ...(agencyAccess.permissions || {}) },
    },
  };
}

function buildAgencyBusinessAccessView(agency, businessId, business = {}) {
  const agencyAccess = business.agencyAccess || {};
  return {
    agency,
    business: {
      uid: businessId,
      ...business,
      agencyAccess: {
        ...agencyAccess,
        permissions: { ...AGENCY_DEFAULT_PERMISSIONS, ...(agencyAccess.permissions || {}) },
      },
    },
    permissions: { ...AGENCY_DEFAULT_PERMISSIONS, ...(agencyAccess.permissions || {}) },
  };
}

export function canAgencyEditBusinessStatus(status = "") {
  return EDITABLE_BUSINESS_STATUSES.has(String(status || "").trim());
}

export async function listAgencyAccounts() {
  const snap = await agencyAccountsCollection().orderBy("agencyName").limit(200).get().catch(async () => (
    agencyAccountsCollection().limit(200).get()
  ));
  return snap.docs.map((doc) => buildAgencyAccountView(doc.id, doc.data()));
}

export async function saveAgencyAccount(input = {}, actor = {}) {
  const email = normalizeEmail(input.email);
  if (!email || !email.includes("@")) {
    throw new Error("Escribe un correo válido para la agencia.");
  }

  const ref = agencyAccountsCollection().doc(email);
  const current = await ref.get();
  const payload = {
    email,
    agencyName: String(input.agencyName || "").trim() || email,
    status: normalizeStatus(input.status),
    createdBy: current.exists ? current.data()?.createdBy || actor.uid || "" : actor.uid || "",
    updatedBy: actor.uid || "",
    updatedByEmail: actor.email || "",
    updatedAt: FieldValue.serverTimestamp(),
    ...(current.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
  };

  await ref.set(payload, { merge: true });
  const updated = await ref.get();
  return buildAgencyAccountView(updated.id, updated.data());
}

export async function getAgencyAccountForEmail(email = "") {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const snap = await agencyAccountsCollection().doc(normalized).get();
  if (!snap.exists) return null;
  const agency = buildAgencyAccountView(snap.id, snap.data());
  return agency.status === "active" ? agency : null;
}

export async function requireAgency(user = {}) {
  const agency = await getAgencyAccountForEmail(user.email);
  if (!agency) {
    throw new Error("Este acceso es solo para agencias autorizadas por Klicor.");
  }
  return agency;
}

export async function getAgencyDashboard(user = {}, { baseUrl = "" } = {}) {
  const agency = await requireAgency(user);
  const [requestsSnap, businessesSnap] = await Promise.all([
    agencyRequestsCollection().where("agencyId", "==", agency.id).limit(100).get(),
    usersCollection().where("agencyAccess.agencyId", "==", agency.id).where("agencyAccess.status", "==", "active").limit(100).get().catch(() => ({ docs: [] })),
  ]);

  return {
    agency,
    requests: requestsSnap.docs.map((doc) => buildRequestView(doc.id, doc.data())),
    businesses: businessesSnap.docs.map((doc) => buildBusinessView(doc.id, doc.data(), baseUrl)),
  };
}

export async function assertAgencyBusinessAccess(agencyUser = {}, businessUid = "", permission = "") {
  const agency = await requireAgency(agencyUser);
  const cleanUid = String(businessUid || "").trim();
  if (!cleanUid) {
    throw new Error("Negocio no definido para la agencia.");
  }

  const businessSnap = await usersCollection().doc(cleanUid).get();
  if (!businessSnap.exists) {
    throw new Error("Negocio no encontrado.");
  }

  const business = businessSnap.data();
  const agencyAccess = business.agencyAccess || {};
  const permissions = { ...AGENCY_DEFAULT_PERMISSIONS, ...(agencyAccess.permissions || {}) };

  if (agencyAccess.status !== "active" || agencyAccess.agencyId !== agency.id) {
    throw new Error("La agencia no tiene acceso activo a este negocio.");
  }

  const requestedPermission = String(permission || "").trim();
  if (requestedPermission && permissions[requestedPermission] !== true) {
    throw new Error("La agencia no tiene permisos para esta secci\u00f3n.");
  }

  return buildAgencyBusinessAccessView(agency, businessSnap.id, business);
}

export async function assertAgencyCanEditBusiness(agencyUser = {}, businessUid = "", permission = "") {
  const access = await assertAgencyBusinessAccess(agencyUser, businessUid, permission);
  if (!canAgencyEditBusinessStatus(access.business.status)) {
    throw new Error("Este negocio no permite edici\u00f3n hasta renovar o activar la cuenta.");
  }
  return access;
}

export async function getPendingAgencyRequestsForBusiness(uid = "") {
  if (!uid) return [];
  const snap = await agencyRequestsCollection()
    .where("businessUid", "==", uid)
    .where("status", "==", "pending")
    .limit(20)
    .get()
    .catch(() => ({ docs: [] }));
  return snap.docs
    .map((doc) => buildRequestView(doc.id, doc.data()))
    .filter((request) => !request.expired);
}

async function findBusinessByEmail(email = "") {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  let snap = await usersCollection().where("emailLower", "==", normalized).limit(2).get();
  if (snap.empty) {
    snap = await usersCollection().where("email", "==", normalized).limit(2).get();
  }
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { uid: doc.id, ...doc.data() };
}

export async function createAgencyAccessRequest({ agencyUser, businessEmail, message = "" } = {}) {
  const agency = await requireAgency(agencyUser);
  const normalizedBusinessEmail = normalizeEmail(businessEmail);
  if (!normalizedBusinessEmail || !normalizedBusinessEmail.includes("@")) {
    throw new Error("Escribe el correo exacto del negocio.");
  }

  const business = await findBusinessByEmail(normalizedBusinessEmail);
  if (!business) {
    throw new Error("No encontramos un Klicor creado con ese correo. El negocio debe crear su cuenta primero.");
  }

  if (business.uid === agencyUser.uid) {
    throw new Error("No puedes solicitar acceso a tu propia cuenta desde agencia.");
  }

  if (business.agencyAccess?.status === "active") {
    throw new Error("Este negocio ya tiene una agencia vinculada.");
  }

  const now = new Date();
  const existingSnap = await agencyRequestsCollection()
    .where("agencyId", "==", agency.id)
    .where("businessUid", "==", business.uid)
    .limit(10)
    .get();
  const existing = existingSnap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .find((request) => ["pending", "accepted"].includes(request.status));

  if (existing?.status === "pending" && !isExpired(existing, now)) {
    throw new Error("Ya hay una solicitud pendiente para este negocio.");
  }

  if (existing?.status === "pending" && isExpired(existing, now)) {
    const expiresAt = toDate(existing.expiresAt);
    if (expiresAt && now.getTime() - expiresAt.getTime() < REQUEST_RESEND_WAIT_MS) {
      throw new Error("Puedes reenviar otra solicitud 24 horas después de vencida la anterior.");
    }
  }

  if (existing?.status === "accepted") {
    throw new Error("Esta agencia ya fue aceptada por el negocio.");
  }

  const ref = agencyRequestsCollection().doc();
  const payload = {
    agencyId: agency.id,
    agencyEmail: agency.email,
    agencyName: agency.agencyName,
    agencyUid: agencyUser.uid || "",
    businessUid: business.uid,
    businessEmail: normalizedBusinessEmail,
    businessName: business.businessName || "Tu negocio",
    message: String(message || "").trim().slice(0, 500),
    status: "pending",
    permissions: AGENCY_DEFAULT_PERMISSIONS,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    lastSentAt: FieldValue.serverTimestamp(),
    expiresAt: Timestamp.fromDate(addDays(now, REQUEST_TTL_DAYS)),
  };

  await ref.set(payload);

  sendAgencyAccessRequestEmail({
    to: business.email,
    businessName: business.businessName,
    agencyName: agency.agencyName,
    agencyEmail: agency.email,
    message: payload.message,
  }).catch((error) => {
    console.error("[agency-request-email]", error?.message || error);
  });

  const created = await ref.get();
  return buildRequestView(created.id, created.data());
}

export async function respondAgencyAccessRequest({ businessUser, requestId, action } = {}) {
  const cleanAction = String(action || "").trim().toLowerCase();
  if (!["accept", "reject"].includes(cleanAction)) {
    throw new Error("Acción inválida.");
  }

  const requestRef = agencyRequestsCollection().doc(String(requestId || ""));
  const businessRef = usersCollection().doc(businessUser.uid);
  let result = null;

  await getAdminDb().runTransaction(async (transaction) => {
    const [requestSnap, businessSnap] = await Promise.all([
      transaction.get(requestRef),
      transaction.get(businessRef),
    ]);

    if (!requestSnap.exists) throw new Error("Solicitud no encontrada.");
    if (!businessSnap.exists) throw new Error("Negocio no encontrado.");

    const request = requestSnap.data();
    const business = businessSnap.data();
    if (request.businessUid !== businessUser.uid) {
      throw new Error("Esta solicitud no pertenece a tu negocio.");
    }
    if (request.status !== "pending" || isExpired(request)) {
      throw new Error("Esta solicitud ya no está vigente.");
    }

    if (cleanAction === "reject") {
      transaction.update(requestRef, {
        status: "rejected",
        respondedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      result = { status: "rejected" };
      return;
    }

    const agencySnap = await transaction.get(agencyAccountsCollection().doc(request.agencyId));
    if (!agencySnap.exists || normalizeStatus(agencySnap.data()?.status) !== "active") {
      throw new Error("La agencia ya no está activa.");
    }
    if (business.agencyAccess?.status === "active") {
      throw new Error("Tu negocio ya tiene una agencia vinculada.");
    }

    const agencyAccess = {
      agencyId: request.agencyId,
      agencyEmail: normalizeEmail(request.agencyEmail),
      agencyName: request.agencyName || request.agencyEmail,
      status: "active",
      permissions: { ...AGENCY_DEFAULT_PERMISSIONS, ...(request.permissions || {}) },
      acceptedAt: FieldValue.serverTimestamp(),
      revokedAt: null,
    };

    transaction.update(requestRef, {
      status: "accepted",
      respondedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.update(businessRef, {
      agencyAccess,
      updatedAt: FieldValue.serverTimestamp(),
    });
    result = { status: "accepted", agencyAccess };
  });

  return result;
}

export async function revokeAgencyAccess({ businessUser } = {}) {
  const businessRef = usersCollection().doc(businessUser.uid);
  await getAdminDb().runTransaction(async (transaction) => {
    const businessSnap = await transaction.get(businessRef);
    if (!businessSnap.exists) throw new Error("Negocio no encontrado.");
    const business = businessSnap.data();
    if (business.agencyAccess?.status !== "active") {
      throw new Error("No tienes una agencia activa para desvincular.");
    }
    transaction.update(businessRef, {
      "agencyAccess.status": "revoked",
      "agencyAccess.revokedAt": FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return { status: "revoked" };
}
