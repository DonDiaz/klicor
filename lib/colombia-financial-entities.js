export const COLOMBIA_FINANCIAL_ENTITIES = [
  { id: "breb", label: "Llave Bre-B", kind: "breb" },
  { id: "bancolombia", label: "Bancolombia", kind: "bank" },
  { id: "banco_bogota", label: "Banco de Bogotá", kind: "bank" },
  { id: "davivienda", label: "Davivienda", kind: "bank" },
  { id: "occidente", label: "Banco de Occidente", kind: "bank" },
  { id: "popular", label: "Banco Popular", kind: "bank" },
  { id: "av_villas", label: "AV Villas", kind: "bank" },
  { id: "bbva", label: "BBVA", kind: "bank" },
  { id: "colpatria", label: "Scotiabank Colpatria", kind: "bank" },
  { id: "caja_social", label: "Banco Caja Social", kind: "bank" },
  { id: "agrario", label: "Banco Agrario", kind: "bank" },
  { id: "falabella", label: "Banco Falabella", kind: "bank" },
  { id: "pichincha", label: "Banco Pichincha", kind: "bank" },
  { id: "itau", label: "Itaú", kind: "bank" },
  { id: "gnb", label: "GNB Sudameris", kind: "bank" },
  { id: "serfinanza", label: "Serfinanza", kind: "bank" },
  { id: "lulo", label: "Lulo Bank", kind: "bank" },
  { id: "nu", label: "Nu", kind: "wallet" },
  { id: "nequi", label: "Nequi", kind: "wallet" },
  { id: "daviplata", label: "DaviPlata", kind: "wallet" },
  { id: "dale", label: "Dale!", kind: "wallet" },
  { id: "movii", label: "MOVii", kind: "wallet" },
  { id: "uala", label: "Ualá", kind: "wallet" },
];

export const COLOMBIA_FINANCIAL_ENTITY_OPTIONS = COLOMBIA_FINANCIAL_ENTITIES.map((entity) => ({
  value: entity.id,
  label: entity.label,
}));

export const ACCOUNT_TYPE_OPTIONS = [
  { value: "savings", label: "Ahorros" },
  { value: "checking", label: "Corriente" },
];

export const COLOMBIA_FINANCIAL_ENTITY_MAP = Object.fromEntries(
  COLOMBIA_FINANCIAL_ENTITIES.map((entity) => [entity.id, entity]),
);

export function getFinancialEntity(entityId = "") {
  return COLOMBIA_FINANCIAL_ENTITY_MAP[String(entityId || "").trim().toLowerCase()] || null;
}

export function requiresAccountType(entityId = "") {
  return getFinancialEntity(entityId)?.kind === "bank";
}

export function usesBrebKeyField(entityId = "") {
  return getFinancialEntity(entityId)?.kind === "breb";
}

export function resolveFinancialEntityLabel(entityId = "") {
  return getFinancialEntity(entityId)?.label || "Entidad";
}
