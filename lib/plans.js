export const DEFAULT_PAID_PLAN = "commercial";
export const LEGACY_ANNUAL_PLAN = "annual";

export const PLAN_PRICE_SETTING_KEYS = {
  basic: "basicAnnualPrice",
  commercial: "commercialAnnualPrice",
  plus: "plusAnnualPrice",
  pro: "proAnnualPrice",
};

export const PLAN_ALIASES = {
  anual: "plus",
  annual: "plus",
  esencial: "basic",
  basico: "basic",
  básico: "basic",
  negocio: "commercial",
  comercial: "commercial",
  active: "commercial",
  activo: "commercial",
  grace_period: "commercial",
};

export const KLICOR_PLAN_DEFINITIONS = {
  trial: {
    value: "trial",
    label: "Trial",
    publicName: "Prueba gratis",
    annualPrice: 0,
    hidden: true,
    description: "Prueba inicial para validar el negocio antes de pagar.",
    limits: {
      commerceCategories: 8,
      commerceSubcategories: 20,
      commerceProducts: 30,
      dorikaFeaturedProducts: 2,
      bookingServices: 5,
      bookingStaff: 2,
      reservationPlans: 2,
      serviceCatalogItems: 10,
      automations: 0,
    },
    features: {
      publicProfile: true,
      qr: true,
      socialLinks: true,
      paymentMethods: true,
      businessHours: true,
      commerce: true,
      store: true,
      menu: true,
      catalog: true,
      productGallery: true,
      dorikaVisibility: true,
      dorikaFeaturedProducts: true,
      agenda: true,
      reservations: false,
      serviceCatalog: true,
      analytics: false,
      automations: false,
    },
  },
  basic: {
    value: "basic",
    label: "Básico",
    publicName: "Básico",
    annualPrice: 59900,
    description: "Para negocios que necesitan presencia digital rápida, QR, WhatsApp, redes, pagos y horarios.",
    limits: {
      commerceCategories: 0,
      commerceSubcategories: 0,
      commerceProducts: 0,
      dorikaFeaturedProducts: 0,
      bookingServices: 0,
      bookingStaff: 0,
      reservationPlans: 0,
      serviceCatalogItems: 0,
      automations: 0,
    },
    features: {
      publicProfile: true,
      qr: true,
      socialLinks: true,
      paymentMethods: true,
      businessHours: true,
      commerce: false,
      store: false,
      menu: false,
      catalog: false,
      productGallery: false,
      dorikaVisibility: true,
      dorikaFeaturedProducts: false,
      agenda: false,
      reservations: false,
      serviceCatalog: false,
      analytics: false,
      automations: false,
    },
  },
  commercial: {
    value: "commercial",
    label: "Comercial",
    publicName: "Comercial",
    annualPrice: 109900,
    badge: "Recomendado",
    description: "Para negocios que venden, atienden o agendan con una operación sencilla y organizada.",
    limits: {
      commerceCategories: 12,
      commerceSubcategories: 40,
      commerceProducts: 50,
      dorikaFeaturedProducts: 5,
      bookingServices: 20,
      bookingStaff: 5,
      reservationPlans: 8,
      serviceCatalogItems: 50,
      automations: 0,
    },
    features: {
      publicProfile: true,
      qr: true,
      socialLinks: true,
      paymentMethods: true,
      businessHours: true,
      commerce: true,
      store: true,
      menu: true,
      catalog: true,
      productGallery: true,
      dorikaVisibility: true,
      dorikaFeaturedProducts: true,
      agenda: true,
      reservations: true,
      serviceCatalog: true,
      analytics: false,
      automations: false,
    },
  },
  plus: {
    value: "plus",
    label: "Plus",
    publicName: "Plus",
    annualPrice: 169900,
    description: "Para negocios con más productos, servicios, equipo o capacidad de crecimiento.",
    limits: {
      commerceCategories: 24,
      commerceSubcategories: 120,
      commerceProducts: 300,
      dorikaFeaturedProducts: 12,
      bookingServices: 60,
      bookingStaff: 12,
      reservationPlans: 30,
      serviceCatalogItems: 300,
      automations: 3,
    },
    features: {
      publicProfile: true,
      qr: true,
      socialLinks: true,
      paymentMethods: true,
      businessHours: true,
      commerce: true,
      store: true,
      menu: true,
      catalog: true,
      productGallery: true,
      dorikaVisibility: true,
      dorikaFeaturedProducts: true,
      agenda: true,
      reservations: true,
      serviceCatalog: true,
      analytics: true,
      automations: true,
    },
  },
  pro: {
    value: "pro",
    label: "Pro",
    publicName: "Pro",
    annualPrice: 299900,
    hidden: true,
    description: "Plan oculto para negocios con alto volumen, prioridad operativa y más capacidad.",
    limits: {
      commerceCategories: 40,
      commerceSubcategories: 200,
      commerceProducts: 500,
      dorikaFeaturedProducts: 24,
      bookingServices: 120,
      bookingStaff: 30,
      reservationPlans: 80,
      serviceCatalogItems: 500,
      automations: 10,
    },
    features: {
      publicProfile: true,
      qr: true,
      socialLinks: true,
      paymentMethods: true,
      businessHours: true,
      commerce: true,
      store: true,
      menu: true,
      catalog: true,
      productGallery: true,
      dorikaVisibility: true,
      dorikaFeaturedProducts: true,
      agenda: true,
      reservations: true,
      serviceCatalog: true,
      analytics: true,
      automations: true,
    },
  },
  institutional: {
    value: "institutional",
    label: "Institucional",
    publicName: "Institucional",
    annualPrice: 109900,
    hidden: true,
    description: "Plan administrativo para convenios, aliados o programas institucionales.",
    inheritsFrom: "commercial",
  },
  agency: {
    value: "agency",
    label: "Agencia",
    publicName: "Agencia",
    annualPrice: 109900,
    hidden: true,
    description: "Plan administrativo para cuentas gestionadas por agencia.",
    inheritsFrom: "plus",
  },
  courtesy: {
    value: "courtesy",
    label: "Cortesía",
    publicName: "Cortesía",
    annualPrice: 0,
    hidden: true,
    description: "Acceso manual sin cobro para pruebas, aliados o casos especiales.",
    inheritsFrom: "plus",
  },
};

