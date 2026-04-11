import { LINK_CATALOG_MAP } from "@/lib/link-catalog";

export const DEFAULT_BUSINESS_CATEGORY = "services";
export const SOCIAL_LINK_TYPES = new Set(["instagram", "facebook", "tiktok", "youtube", "linkedin", "telegram", "x", "threads", "spotify", "twitch"]);
export const LINK_PRIORITY_LIMITS = {
  1: 1,
  2: 2,
};

export const BUSINESS_CATEGORY_OPTIONS = [
  { value: "food_drink", label: "Comida y bebidas" },
  { value: "retail_sales", label: "Tiendas y ventas" },
  { value: "services", label: "Servicios" },
  { value: "health_wellness", label: "Salud y bienestar" },
  { value: "tourism_experiences", label: "Turismo y experiencias" },
];

const BUSINESS_CATEGORY_TEMPLATES = {
  food_drink: {
    label: "Comida y bebidas",
    headline: "Pedidos, menú y atención en un solo link y un QR",
    subheadline: "Haz tus pedidos aquí.",
    linkPriority: ["whatsapp", "website", "marketplace", "maps", "instagram", "facebook", "tiktok", "email"],
    suggestedLabels: {
      whatsapp: "Ordena por WhatsApp",
      website: "Ver menú",
      marketplace: "Ver catálogo",
      maps: "Cómo llegar",
    },
  },
  retail_sales: {
    label: "Tiendas y ventas",
    headline: "Catálogo, compra y contacto en un solo link y un QR",
    subheadline: "Haz tu compra aquí.",
    linkPriority: ["whatsapp", "marketplace", "website", "maps", "instagram", "facebook", "tiktok", "email"],
    suggestedLabels: {
      whatsapp: "Comprar por WhatsApp",
      marketplace: "Ver catálogo",
      website: "Ver catálogo",
      maps: "Cómo llegar",
    },
  },
  services: {
    label: "Servicios",
    headline: "Cotizaciones y atención en un solo link y un QR",
    subheadline: "Centraliza tu atención aquí.",
    linkPriority: ["whatsapp", "website", "maps", "instagram", "facebook", "linkedin", "email"],
    suggestedLabels: {
      whatsapp: "Cotiza por WhatsApp",
      website: "Agendar cita",
      maps: "Servicios",
    },
  },
  health_wellness: {
    label: "Salud y bienestar",
    headline: "Reservas, servicios y contacto en un solo link y un QR",
    subheadline: "Agenda tu atención aquí.",
    linkPriority: ["whatsapp", "website", "maps", "instagram", "facebook", "tiktok", "email"],
    suggestedLabels: {
      whatsapp: "Reserva por WhatsApp",
      website: "Ver servicios",
      maps: "Cómo llegar",
    },
  },
  tourism_experiences: {
    label: "Turismo y experiencias",
    headline: "Reservas, ubicación y contacto en un solo link y un QR",
    subheadline: "Descubre tus planes aquí.",
    linkPriority: ["whatsapp", "website", "maps", "instagram", "facebook", "tiktok", "email"],
    suggestedLabels: {
      whatsapp: "Reserva por WhatsApp",
      website: "Ver planes",
      maps: "Cómo llegar",
    },
  },
};

const BUSINESS_CATEGORY_MODULE_RECOMMENDATIONS = {
  food_drink: {
    primaryWorkspace: "commerce",
    recommendedWorkspaces: ["commerce", "blocks", "design"],
    moduleLabel: "Mi menú",
    hint: "Klicor prioriza Mi menú para que organices platos, categorías y pedidos por WhatsApp.",
  },
  retail_sales: {
    primaryWorkspace: "commerce",
    recommendedWorkspaces: ["commerce", "blocks", "design"],
    moduleLabel: "Mi tienda / Mi catálogo",
    hint: "Klicor prioriza Mi tienda o Mi catálogo para mostrar productos y convertir visitas en conversaciones.",
  },
  health_wellness: {
    primaryWorkspace: "booking",
    recommendedWorkspaces: ["booking", "blocks", "design"],
    moduleLabel: "Agenda",
    hint: "Klicor prioriza Agenda para que tus clientes reserven citas sin escribir de más.",
  },
  services: {
    primaryWorkspace: "blocks",
    recommendedWorkspaces: ["blocks", "booking", "design"],
    moduleLabel: "WhatsApp / Servicios / Agenda",
    hint: "Klicor prioriza WhatsApp, servicios y agenda para negocios que venden atención personalizada.",
  },
  tourism_experiences: {
    primaryWorkspace: "booking",
    recommendedWorkspaces: ["booking", "blocks", "design"],
    moduleLabel: "Reservas / Agenda / Planes",
    hint: "Klicor prioriza reservas, agenda y planes para convertir interesados en clientes confirmados.",
  },
};

