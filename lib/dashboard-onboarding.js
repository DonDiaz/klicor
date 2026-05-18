import {
  applyDefaultLinkPriorityTiers,
  BUSINESS_CATEGORY_OPTIONS,
  DEFAULT_BUSINESS_CATEGORY,
  getBusinessTypeOptionsForCategory,
  getBusinessCategoryTemplate,
  isBookingEligibleBusiness,
  normalizeBusinessCategory,
  normalizeBusinessType,
} from "@/lib/business-categories";
import { LINK_CATALOG_MAP } from "@/lib/link-catalog";
import { normalizePaymentMethods } from "@/lib/payment-methods";
import { normalizeProfileLinks } from "@/lib/profile-links";
import { normalizeDorikaProfile } from "@/lib/dorika-profile";
import { APPEARANCE_DEFAULTS, normalizeAppearance, normalizeCustomThemes } from "@/lib/theme-system";
import { sanitizeSlug } from "@/lib/utils";

export const ONBOARDING_STEPS = [
  { id: "category", label: "Tipo de negocio" },
  { id: "identity", label: "Identidad" },
  { id: "actions", label: "Contacto" },
  { id: "payments", label: "Pagos" },
  { id: "design", label: "Diseño" },
];

const ACTION_BLUEPRINTS = {
  food_drink: ["whatsapp", "marketplace", "maps"],
  retail_sales: ["whatsapp", "marketplace", "maps"],
  services: ["whatsapp", "website", "maps"],
  health_wellness: ["whatsapp", "booking", "website", "maps"],
  tourism_experiences: ["whatsapp", "website", "maps"],
};

const SOCIAL_BLUEPRINTS = ["instagram", "facebook", "tiktok"];

function isFiniteMapPoint(profile = {}) {
  return Number.isFinite(profile.latitude) && Number.isFinite(profile.longitude);
}

function buildMapsUrl(latitude, longitude) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return "";
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

function createEmptyBillingProfile() {
  return {
    legalName: "",
    documentType: "nit",
    documentNumber: "",
    verificationDigit: "",
    taxResponsibility: "",
    billingEmail: "",
    billingPhone: "",
    address: "",
    city: "",
    department: "",
    country: "Colombia",
  };
}

export function createEmptyPaymentMethod(index = 0) {
  return {
    id: `payment-method-${index + 1}`,
    entityId: "",
    accountType: "",
    accountNumber: "",
    brebKey: "",
    qrImageUrl: "",
    qrPath: "",
    qrFile: null,
    qrPreviewUrl: "",
    removeQr: false,
  };
}

export function getOnboardingActionBlueprints(category, businessType = "") {
  const normalizedCategory = normalizeBusinessCategory(category);
  const template = getBusinessCategoryTemplate(normalizedCategory);
  const types = (ACTION_BLUEPRINTS[normalizedCategory] || ACTION_BLUEPRINTS[DEFAULT_BUSINESS_CATEGORY])
    .filter((type) => type !== "booking" || isBookingEligibleBusiness({ businessCategory: normalizedCategory, businessType }));

  const actionSlots = types.map((type, index) => ({
    id: `slot-${type}-${index + 1}`,
    type,
    label: template.suggestedLabels[type] || LINK_CATALOG_MAP[type]?.label || "Acción",
    placeholder: LINK_CATALOG_MAP[type]?.placeholder || "",
    required: type === "whatsapp",
    message: type === "whatsapp" ? "Hola, quiero información" : "",
  }));

  const socialSlots = SOCIAL_BLUEPRINTS.map((type, index) => ({
    id: `slot-${type}-${index + 1}`,
    type,
    label: LINK_CATALOG_MAP[type]?.label || type,
    placeholder: LINK_CATALOG_MAP[type]?.placeholder || "",
    required: false,
    message: "",
  }));

  return [...actionSlots, ...socialSlots];
}

function resolveExistingLink(links, type) {
  return links.find((item) => item.type === type) || null;
}

