export const LEGAL_TERMS_VERSION = "terms-2026-05-12";
export const LEGAL_PRIVACY_VERSION = "privacy-2026-05-12";
export const LEGAL_PAYMENTS_VERSION = "payments-2026-05-12";
export const LEGAL_ACCEPTABLE_USE_VERSION = "acceptable-use-2026-05-12";
export const LEGAL_BOOKING_TERMS_VERSION = LEGAL_TERMS_VERSION;
export const LEGAL_BOOKING_PRIVACY_VERSION = LEGAL_PRIVACY_VERSION;

export function normalizeLegalAcceptance(input = {}) {
  const sourceInput = input && typeof input === "object" ? input : {};
  const source = String(sourceInput.source || "auth").trim().slice(0, 80) || "auth";

  return {
    accepted: sourceInput.accepted === true,
    source,
    termsVersion: String(sourceInput.termsVersion || LEGAL_TERMS_VERSION),
    privacyVersion: String(sourceInput.privacyVersion || LEGAL_PRIVACY_VERSION),
    paymentsVersion: String(sourceInput.paymentsVersion || LEGAL_PAYMENTS_VERSION),
    acceptableUseVersion: String(sourceInput.acceptableUseVersion || LEGAL_ACCEPTABLE_USE_VERSION),
    termsPath: "/terminos-y-condiciones",
    privacyPath: "/politica-de-privacidad",
    paymentsPath: "/politica-de-pagos",
    acceptableUsePath: "/uso-permitido",
    acceptedAtClient: sourceInput.acceptedAtClient ? String(sourceInput.acceptedAtClient).slice(0, 80) : "",
  };
}

export function hasAcceptedRequiredLegal(input = {}) {
  const acceptance = normalizeLegalAcceptance(input);
  return acceptance.accepted
    && acceptance.termsVersion === LEGAL_TERMS_VERSION
    && acceptance.privacyVersion === LEGAL_PRIVACY_VERSION
    && acceptance.paymentsVersion === LEGAL_PAYMENTS_VERSION
    && acceptance.acceptableUseVersion === LEGAL_ACCEPTABLE_USE_VERSION;
}

export function hasCurrentUserLegalConsent(user = {}) {
  const consent = user.legalConsent || {};

  return Boolean(user.termsAccepted || consent.accepted)
    && (consent.termsVersion || user.termsVersion) === LEGAL_TERMS_VERSION
    && (consent.privacyVersion || user.privacyVersion) === LEGAL_PRIVACY_VERSION
    && (consent.paymentsVersion || user.paymentsVersion) === LEGAL_PAYMENTS_VERSION
    && (consent.acceptableUseVersion || user.acceptableUseVersion) === LEGAL_ACCEPTABLE_USE_VERSION;
}

export function normalizeBookingLegalAcceptance(input = {}) {
  const sourceInput = input && typeof input === "object" ? input : {};
  const source = String(sourceInput.source || "public_booking").trim().slice(0, 80) || "public_booking";

  return {
    accepted: sourceInput.accepted === true,
    source,
    termsVersion: String(sourceInput.termsVersion || LEGAL_BOOKING_TERMS_VERSION),
    privacyVersion: String(sourceInput.privacyVersion || LEGAL_BOOKING_PRIVACY_VERSION),
    termsPath: "/terminos-y-condiciones",
    privacyPath: "/politica-de-privacidad",
    acceptedAtClient: sourceInput.acceptedAtClient ? String(sourceInput.acceptedAtClient).slice(0, 80) : "",
  };
}

export function hasAcceptedRequiredBookingLegal(input = {}) {
  const acceptance = normalizeBookingLegalAcceptance(input);
  return acceptance.accepted
    && acceptance.termsVersion === LEGAL_BOOKING_TERMS_VERSION
    && acceptance.privacyVersion === LEGAL_BOOKING_PRIVACY_VERSION;
}

export function hasCurrentBookingLegalConsent(customer = {}) {
  const consent = customer.bookingLegalConsent || customer.legalConsent || {};

  return Boolean(consent.accepted)
    && consent.termsVersion === LEGAL_BOOKING_TERMS_VERSION
    && consent.privacyVersion === LEGAL_BOOKING_PRIVACY_VERSION;
}
