import {
  ACCOUNT_TYPE_OPTIONS,
  getFinancialEntity,
  requiresAccountType,
  resolveFinancialEntityLabel,
  usesBrebKeyField,
} from "@/lib/colombia-financial-entities";

function normalizeAccountType(value = "") {
  const next = String(value || "").trim().toLowerCase();
  return ACCOUNT_TYPE_OPTIONS.some((option) => option.value === next) ? next : "";
}

function normalizeMethod(input = {}, index = 0) {
  let entityId = String(input.entityId || "").trim().toLowerCase();
  const accountNumber = String(input.accountNumber || "").trim();
  const brebKey = String(input.brebKey || "").trim();

  if (!entityId && brebKey && !accountNumber) {
    entityId = "breb";
  }

  const accountType = requiresAccountType(entityId) ? normalizeAccountType(input.accountType) : "";

  if (!entityId && !accountNumber && !brebKey) return null;

  return {
    id: input.id || `payment-method-${index}`,
    entityId,
    accountType,
    accountNumber,
    brebKey,
  };
}

export function normalizePaymentMethods(rawMethods = [], legacyLinks = [], paymentQrUrl = "") {
  if (Array.isArray(rawMethods) && rawMethods.length) {
    return rawMethods.map((item, index) => normalizeMethod(item, index)).filter(Boolean).slice(0, 2);
  }

  const legacyPaymentKey = Array.isArray(legacyLinks)
    ? legacyLinks.find((item) => item.type === "payment_key")
    : null;

  if (!legacyPaymentKey?.value && !paymentQrUrl) return [];

  return [{
    id: "payment-method-legacy",
    entityId: "breb",
    accountType: "",
    accountNumber: "",
    brebKey: String(legacyPaymentKey?.value || "").trim(),
  }];
}

export function buildPaymentMethodsSignature(methods = []) {
  return JSON.stringify(
    normalizePaymentMethods(methods).map((method) => ({
      entityId: method.entityId,
      accountType: method.accountType,
      accountNumber: method.accountNumber,
      brebKey: method.brebKey,
    })),
  );
}

export function hasPaymentMethodData(methods = []) {
  return normalizePaymentMethods(methods).some((method) => method.entityId || method.accountNumber || method.brebKey);
}

export function resolvePaymentMethodTitle(method = {}) {
  return resolveFinancialEntityLabel(method.entityId) || (method.brebKey ? "Llave Bre-B" : "Método de pago");
}

export function resolvePaymentMethodMeta(method = {}) {
  const entity = getFinancialEntity(method.entityId);
  if (!entity || entity.kind !== "bank") return "";
  if (method.accountType === "savings") return "Ahorros";
  if (method.accountType === "checking") return "Corriente";
  return "";
}

export function resolvePaymentMethodDisplayValue(method = {}) {
  if (usesBrebKeyField(method.entityId)) return String(method.brebKey || "").trim();
  return String(method.accountNumber || method.brebKey || "").trim();
}
