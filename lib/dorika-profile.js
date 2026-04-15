import { normalizeBusinessCategory } from "@/lib/business-categories";

export const DORIKA_LOCATION_PRIVACY_VALUES = ["exact", "zone", "contact_only"];

export const DORIKA_LOCATION_PRIVACY_OPTIONS = [
  {
    value: "exact",
    label: "Mostrar ubicación exacta",
    copy: "Ideal si tus clientes pueden visitarte sin pedir más datos.",
  },
  {
    value: "zone",
    label: "Mostrar solo ciudad o zona",
    copy: "Útil si atiendes por sector, domicilio o no quieres mostrar la dirección completa.",
  },
  {
    value: "contact_only",
    label: "Solo contacto",
    copy: "Tu negocio aparece en Dorika, pero sin ubicación visible.",
  },
];

function clean(value = "") {
  return String(value || "").trim();
}

export function normalizeDorikaProfile(input = {}, business = {}) {
  const source = input && typeof input === "object" ? input : {};
  const privacy = DORIKA_LOCATION_PRIVACY_VALUES.includes(source.locationPrivacy)
    ? source.locationPrivacy
    : source.showLocation === false
      ? "contact_only"
      : "exact";

  return {
    enabled: source.enabled !== false,
    showLocation: privacy !== "contact_only" && source.showLocation !== false,
    locationPrivacy: privacy,
    city: clean(source.city || business.city || business.billingProfile?.city || ""),
    zone: clean(source.zone || source.neighborhood || ""),
    address: clean(source.address || ""),
    placeName: clean(source.placeName || ""),
    floor: clean(source.floor || ""),
    unit: clean(source.unit || ""),
    reference: clean(source.reference || ""),
    arrivalInstructions: clean(source.arrivalInstructions || ""),
    coverImageUrl: clean(source.coverImageUrl || ""),
    coverImagePath: clean(source.coverImagePath || ""),
    description: clean(source.description || ""),
    category: normalizeBusinessCategory(source.category || business.businessCategory),
    featuredProductIds: Array.isArray(source.featuredProductIds)
      ? source.featuredProductIds.map((item) => clean(item)).filter(Boolean).slice(0, 24)
      : [],
  };
}

export function calculateDorikaProfileProgress(input = {}, business = {}) {
  const profile = normalizeDorikaProfile(input, business);
  const locationReady = profile.locationPrivacy === "contact_only"
    ? true
    : Boolean(profile.city && (profile.locationPrivacy === "zone" || profile.address || profile.placeName));

  const tasks = [
    {
      id: "visibility",
      label: "Aparecer en Dorika",
      complete: profile.enabled,
      copy: profile.enabled ? "Tu negocio podrá entrar al directorio." : "Activa Dorika cuando quieras ser descubierto.",
    },
    {
      id: "location",
      label: "Ubicación o zona",
      complete: locationReady,
      copy: "Ayuda a que te encuentren sin escribirte primero.",
    },
    {
      id: "cover",
      label: "Portada para Dorika",
      complete: Boolean(profile.coverImageUrl),
      copy: "Una foto amplia hace que tu ficha se vea más confiable.",
    },
    {
      id: "description",
      label: "Descripción corta",
      complete: profile.description.length >= 12,
      copy: "Cuenta en una frase qué vendes o qué experiencia ofreces.",
    },
    {
      id: "category",
      label: "Categoría clara",
      complete: Boolean(profile.category),
      copy: "Dorika podrá ubicarte mejor en búsquedas y secciones.",
    },
  ];

  const completeCount = tasks.filter((task) => task.complete).length;
  const percent = Math.round((completeCount / tasks.length) * 100);

  return {
    percent,
    completeCount,
    totalCount: tasks.length,
    tasks,
    profile,
  };
}