export const KLICOR_PLAN_VALUES = Object.keys(KLICOR_PLAN_DEFINITIONS);
export const BILLABLE_PLAN_VALUES = ["basic", "commercial", "plus", "pro"];
export const LANDING_PLAN_VALUES = ["basic", "commercial", "plus"];

export const KLICOR_PLAN_OPTIONS = KLICOR_PLAN_VALUES.map((value) => ({
  value,
  label: KLICOR_PLAN_DEFINITIONS[value].label,
}));

export const BILLABLE_PLAN_OPTIONS = BILLABLE_PLAN_VALUES.map((value) => ({
  value,
  label: KLICOR_PLAN_DEFINITIONS[value].label,
}));

export function normalizeKlicorPlan(value = "") {
  const raw = String(value || "").trim().toLowerCase();
  const alias = PLAN_ALIASES[raw] || raw;
  return KLICOR_PLAN_DEFINITIONS[alias] ? alias : "trial";
}

export function getPlanDefinition(plan = "") {
  const normalizedPlan = normalizeKlicorPlan(plan);
  const definition = KLICOR_PLAN_DEFINITIONS[normalizedPlan] || KLICOR_PLAN_DEFINITIONS.trial;
  if (!definition.inheritsFrom) return definition;

  const parent = KLICOR_PLAN_DEFINITIONS[definition.inheritsFrom] || KLICOR_PLAN_DEFINITIONS.commercial;
  return {
    ...parent,
    ...definition,
    limits: {
      ...(parent.limits || {}),
      ...(definition.limits || {}),
    },
    features: {
      ...(parent.features || {}),
      ...(definition.features || {}),
    },
  };
}

export function getPlanPriceSettingKey(plan = "") {
  return PLAN_PRICE_SETTING_KEYS[normalizeKlicorPlan(plan)] || "";
}

export function getPlanAnnualPrice(plan = "", settings = {}) {
  const normalizedPlan = normalizeKlicorPlan(plan);
  if (normalizedPlan === "trial" || normalizedPlan === "courtesy") return 0;
  if (normalizedPlan === "agency") {
    return Number(settings.agencyAnnualPrice ?? settings.commercialAnnualPrice ?? settings.annualPrice ?? getPlanDefinition("commercial").annualPrice) || 0;
  }
  if (normalizedPlan === "institutional") {
    return Number(settings.partnerDefaultPrice ?? settings.commercialAnnualPrice ?? settings.annualPrice ?? getPlanDefinition("commercial").annualPrice) || 0;
  }

  const priceKey = getPlanPriceSettingKey(normalizedPlan);
  const fallback = getPlanDefinition(normalizedPlan).annualPrice;
  return Number(settings[priceKey] ?? (normalizedPlan === "commercial" ? settings.annualPrice : undefined) ?? fallback) || 0;
}

export function formatPlanPrice(plan = "", settings = {}) {
  const price = getPlanAnnualPrice(plan, settings);
  return `$${Number(price || 0).toLocaleString("es-CO")}`;
}

export function getPlanLimit(plan = "", key = "") {
  const definition = getPlanDefinition(plan);
  return Number(definition.limits?.[key] ?? 0) || 0;
}

export function canUsePlanFeature(plan = "", feature = "") {
  const definition = getPlanDefinition(plan);
  return Boolean(definition.features?.[feature]);
}

export function resolveCommerceLimitsForPlan(plan = "") {
  return {
    maxCategories: getPlanLimit(plan, "commerceCategories"),
    maxSubcategories: getPlanLimit(plan, "commerceSubcategories"),
    maxProducts: getPlanLimit(plan, "commerceProducts"),
  };
}

export function getLandingPricingPlans() {
  return LANDING_PLAN_VALUES.map((planValue) => {
    const definition = getPlanDefinition(planValue);
    const commonBadge = "Precio de lanzamiento";
    const featuresByPlan = {
      basic: [
        "Link personalizado",
        "Código QR incluido",
        "Botones (WhatsApp, redes)",
        "Métodos de pago",
        "Horarios de atención",
      ],
      commercial: [
        "Todo lo del plan Básico",
        "Hasta 50 productos",
        "Tienda, menú o catálogo",
        "Productos destacados en Dorika",
        "Agenda y reservas listas para activar",
      ],
      plus: [
        "Todo lo del plan Comercial",
        "Hasta 300 productos",
        "Más capacidad para servicios",
        "Más destacados en Dorika",
        "Ideal para negocios en crecimiento",
      ],
    };

    return {
      name: definition.publicName,
      price: formatPlanPrice(planValue),
      period: "Pago anual",
      badge: definition.badge || commonBadge,
      note: commonBadge,
      features: featuresByPlan[planValue] || [],
      buttonLabel: planValue === "basic"
        ? "Empezar"
        : planValue === "commercial"
          ? "Elegir plan"
          : "Escalar mi negocio",
    };
  });
}
