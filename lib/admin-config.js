import { ACCOUNT_STATES, GRACE_DAYS, HARD_SUSPENSION_DAYS, TRIAL_DAYS } from "@/lib/constants";
import {
  DEFAULT_PAID_PLAN,
  KLICOR_PLAN_DEFINITIONS,
  KLICOR_PLAN_OPTIONS,
  KLICOR_PLAN_VALUES,
  LEGACY_ANNUAL_PLAN,
  getPlanAnnualPrice,
  getPlanDefinition,
  normalizeKlicorPlan,
} from "@/lib/plans";

export const ADMIN_ORIGIN_VALUES = [
  "organico",
  "agencia",
  "camara_ocana",
  "secretaria_tic",
  "convenio",
  "admin_manual",
];

export const ADMIN_PLAN_VALUES = [...KLICOR_PLAN_VALUES, LEGACY_ANNUAL_PLAN];

export const ADMIN_ACCOUNT_STATUS_VALUES = [
  "trial",
  "active",
  "expired",
  "suspended",
  "courtesy",
  "pending_payment",
];

export const PARTNER_TYPE_VALUES = [
  "camara_comercio",
  "secretaria_tic",
  "agencia",
  "empresa",
  "otro",
];

export const ADMIN_ORIGIN_OPTIONS = [
  { value: "organico", label: "Orgánico" },
  { value: "agencia", label: "Agencia" },
  { value: "camara_ocana", label: "Cámara de Comercio" },
  { value: "secretaria_tic", label: "Secretaría TIC" },
  { value: "convenio", label: "Convenio" },
  { value: "admin_manual", label: "Alta manual" },
];

export const ADMIN_PLAN_OPTIONS = KLICOR_PLAN_OPTIONS;

export const ADMIN_ACCOUNT_STATUS_OPTIONS = [
  { value: "trial", label: "Trial" },
  { value: "active", label: "Activa" },
  { value: "pending_payment", label: "Pendiente de pago" },
  { value: "suspended", label: "Suspendida" },
  { value: "expired", label: "Vencida" },
  { value: "courtesy", label: "Cortesía" },
];

export const PARTNER_TYPE_OPTIONS = [
  { value: "camara_comercio", label: "Cámara de comercio" },
  { value: "secretaria_tic", label: "Secretaría TIC" },
  { value: "agencia", label: "Agencia" },
  { value: "empresa", label: "Empresa" },
  { value: "otro", label: "Otro" },
];

export const ADMIN_SETTINGS_DEFAULTS = {
  annualPrice: KLICOR_PLAN_DEFINITIONS[DEFAULT_PAID_PLAN].annualPrice,
  basicAnnualPrice: KLICOR_PLAN_DEFINITIONS.basic.annualPrice,
  commercialAnnualPrice: KLICOR_PLAN_DEFINITIONS.commercial.annualPrice,
  plusAnnualPrice: KLICOR_PLAN_DEFINITIONS.plus.annualPrice,
  proAnnualPrice: KLICOR_PLAN_DEFINITIONS.pro.annualPrice,
  currency: "COP",
  trialDays: TRIAL_DAYS,
  graceDays: GRACE_DAYS,
  hardSuspensionDays: HARD_SUSPENSION_DAYS,
  renewalAlertDays: 7,
  renewalMode: "manual",
  trialExpiredMessage: "Tu prueba gratis terminó. Renueva para mantener tu Klicor activo.",
  paidExpiredMessage: "Tu plan venció. Renueva tu cuenta para volver a compartir tu Klicor.",
  convenioDefaultDays: 365,
  agencyAnnualPrice: KLICOR_PLAN_DEFINITIONS.commercial.annualPrice,
  partnerDefaultPrice: KLICOR_PLAN_DEFINITIONS.commercial.annualPrice,
};

function clampNumber(value, { min = 0, max = Number.POSITIVE_INFINITY, fallback = 0 } = {}) {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return Math.min(Math.max(next, min), max);
}

export function normalizeOrigin(value = "") {
  const next = String(value || "").trim().toLowerCase();
  return ADMIN_ORIGIN_VALUES.includes(next) ? next : "organico";
}

export function normalizePlan(value = "") {
  return normalizeKlicorPlan(value);
}

export function normalizeAccountStatus(value = "") {
  const next = String(value || "").trim().toLowerCase();
  return ADMIN_ACCOUNT_STATUS_VALUES.includes(next) ? next : "trial";
}

export function normalizePartnerType(value = "") {
  const next = String(value || "").trim().toLowerCase();
  return PARTNER_TYPE_VALUES.includes(next) ? next : "otro";
}

export function normalizeRenewalMode(value = "") {
  return String(value || "").trim().toLowerCase() === "automatic" ? "automatic" : "manual";
}

