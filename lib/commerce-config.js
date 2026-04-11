import { sanitizePhone, sanitizeSlug } from "@/lib/utils";

export const COMMERCE_MODE_VALUES = ["", "mitienda", "mimenu", "micatalogo"];

export const COMMERCE_MODE_OPTIONS = [
  { value: "mitienda", label: "Mi tienda" },
  { value: "mimenu", label: "Mi menú" },
  { value: "micatalogo", label: "Mi catálogo" },
];

export const COMMERCE_MODE_META = {
  mitienda: {
    id: "mitienda",
    label: "Mi tienda",
    shortLabel: "Tienda",
    urlSegment: "mitienda",
    categoryLabel: "Categorías",
    subcategoryLabel: "Subcategorías",
    itemLabel: "Productos",
    addCategoryLabel: "Agregar categoría",
    addSubcategoryLabel: "Agregar subcategoría",
    addProductLabel: "Agregar producto",
    addToCartLabel: "Agregar al carrito",
    emptyLabel: "Esta tienda aún no tiene productos publicados.",
    publicHeadlineFallback: "Descubre productos, agrégalos al carrito y compra por WhatsApp.",
    priceRequired: true,
    supportsCart: true,
  },
  mimenu: {
    id: "mimenu",
    label: "Mi menú",
    shortLabel: "Menú",
    urlSegment: "mimenu",
    categoryLabel: "Secciones",
    subcategoryLabel: "Subsecciones",
    itemLabel: "Platos y bebidas",
    addCategoryLabel: "Agregar sección",
    addSubcategoryLabel: "Agregar subsección",
    addProductLabel: "Agregar plato o bebida",
    addToCartLabel: "Agregar al pedido",
    emptyLabel: "Este menú aún no tiene productos publicados.",
    publicHeadlineFallback: "Explora el menú, arma tu pedido y envíalo por WhatsApp.",
    priceRequired: true,
    supportsCart: true,
  },
  micatalogo: {
    id: "micatalogo",
    label: "Mi catálogo",
    shortLabel: "Catálogo",
    urlSegment: "micatalogo",
    categoryLabel: "Categorías",
    subcategoryLabel: "Subcategorías",
    itemLabel: "Productos",
    addCategoryLabel: "Agregar categoría",
    addSubcategoryLabel: "Agregar subcategoría",
    addProductLabel: "Agregar producto",
    addToCartLabel: "Ver detalle",
    emptyLabel: "Este catálogo aún no tiene productos publicados.",
    publicHeadlineFallback: "Explora referencias y productos en una vitrina simple y clara.",
    priceRequired: false,
    supportsCart: false,
  },
};

export const COMMERCE_PLAN_LIMITS = {
  trial: {
    maxCategories: 8,
    maxSubcategories: 20,
    maxProducts: 30,
  },
  annual: {
    maxCategories: 18,
    maxSubcategories: 80,
    maxProducts: 300,
  },
  agency: {
    maxCategories: 24,
    maxSubcategories: 120,
    maxProducts: 300,
  },
  institutional: {
    maxCategories: 24,
    maxSubcategories: 120,
    maxProducts: 300,
  },
  courtesy: {
    maxCategories: 18,
    maxSubcategories: 80,
    maxProducts: 150,
  },
  default: {
    maxCategories: 18,
    maxSubcategories: 80,
    maxProducts: 300,
  },
};

export const COMMERCE_PRODUCT_PAGE_SIZE = 24;
export const COMMERCE_ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const COMMERCE_MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export function isCommerceMode(value = "") {
  return ["mitienda", "mimenu", "micatalogo"].includes(String(value || "").trim().toLowerCase());
}

export function normalizeCommerceMode(value = "") {
  const next = String(value || "").trim().toLowerCase();
  return isCommerceMode(next) ? next : "";
}

export function resolveCommerceModeMeta(mode = "") {
  const normalizedMode = normalizeCommerceMode(mode);
  return COMMERCE_MODE_META[normalizedMode] || COMMERCE_MODE_META.mitienda;
}

export function resolveCommercePlanLimits(plan = "") {
  const normalizedPlan = String(plan || "").trim().toLowerCase();
  return COMMERCE_PLAN_LIMITS[normalizedPlan] || COMMERCE_PLAN_LIMITS.default;
}

export function requiresCommercePrice(mode = "") {
  return resolveCommerceModeMeta(mode).priceRequired;
}

export function supportsCommerceCart(mode = "") {
  return resolveCommerceModeMeta(mode).supportsCart;
}

export function buildCommercePublicUrl(username = "", mode = "") {
  const slug = sanitizeSlug(username);
  const normalizedMode = normalizeCommerceMode(mode);
  if (!slug || !normalizedMode) return "";
  return `/${slug}/${normalizedMode}`;
}

export function normalizeCommerceConfig(input = {}, user = {}) {
  const activeMode = normalizeCommerceMode(input.activeMode || input.mode || user?.commerce?.activeMode || user?.commerceMode);
  const fallbackWhatsapp = Array.isArray(user?.profileLinks)
    ? user.profileLinks.find((item) => item?.type === "whatsapp")?.value || ""
    : user?.links?.whatsapp || "";

  return {
    activeMode,
    orderWhatsapp: sanitizePhone(input.orderWhatsapp || user?.commerce?.orderWhatsapp || fallbackWhatsapp || ""),
    currency: String(input.currency || user?.commerce?.currency || "COP").trim().toUpperCase() || "COP",
    categoriesCount: Number(input.categoriesCount ?? user?.commerce?.categoriesCount ?? 0) || 0,
    subcategoriesCount: Number(input.subcategoriesCount ?? user?.commerce?.subcategoriesCount ?? 0) || 0,
    productsCount: Number(input.productsCount ?? user?.commerce?.productsCount ?? 0) || 0,
    visibleProductsCount: Number(input.visibleProductsCount ?? user?.commerce?.visibleProductsCount ?? 0) || 0,
    hasContent: Boolean(input.hasContent ?? user?.commerce?.hasContent ?? false),
  };
}

export function buildCommerceThemeName(businessName = "") {
  const label = String(businessName || "").trim();
  return label ? `Tema ${label}` : "Tema del negocio";
}