export function buildOnboardingInitialState(profile = {}) {
  const businessCategory = normalizeBusinessCategory(profile.businessCategory);
  const businessType = normalizeBusinessType(profile.businessType || profile.dorikaProfile?.businessType || "", businessCategory);
  const template = getBusinessCategoryTemplate(businessCategory);
  const existingLinks = normalizeProfileLinks(profile.profileLinks, profile.links);
  const existingPaymentMethods = normalizePaymentMethods(
    profile.paymentMethods,
    existingLinks,
    profile.paymentQrUrl,
    profile.paymentQrPath,
  );
  const savedBusinessName = String(profile.businessName || "").trim();
  const ownerName = String(profile.ownerName || "").trim();
  const businessName = !profile.onboardingCompleted && ownerName && savedBusinessName === ownerName
    ? ""
    : savedBusinessName;
  const dorikaProfile = normalizeDorikaProfile(profile.dorikaProfile, {
    businessCategory,
    businessType,
    billingProfile: profile.billingProfile || {},
  });

  return {
    businessName,
    username: businessName ? (profile.username || sanitizeSlug(businessName)) : "",
    businessCategory,
    businessType,
    businessHeadline: String(profile.businessHeadline || "").trim() || template.headline,
    businessSubheadline: String(profile.businessSubheadline || "").trim() || template.subheadline,
    photo: null,
    photoUrl: profile.photo || "",
    actionSlots: getOnboardingActionBlueprints(businessCategory, businessType).map((blueprint) => {
      const existing = resolveExistingLink(existingLinks, blueprint.type);
      return {
        ...blueprint,
        id: existing?.id || blueprint.id,
        label: existing?.label || blueprint.label,
        value: existing?.value || "",
        message: existing?.message || blueprint.message || "",
      };
    }),
    paymentMethods: existingPaymentMethods.length
      ? existingPaymentMethods.map((method) => ({
        ...method,
        qrFile: null,
        qrPreviewUrl: "",
        removeQr: false,
      }))
      : [createEmptyPaymentMethod(0)],
    appearance: normalizeAppearance(profile.settings || APPEARANCE_DEFAULTS),
    customThemes: normalizeCustomThemes(profile.customThemes),
    billingProfile: {
      ...createEmptyBillingProfile(),
      ...(profile.billingProfile || {}),
    },
    dorikaProfile: {
      ...dorikaProfile,
      city: dorikaProfile.city || profile.billingProfile?.city || "",
    },
  };
}

export function updateOnboardingActionSlots(category, businessType = "", currentSlots = []) {
  const currentByType = new Map(currentSlots.map((slot) => [slot.type, slot]));

  return getOnboardingActionBlueprints(category, businessType).map((blueprint) => {
    const current = currentByType.get(blueprint.type);
    return {
      ...blueprint,
      id: current?.id || blueprint.id,
      label: current?.label || blueprint.label,
      value: current?.value || "",
      message: current?.message || blueprint.message || "",
    };
  });
}

export function buildOnboardingProfileLinks(state, profile = {}) {
  const businessCategory = normalizeBusinessCategory(state.businessCategory);
  const businessType = normalizeBusinessType(state.businessType || "", businessCategory);
  const existingLinks = normalizeProfileLinks(profile.profileLinks, profile.links);
  const managedTypes = new Set(getOnboardingActionBlueprints(businessCategory, businessType).map((item) => item.type));
  const retainedLinks = existingLinks.filter((item) => !managedTypes.has(item.type));
  const mapLink = existingLinks.find((item) => item.type === "maps");
  const dorikaProfile = normalizeDorikaProfile(state.dorikaProfile, {
    businessCategory,
    businessType,
    billingProfile: state.billingProfile || profile.billingProfile || {},
  });
  const mapsUrl = isFiniteMapPoint(dorikaProfile)
    ? buildMapsUrl(dorikaProfile.latitude, dorikaProfile.longitude)
    : "";

  const onboardingLinks = state.actionSlots
    .filter((slot) => slot.type !== "maps" && String(slot.value || "").trim())
    .map((slot) => ({
      id: slot.id,
      type: slot.type,
      label: String(slot.label || LINK_CATALOG_MAP[slot.type]?.label || "Acción").trim(),
      value: String(slot.value || "").trim(),
      message: slot.type === "whatsapp" ? String(slot.message || "Hola, quiero información").trim() : "",
    }));

  if (mapsUrl) {
    onboardingLinks.push({
      id: mapLink?.id || "slot-maps-auto",
      type: "maps",
      label: mapLink?.label || LINK_CATALOG_MAP.maps?.label || "Ubicación",
      value: mapsUrl,
      message: "",
    });
  }

  return applyDefaultLinkPriorityTiers([...onboardingLinks, ...retainedLinks], businessCategory);
}