export function normalizeAdminSettings(input = {}) {
  const basicAnnualPrice = clampNumber(input.basicAnnualPrice, { min: 0, max: 1_000_000, fallback: ADMIN_SETTINGS_DEFAULTS.basicAnnualPrice });
  const commercialAnnualPrice = clampNumber(input.commercialAnnualPrice ?? input.annualPrice, { min: 0, max: 1_000_000, fallback: ADMIN_SETTINGS_DEFAULTS.commercialAnnualPrice });
  const plusAnnualPrice = clampNumber(input.plusAnnualPrice, { min: 0, max: 1_000_000, fallback: ADMIN_SETTINGS_DEFAULTS.plusAnnualPrice });
  const proAnnualPrice = clampNumber(input.proAnnualPrice, { min: 0, max: 1_000_000, fallback: ADMIN_SETTINGS_DEFAULTS.proAnnualPrice });
  const annualPrice = commercialAnnualPrice;

  return {
    annualPrice,
    basicAnnualPrice,
    commercialAnnualPrice,
    plusAnnualPrice,
    proAnnualPrice,
    currency: String(input.currency || ADMIN_SETTINGS_DEFAULTS.currency || "COP").trim().toUpperCase() || "COP",
    trialDays: clampNumber(input.trialDays, { min: 0, max: 90, fallback: ADMIN_SETTINGS_DEFAULTS.trialDays }),
    graceDays: clampNumber(input.graceDays, { min: 0, max: 120, fallback: ADMIN_SETTINGS_DEFAULTS.graceDays }),
    hardSuspensionDays: clampNumber(input.hardSuspensionDays, { min: 0, max: 180, fallback: ADMIN_SETTINGS_DEFAULTS.hardSuspensionDays }),
    renewalAlertDays: clampNumber(input.renewalAlertDays, { min: 0, max: 60, fallback: ADMIN_SETTINGS_DEFAULTS.renewalAlertDays }),
    renewalMode: normalizeRenewalMode(input.renewalMode || ADMIN_SETTINGS_DEFAULTS.renewalMode),
    trialExpiredMessage: String(input.trialExpiredMessage || ADMIN_SETTINGS_DEFAULTS.trialExpiredMessage).trim().slice(0, 240),
    paidExpiredMessage: String(input.paidExpiredMessage || ADMIN_SETTINGS_DEFAULTS.paidExpiredMessage).trim().slice(0, 240),
    convenioDefaultDays: clampNumber(input.convenioDefaultDays, { min: 1, max: 3650, fallback: ADMIN_SETTINGS_DEFAULTS.convenioDefaultDays }),
    agencyAnnualPrice: clampNumber(input.agencyAnnualPrice, { min: 0, max: 1_000_000, fallback: commercialAnnualPrice }),
    partnerDefaultPrice: clampNumber(input.partnerDefaultPrice, { min: 0, max: 1_000_000, fallback: commercialAnnualPrice }),
  };
}

export function resolveOriginLabel(value = "") {
  return ADMIN_ORIGIN_OPTIONS.find((option) => option.value === normalizeOrigin(value))?.label || "Orgánico";
}

export function resolvePlanLabel(value = "") {
  return getPlanDefinition(value).label || "Trial";
}

export function resolveAccountStatusLabel(value = "") {
  return ADMIN_ACCOUNT_STATUS_OPTIONS.find((option) => option.value === normalizeAccountStatus(value))?.label || "Trial";
}

export function resolveAccountStatusTone(value = "") {
  switch (normalizeAccountStatus(value)) {
    case "active":
      return "success";
    case "trial":
      return "warning";
    case "pending_payment":
      return "warning";
    case "suspended":
      return "neutral";
    case "courtesy":
      return "info";
    case "expired":
      return "danger";
    default:
      return "neutral";
  }
}

export function resolveUserAccountStatus(user = {}) {
  if (user?.status === ACCOUNT_STATES.SUSPENDED) return "suspended";
  if (user?.status === ACCOUNT_STATES.CANCELLED) return "expired";
  if (user?.status === ACCOUNT_STATES.GRACE_PERIOD) return "pending_payment";
  if (normalizePlan(user?.plan) === "courtesy") return "courtesy";
  if (user?.status === ACCOUNT_STATES.ACTIVE) return "active";
  return "trial";
}

export function getPlanAccessDays(plan, settings = ADMIN_SETTINGS_DEFAULTS) {
  const normalizedPlan = normalizePlan(plan);
  if (normalizedPlan === "trial") {
    return normalizeAdminSettings(settings).trialDays;
  }
  if (normalizedPlan === "institutional") {
    return normalizeAdminSettings(settings).convenioDefaultDays;
  }
  return 365;
}

export function resolvePlanAnnualPrice(plan, settings = ADMIN_SETTINGS_DEFAULTS) {
  return getPlanAnnualPrice(plan, normalizeAdminSettings(settings));
}