export function normalizeBusinessCategory(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  return BUSINESS_CATEGORY_TEMPLATES[normalized] ? normalized : DEFAULT_BUSINESS_CATEGORY;
}

export function getBusinessCategoryTemplate(category) {
  return BUSINESS_CATEGORY_TEMPLATES[normalizeBusinessCategory(category)];
}

export function getBusinessCategoryModuleRecommendation(category) {
  return BUSINESS_CATEGORY_MODULE_RECOMMENDATIONS[normalizeBusinessCategory(category)]
    || BUSINESS_CATEGORY_MODULE_RECOMMENDATIONS[DEFAULT_BUSINESS_CATEGORY];
}

export function getPrimaryWorkspaceForBusinessCategory(category) {
  return getBusinessCategoryModuleRecommendation(category).primaryWorkspace || "blocks";
}

export function getRecommendedWorkspaceIdsForBusinessCategory(category) {
  return getBusinessCategoryModuleRecommendation(category).recommendedWorkspaces || ["blocks"];
}

export function resolveBusinessCategoryLabel(category) {
  return getBusinessCategoryTemplate(category).label;
}

export function resolveBusinessIdentityCopy(profile = {}) {
  const template = getBusinessCategoryTemplate(profile.businessCategory);
  return {
    categoryLabel: template.label,
    headline: String(profile.businessHeadline || "").trim() || template.headline,
    subheadline: String(profile.businessSubheadline || "").trim() || template.subheadline,
  };
}

export function sortLinksByBusinessCategory(links = [], category) {
  const template = getBusinessCategoryTemplate(category);
  const priorityMap = new Map(template.linkPriority.map((type, index) => [type, index]));

  return [...links].sort((left, right) => {
    const leftPriority = priorityMap.has(left.type) ? priorityMap.get(left.type) : 999;
    const rightPriority = priorityMap.has(right.type) ? priorityMap.get(right.type) : 999;
    if (leftPriority !== rightPriority) return leftPriority - rightPriority;
    return String(left.label || "").localeCompare(String(right.label || ""));
  });
}

export function isSocialLinkType(type = "") {
  return SOCIAL_LINK_TYPES.has(String(type || "").trim().toLowerCase());
}

export function normalizeLinkPriorityTier(value) {
  const next = Number(value);
  return [1, 2, 3].includes(next) ? next : 3;
}

export function applyDefaultLinkPriorityTiers(links = [], category) {
  const orderedIds = new Map();
  let actionIndex = 0;

  sortLinksByBusinessCategory(links, category).forEach((item) => {
    if (!item?.id || item.type === "payment_key" || isSocialLinkType(item.type)) return;
    actionIndex += 1;
    orderedIds.set(item.id, actionIndex === 1 ? 1 : actionIndex <= 3 ? 2 : 3);
  });

  return links.map((item) => ({
    ...item,
    priorityTier: item.type === "payment_key" || isSocialLinkType(item.type)
      ? 3
      : normalizeLinkPriorityTier(item.priorityTier || orderedIds.get(item.id) || 3),
  }));
}

export function getDefaultPriorityTierForNewLink(currentLinks = [], type = "", category) {
  const probeId = `draft-${type || "link"}`;
  const nextLinks = applyDefaultLinkPriorityTiers([
    ...currentLinks,
    {
      id: probeId,
      type: type || "website",
      label: LINK_CATALOG_MAP[type]?.label || "Enlace",
      value: "",
      message: "",
    },
  ], category);

  return nextLinks.find((item) => item.id === probeId)?.priorityTier || 3;
}

export function resolveBusinessLinkLabel(item, category) {
  const template = getBusinessCategoryTemplate(category);
  const currentLabel = String(item?.label || "").trim();
  const catalogLabel = LINK_CATALOG_MAP[item?.type]?.label || "";
  const suggested = template.suggestedLabels[item?.type];

  if (suggested && (!currentLabel || currentLabel === catalogLabel)) {
    return suggested;
  }

  return currentLabel || catalogLabel || "Abrir";
}
