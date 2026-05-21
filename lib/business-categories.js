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

export const BUSINESS_TYPE_OPTIONS_BY_CATEGORY = {
  food_drink: [
    { value: "restaurant", label: "Restaurante" },
    { value: "fast_food", label: "Comidas rápidas" },
    { value: "pizza", label: "Pizzería" },
    { value: "burgers", label: "Hamburguesas" },
    { value: "grill", label: "Asadero o parrilla" },
    { value: "cafe", label: "Cafetería" },
    { value: "bakery", label: "Panadería" },
    { value: "desserts", label: "Repostería y postres" },
    { value: "ice_cream", label: "Heladería" },
    { value: "juice_bar", label: "Jugos y bebidas" },
    { value: "bar", label: "Bar o gastrobar" },
    { value: "seafood", label: "Pescados y mariscos" },
    { value: "healthy_food", label: "Comida saludable" },
    { value: "breakfast_brunch", label: "Desayunos y brunch" },
    { value: "buffet", label: "Buffet o comidas por peso" },
    { value: "catering", label: "Catering y eventos" },
    { value: "food_truck", label: "Food truck" },
    { value: "street_food", label: "Comida callejera" },
  ],
  retail_sales: [
    { value: "neighborhood_store", label: "Tienda de barrio" },
    { value: "supermarket", label: "Supermercado o minimercado" },
    { value: "grocery", label: "Mercado o víveres" },
    { value: "clothing_female", label: "Ropa de mujer" },
    { value: "clothing_male", label: "Ropa de hombre" },
    { value: "clothing_mixed", label: "Ropa mixta" },
    { value: "shoes_female", label: "Zapatos de mujer" },
    { value: "shoes_male", label: "Zapatos de hombre" },
    { value: "shoes_mixed", label: "Zapatos mixtos" },
    { value: "clothing", label: "Ropa general" },
    { value: "shoes", label: "Zapatos general" },
    { value: "accessories", label: "Accesorios" },
    { value: "jewelry", label: "Joyería y bisutería" },
    { value: "beauty_products", label: "Belleza y cuidado personal" },
    { value: "pharmacy", label: "Farmacia o droguería" },
    { value: "optical", label: "Óptica" },
    { value: "supplements", label: "Suplementos y salud" },
    { value: "technology", label: "Tecnología" },
    { value: "cellphones", label: "Celulares y accesorios" },
    { value: "appliances", label: "Electrodomésticos" },
    { value: "furniture", label: "Muebles" },
    { value: "home_goods", label: "Hogar y decoración" },
    { value: "hardware", label: "Ferretería" },
    { value: "paint", label: "Pinturas y materiales" },
    { value: "garden", label: "Jardinería" },
    { value: "stationery", label: "Papelería" },
    { value: "bookstore", label: "Librería" },
    { value: "pet_shop", label: "Mascotas" },
    { value: "sports", label: "Deportes" },
    { value: "toys", label: "Juguetes" },
    { value: "gifts", label: "Regalos y detalles" },
    { value: "flowers", label: "Floristería" },
    { value: "liquor_store", label: "Licorera" },
    { value: "auto_parts", label: "Repuestos para autos o motos" },
    { value: "motorcycles", label: "Motos y accesorios" },
  ],
  services: [
    { value: "professional_services", label: "Servicios profesionales" },
    { value: "technical_repair", label: "Reparación técnica" },
    { value: "home_services", label: "Servicios para el hogar" },
    { value: "construction", label: "Construcción y remodelación" },
    { value: "electrician", label: "Electricidad" },
    { value: "plumbing", label: "Plomería" },
    { value: "cleaning", label: "Limpieza" },
    { value: "laundry", label: "Lavandería" },
    { value: "tailoring", label: "Sastrería o arreglos" },
    { value: "car_wash", label: "Lavadero o autos" },
    { value: "auto_repair", label: "Taller automotriz" },
    { value: "photography", label: "Fotografía y video" },
    { value: "education", label: "Clases o educación" },
    { value: "events", label: "Eventos" },
    { value: "transport", label: "Transporte" },
    { value: "printing", label: "Impresión y papelería comercial" },
    { value: "advertising", label: "Publicidad y diseño" },
    { value: "pet_services", label: "Servicios para mascotas" },
    { value: "legal", label: "Legal" },
    { value: "accounting", label: "Contable" },
  ],
  health_wellness: [
    { value: "barber_shop", label: "Barbería" },
    { value: "beauty_salon", label: "Salón de belleza" },
    { value: "nails", label: "Uñas" },
    { value: "spa", label: "Spa" },
    { value: "aesthetics", label: "Estética" },
    { value: "massage", label: "Masajes" },
    { value: "gym", label: "Gimnasio" },
    { value: "yoga_pilates", label: "Yoga o pilates" },
    { value: "dental", label: "Odontología" },
    { value: "medical_office", label: "Consultorio médico" },
    { value: "psychology", label: "Psicología" },
    { value: "physical_therapy", label: "Fisioterapia" },
    { value: "therapy", label: "Terapias" },
    { value: "nutrition", label: "Nutrición" },
    { value: "wellness_center", label: "Centro de bienestar" },
  ],
  tourism_experiences: [
    { value: "hotel", label: "Hotel" },
    { value: "hostel", label: "Hostal" },
    { value: "glamping", label: "Glamping" },
    { value: "rural_lodging", label: "Alojamiento rural" },
    { value: "finca", label: "Finca o casa campestre" },
    { value: "camping", label: "Camping" },
    { value: "tour_operator", label: "Operador turístico" },
    { value: "travel_agency", label: "Agencia de viajes" },
    { value: "local_experience", label: "Experiencia local" },
    { value: "tourist_site", label: "Sitio turístico" },
    { value: "museum", label: "Museo o cultura" },
    { value: "viewpoint", label: "Mirador" },
    { value: "adventure", label: "Aventura" },
    { value: "nature_trail", label: "Sendero o naturaleza" },
    { value: "cultural_center", label: "Centro cultural" },
    { value: "tourist_transport", label: "Transporte turístico" },
    { value: "guide", label: "Guía turístico" },
  ],
};

