import "server-only";
import crypto from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  hasAcceptedRequiredBookingLegal,
  hasCurrentBookingLegalConsent,
  normalizeBookingLegalAcceptance,
} from "@/lib/legal-consent";

function publicBookingCustomersCollection() {
  return getAdminDb().collection("publicBookingCustomers");
}

function hashIp(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export function getRequestIp(request) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const firstForwarded = forwarded.split(",")[0]?.trim();
  return firstForwarded
    || request.headers.get("x-real-ip")
    || request.headers.get("cf-connecting-ip")
    || "";
}

export async function getPublicBookingCustomerConsent(customerUid) {
  const uid = String(customerUid || "").trim();
  if (!uid) return { hasCurrentConsent: false, consent: null };

  const snap = await publicBookingCustomersCollection().doc(uid).get();
  const customer = snap.exists ? snap.data() : {};
  const consent = customer.bookingLegalConsent || null;

  return {
    hasCurrentConsent: hasCurrentBookingLegalConsent(customer),
    consent,
  };
}

export async function recordPublicBookingLegalConsent(customerAuth = {}, input = {}, metadata = {}) {
  const uid = String(customerAuth.uid || "").trim();
  if (!uid) {
    throw new Error("Inicia sesion con Google para aceptar los terminos.");
  }

  const acceptance = normalizeBookingLegalAcceptance(input);
  if (!hasAcceptedRequiredBookingLegal(acceptance)) {
    throw new Error("Debes aceptar los terminos y la politica de privacidad para agendar.");
  }

  const ref = publicBookingCustomersCollection().doc(uid);
  const consentRef = ref.collection("legalConsents").doc();
  const payload = {
    ...acceptance,
    customerUid: uid,
    customerEmail: String(customerAuth.email || "").trim().toLowerCase(),
    customerEmailVerified: Boolean(customerAuth.emailVerified),
    customerName: String(customerAuth.name || "").trim(),
    authProvider: String(customerAuth.provider || "").trim(),
    businessUid: String(metadata.businessUid || "").trim(),
    appointmentId: String(metadata.appointmentId || "").trim(),
    ipHash: hashIp(metadata.ip),
    userAgent: String(metadata.userAgent || "").slice(0, 500),
    createdAt: FieldValue.serverTimestamp(),
  };

  await getAdminDb().runTransaction(async (transaction) => {
    transaction.set(consentRef, payload);
    transaction.set(ref, {
      uid,
      email: payload.customerEmail,
      emailVerified: payload.customerEmailVerified,
      name: payload.customerName,
      photoURL: String(customerAuth.photoURL || "").trim(),
      authProvider: payload.authProvider,
      bookingLegalConsent: {
        ...acceptance,
        lastConsentId: consentRef.id,
        acceptedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  });

  return { id: consentRef.id, ...payload };
}
