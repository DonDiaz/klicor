export const LEGAL_TERMS_VERSION = "terms-2026-05-12";
export const LEGAL_PRIVACY_VERSION = "privacy-2026-05-12";
export const LEGAL_PAYMENTS_VERSION = "payments-2026-05-12";
export const LEGAL_ACCEPTABLE_USE_VERSION = "acceptable-use-2026-05-12";

export function normalizeLegalAcceptance(input = {}) {
  const source = String(input.source || "auth").trim().slice(0, 80) || "auth";

  return {
    accepted: input.accepted === true,
    source,
    termsVersion: String(input.termsVersion || LEGAL_TERMS_VERSION),
    privacyVersion: String(input.privacyVersion || LEGAL_PRIVACY_VERSION),
    paymentsVersion: String(input.paymentsVersion || LEGAL_PAYMENTS_VERSION),
    acceptableUseVersion: String(input.acceptableUseVersion || LEGAL_ACCEPTABLE_USE_VERSION),
    termsPath: "/terminos-y-condiciones",
    privacyPath: "/politica-de-privacidad",
    paymentsPath: "/politica-de-pagos",
    acceptableUsePath: "/uso-permitido",
    acceptedAtClient: input.acceptedAtClient ? String(input.acceptedAtClient).slice(0, 80) : "",
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