export function resolveOnboardingBusinessTypeOptions(category) {
  return getBusinessTypeOptionsForCategory(category);
}

export function buildOnboardingPayload(state, profile = {}) {
  const businessName = String(state.businessName || "").trim();
  const username = sanitizeSlug(state.username || "");
  const businessCategory = normalizeBusinessCategory(state.businessCategory);
  const businessType = normalizeBusinessType(state.businessType || "", businessCategory);
  const profileLinks = buildOnboardingProfileLinks({ ...state, businessCategory, businessType }, profile);
  const paymentMethods = normalizePaymentMethods(
    state.paymentMethods.map(({ qrFile, qrPreviewUrl, removeQr, ...method }) => method),
  );
  const whatsappLink = profileLinks.find((item) => item.type === "whatsapp");

  return {
    businessName,
    username,
    businessCategory,
    businessType,
    businessHeadline: String(state.businessHeadline || "").trim(),
    businessSubheadline: String(state.businessSubheadline || "").trim(),
    profileLinks,
    paymentMethods,
    appearance: normalizeAppearance(state.appearance || profile.settings || APPEARANCE_DEFAULTS),
    customThemes: normalizeCustomThemes(state.customThemes),
    contactCard: {
      enabled: Boolean(whatsappLink || profile.contactCardEnabled),
      name: businessName,
      title: String(profile.contactCardTitle || "").trim(),
      whatsappLinkId: whatsappLink?.id || "",
      phone: "",
    },
    billingProfile: {
      ...createEmptyBillingProfile(),
      ...(profile.billingProfile || {}),
      ...(state.billingProfile || {}),
    },
    dorikaProfile: normalizeDorikaProfile(state.dorikaProfile, {
      businessCategory,
      businessType,
      billingProfile: state.billingProfile || profile.billingProfile || {},
    }),
  };
}

export function buildOnboardingPreviewUser(state, profile = {}) {
  const payload = buildOnboardingPayload(state, profile);
  return {
    publicLinkId: profile.publicLinkId || "",
    businessName: payload.businessName || "Tu negocio",
    username: payload.username || "tu-usuario",
    businessCategory: payload.businessCategory,
    businessType: payload.businessType,
    businessHeadline: payload.businessHeadline,
    businessSubheadline: payload.businessSubheadline,
    photo: state.photoUrl || profile.photo || "",
    paymentMethods: normalizePaymentMethods(
      state.paymentMethods.map((method) => ({
        ...method,
        qrImageUrl: method.removeQr ? "" : method.qrPreviewUrl || method.qrImageUrl || "",
        qrPath: method.removeQr ? "" : method.qrPath || "",
      })),
    ),
    contactCardEnabled: payload.contactCard.enabled,
    contactCardName: payload.contactCard.name,
    contactCardTitle: payload.contactCard.title,
    contactCardWhatsappLinkId: payload.contactCard.whatsappLinkId,
    contactCardPhone: payload.contactCard.phone,
    settings: payload.appearance,
    profileLinks: payload.profileLinks,
  };
}

export function needsDashboardOnboarding(user = {}) {
  return !Boolean(user?.onboardingCompleted);
}

export function getBusinessCategoryOption(value) {
  return BUSINESS_CATEGORY_OPTIONS.find((item) => item.value === value) || BUSINESS_CATEGORY_OPTIONS[0];
}