export const BOOKING_ELIGIBLE_BUSINESS_TYPES = new Set([
  "barber_shop",
  "beauty_salon",
  "nails",
  "spa",
  "aesthetics",
  "massage",
  "dental",
  "medical_office",
  "psychology",
  "physical_therapy",
  "therapy",
  "nutrition",
  "wellness_center",
  "pet_grooming",
  "veterinary",
]);

export const BOOKING_EXCLUDED_HEALTH_WELLNESS_TYPES = new Set([
  "gym",
  "yoga_pilates",
]);

export const COMMERCE_ENABLED_BUSINESS_CATEGORIES = new Set([
  "food_drink",
  "retail_sales",
  "services",
  "health_wellness",
]);

const BUSINESS_CATEGORY_TEMPLATES = {
  food_drink: {
    label: "Comida y bebidas",
    headline: "Pedidos, menú y atención en un solo link y un QR",
    subheadline: "Haz tus pedidos aquí.",
    linkPriority: ["marketplace", "whatsapp", "website", "maps", "instagram", "facebook", "tiktok", "email"],
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
    linkPriority: ["marketplace", "whatsapp", "website", "maps", "instagram", "facebook", "tiktok", "email"],
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
      website: "Pagina web",
      maps: "Ubicación",
    },
  },
  health_wellness: {
    label: "Salud y bienestar",
    headline: "Reservas, servicios y contacto en un solo link y un QR",
    subheadline: "Agenda tu atención aquí.",
    linkPriority: ["booking", "whatsapp", "website", "maps", "instagram", "facebook", "tiktok", "email"],
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
    linkPriority: ["website", "whatsapp", "maps", "instagram", "facebook", "tiktok", "email"],
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
    visibleWorkspaces: ["commerce", "blocks", "design", "dorika", "profile", "security", "billing", "subscription"],
    moduleLabel: "Mi menú",
    hint: "Klicor prioriza Mi menú para que organices platos, categorías y pedidos por WhatsApp.",
  },
  retail_sales: {
    primaryWorkspace: "commerce",
    recommendedWorkspaces: ["commerce", "blocks", "design"],
    visibleWorkspaces: ["commerce", "blocks", "design", "dorika", "profile", "security", "billing", "subscription"],
    moduleLabel: "Mi tienda / Mi catálogo",
    hint: "Klicor prioriza Mi tienda o Mi catálogo para mostrar productos y convertir visitas en conversaciones.",
  },
  health_wellness: {
    primaryWorkspace: "booking",
    recommendedWorkspaces: ["booking", "blocks", "design"],
    visibleWorkspaces: ["booking", "blocks", "design", "dorika", "profile", "security", "billing", "subscription"],
    moduleLabel: "Agenda",
    hint: "Klicor prioriza Agenda para que tus clientes reserven citas sin escribir de más.",
  },
  services: {
    primaryWorkspace: "blocks",
    recommendedWorkspaces: ["blocks", "design"],
    visibleWorkspaces: ["blocks", "design", "dorika", "profile", "security", "billing", "subscription"],
    moduleLabel: "WhatsApp / Servicios",
    hint: "Klicor prioriza WhatsApp, enlaces y atención directa para negocios que trabajan por solicitud o cotización.",
  },
  tourism_experiences: {
    primaryWorkspace: "reservations",
    recommendedWorkspaces: ["reservations", "blocks", "design"],
    visibleWorkspaces: ["reservations", "blocks", "design", "dorika", "profile", "security", "billing", "subscription"],
    moduleLabel: "Reservas",
    hint: "Klicor prioriza Reservas para turismo y experiencias. Este módulo está preparado como próximo paso.",
  },
};

