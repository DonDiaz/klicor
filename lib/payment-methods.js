import {
  ACCOUNT_TYPE_OPTIONS,
  getFinancialEntity,
  requiresAccountType,
  resolveFinancialEntityLabel,
} from "@/lib/colombia-financial-entities";

function normalizeAccountType(value = "") {
  const next = String(value || "").trim().toLowerCase();
  return ACCOUNT_TYPE_OPTIONS.some((option) => option.value === next) ? next : "";
}

function normalizeMethod(input = {}, index = 0) {
  const entityId = String(input.entityId || "").trim().toLowerCase();
  const accountType = requiresAccountType(entityId) ? normalizeAccountType(input.accountType) : "";
  const accountNumber = String(input.accountNumber || "").trim();
  const brebKey = String(input.brebKey || "").trim();

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
    entityId: "",
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
  return resolveFinancialEntityLabel(method.entityId) || "Método de pago";
}

export function resolvePaymentMethodSubtitle(method = {}) {
  const entity = getFinancialEntity(method.entityId);
  if (!entity) return "Configura la entidad para recibir pagos";
  if (entity.kind === "bank") {
    if (method.accountType === "savings") return "Cuenta de ahorros";
    if (method.accountType === "checking") return "Cuenta corriente";
    return "Cuenta bancaria";
  }
  return "Billetera o cuenta digital";
}