export function normalizeBusinessCategory(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  return BUSINESS_CATEGORY_TEMPLATES[normalized] ? normalized : DEFAULT_BUSINESS_CATEGORY;
}

export function getBusinessTypeOptionsForCategory(category) {
  return BUSINESS_TYPE_OPTIONS_BY_CATEGORY[normalizeBusinessCategory(category)] || [];
}

export function normalizeBusinessType(value = "", category = DEFAULT_BUSINESS_CATEGORY) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "";
  return getBusinessTypeOptionsForCategory(category).some((option) => option.value === normalized)
    ? normalized
    : "";
}

export function isBookingEligibleBusiness({ businessCategory = "", businessType = "" } = {}) {
  const category = normalizeBusinessCategory(businessCategory);
  const type = normalizeBusinessType(businessType, category);
  if (category !== "health_wellness") return false;
  if (!type) return true;
  if (BOOKING_EXCLUDED_HEALTH_WELLNESS_TYPES.has(type)) return false;
  return BOOKING_ELIGIBLE_BUSINESS_TYPES.has(type);
}

export function isCommerceEligibleBusiness({ businessCategory = "" } = {}) {
  return COMMERCE_ENABLED_BUSINESS_CATEGORIES.has(normalizeBusinessCategory(businessCategory));
}

export function isBusinessModuleEligible(profile = {}, module = "") {
  const normalizedModule = String(module || "").trim().toLowerCase();
  if (normalizedModule === "booking" || normalizedModule === "agenda") {
    return isBookingEligibleBusiness(profile);
  }
  if (normalizedModule === "commerce" || normalizedModule === "commercial") {
    return isCommerceEligibleBusiness(profile);
  }
  return false;
}

export function resolveBusinessTypeLabel(value = "", category = DEFAULT_BUSINESS_CATEGORY) {
  const normalized = normalizeBusinessType(value, category);
  return getBusinessTypeOptionsForCategory(category).find((option) => option.value === normalized)?.label || "";
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

export function getVisibleWorkspaceIdsForBusinessCategory(category) {
  return getBusinessCategoryModuleRecommendation(category).visibleWorkspaces || ["blocks", "design", "profile", "security", "billing", "subscription"];
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
