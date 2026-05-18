"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  CalendarCheck,
  CalendarDays,
  Copy,
  ShoppingBag,
  CreditCard,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  FileText,
  ImagePlus,
  Link2,
  MapPin,
  MapPinned,
  Menu,
  Moon,
  Paintbrush,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  UploadCloud,
  Mail,
  Phone,
  LogOut,
  Send,
  ShieldCheck,
  Star,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import {
  applyDefaultLinkPriorityTiers,
  BUSINESS_CATEGORY_OPTIONS,
  getBusinessCategoryModuleRecommendation,
  getBusinessTypeOptionsForCategory,
  getDefaultPriorityTierForNewLink,
  getPrimaryWorkspaceForBusinessCategory,
  getRecommendedWorkspaceIdsForBusinessCategory,
  getVisibleWorkspaceIdsForBusinessCategory,
  isBusinessModuleEligible,
  isSocialLinkType,
  normalizeBusinessCategory,
} from "@/lib/business-categories";
import {
  BUSINESS_HOUR_DAY_OPTIONS,
  createDefaultBusinessHourDay,
  formatDisplayTime,
  getBusinessOpenStatus,
  normalizeBusinessHours,
} from "@/lib/business-hours";
import {
  ACCOUNT_TYPE_OPTIONS,
  COLOMBIA_FINANCIAL_ENTITY_OPTIONS,
  requiresAccountType,
  resolveFinancialEntityLabel,
  usesBrebKeyField,
} from "@/lib/colombia-financial-entities";
import { COLOMBIA_DEPARTMENT_OPTIONS, getCitiesForDepartment, resolveCityName, resolveDepartmentName } from "@/lib/colombia-locations";
import { normalizeCommerceMode, resolveCommerceModeMeta, resolveDefaultCommerceModeForBusinessCategory } from "@/lib/commerce-config";
import { resolveContactCardData } from "@/lib/contact-card";
import { calculateDorikaProfileProgress, DORIKA_LOCATION_PRIVACY_OPTIONS, normalizeDorikaProfile } from "@/lib/dorika-profile";
import { isDorikaEligibleBusiness } from "@/lib/dorika-eligibility";
import { getLinkTypeCount, LINK_CATALOG, LINK_CATALOG_MAP } from "@/lib/link-catalog";
import { normalizePaymentMethods } from "@/lib/payment-methods";
import { canUseModule, resolvePrimaryModuleForBusinessCategory, resolveUserModuleAccess, shouldRestrictToPrimaryModuleOnProfileChange } from "@/lib/plans";
import { isSystemProfileLink, mergeSystemProfileLinks } from "@/lib/system-profile-links";
import { generateThemeFromLogoFile, mergeGeneratedTheme } from "@/lib/logo-theme";
import { FONT_FAMILY_STYLE_MAP } from "@/app/fonts";
import {
  APPEARANCE_DEFAULTS,
  APPEARANCE_FONT_OPTIONS,
  APPEARANCE_PRESETS,
  APPEARANCE_SWATCHES,
  SOCIAL_STYLE_OPTIONS,
  getAppearanceSuggestions,
  getAppearanceWarnings,
  normalizeAppearance,
  normalizeCustomThemes,
} from "@/lib/theme-system";
const THEME_STORAGE_KEY = "klicor-theme-preference";

const DashboardPreview = dynamic(
  () => import("@/components/dashboard-preview").then((mod) => mod.DashboardPreview),
  {
    loading: () => (
      <div className="preview-frame preview-frame-placeholder">
        <div className="preview-placeholder-card">
          <strong>Cargando vista previa</strong>
          <p className="section-copy">Preparamos la representación real de tu página pública.</p>
        </div>
      </div>
    ),
  },
);

const CommerceWorkspace = dynamic(
  () => import("@/components/commerce-workspace").then((mod) => mod.CommerceWorkspace),
  {
    loading: () => (
      <section className="card dashboard-section">
        <strong>Cargando presencia comercial</strong>
        <p className="section-copy">Preparamos categorías, productos y la vista pública comercial.</p>
      </section>
    ),
  },
);

const BookingWorkspace = dynamic(
  () => import("@/components/booking-workspace").then((mod) => mod.BookingWorkspace),
  {
    loading: () => (
      <section className="card dashboard-section">
        <strong>Cargando agenda</strong>
        <p className="section-copy">Preparamos servicios, personal, horarios y reservas.</p>
      </section>
    ),
  },
);

const DorikaMapPicker = dynamic(
  () => import("@/components/dorika-map-picker").then((mod) => mod.DorikaMapPicker),
  {
    ssr: false,
    loading: () => null,
  },
);

function normalizeLinks(profile) {
  const category = normalizeBusinessCategory(profile?.businessCategory);

  if (Array.isArray(profile?.profileLinks) && profile.profileLinks.length) {
    return applyDefaultLinkPriorityTiers(mergeSystemProfileLinks(profile.profileLinks
      .filter((item) => item?.type !== "payment_key")
      .map((item) => ({
      id: item.id,
      type: item.type,
      label: item.label,
      value: item.value,
      message: item.message || "",
      priorityTier: item.priorityTier,
    })), profile), category);
  }

  const legacy = profile?.links || {};
  return applyDefaultLinkPriorityTiers(
    mergeSystemProfileLinks(Object.entries(legacy)
      .filter(([type]) => type !== "payment_key")
      .filter(([, value]) => value)
      .map(([type, value], index) => ({
        id: `${type}-${index}`,
        type,
        label: LINK_CATALOG_MAP[type]?.label || "Enlace",
        value,
        message: type === "whatsapp" ? "Hola, quiero información" : "",
      })), profile),
    category,
  );
}

function normalizeLinkUrl(item) {
  const raw = String(item.value || "").trim();
  if (!raw) return "";

  const meta = LINK_CATALOG_MAP[item.type];
  if (meta?.kind === "phone") {
    const digits = raw.replace(/\D/g, "");
    const message = (item.message || "Hola, quiero información").trim();
    return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : "";
  }

  if (meta?.kind === "email") {
    return raw ? `mailto:${raw.toLowerCase()}` : "";
  }

  if (meta?.kind === "text") {
    return "";
  }

  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

function cleanPersistentImageUrl(value = "") {
  const url = String(value || "").trim();
  if (!url || /^blob:/i.test(url) || /^data:/i.test(url)) return "";
  return url;
}

function canDisplayPersistedImageUrl(value = "") {
  const url = cleanPersistentImageUrl(value);
  return Boolean(url && (/^https?:\/\//i.test(url) || url.startsWith("/")));
}

function resolveImageVersion(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value?.toMillis === "function") return String(value.toMillis());
  return String(value.seconds || value._seconds || value.nanoseconds || value._nanoseconds || "");
}

function addImageVersion(url = "", version = "") {
  const cleanUrl = cleanPersistentImageUrl(url);
  const cleanVersion = String(version || "").trim();
  if (!cleanUrl || !cleanVersion || /^blob:/i.test(cleanUrl)) return cleanUrl;
  return `${cleanUrl}${cleanUrl.includes("?") ? "&" : "?"}v=${encodeURIComponent(cleanVersion)}`;
}

function normalizeContactCard(profile) {
  return {
    enabled: Boolean(profile?.contactCardEnabled),
    name: profile?.contactCardName || "",
    title: profile?.contactCardTitle || "",
    whatsappLinkId: profile?.contactCardWhatsappLinkId || "",
    phone: profile?.contactCardPhone || "",
  };
}

function normalizeBillingProfile(profile) {
  const department = resolveDepartmentName(profile?.billingProfile?.department || "");

  return {
    legalName: profile?.billingProfile?.legalName || "",
    documentType: profile?.billingProfile?.documentType || "nit",
    documentNumber: profile?.billingProfile?.documentNumber || "",
    verificationDigit: profile?.billingProfile?.verificationDigit || "",
    taxResponsibility: ["si", "no"].includes(profile?.billingProfile?.taxResponsibility) ? profile.billingProfile.taxResponsibility : "",
    billingEmail: profile?.billingProfile?.billingEmail || "",
    billingPhone: profile?.billingProfile?.billingPhone || "",
    address: profile?.billingProfile?.address || "",
    city: resolveCityName(department, profile?.billingProfile?.city || ""),
    department,
    country: profile?.billingProfile?.country || "Colombia",
  };
}

const BILLING_DOCUMENT_OPTIONS = [
  { value: "nit", label: "NIT" },
  { value: "cc", label: "Cédula de ciudadanía" },
  { value: "ce", label: "Cédula de extranjería" },
  { value: "passport", label: "Pasaporte" },
  { value: "other", label: "Otro" },
];

const BILLING_RESPONSIBILITY_OPTIONS = [
  { value: "si", label: "S\u00ed" },
  { value: "no", label: "No" },
];

const DASHBOARD_NAV_ITEMS = [
  { id: "blocks", label: "Enlaces", icon: Link2 },
  { id: "commerce", label: "Comercio", icon: ShoppingBag },
  { id: "booking", label: "Agenda", icon: CalendarDays },
  { id: "reservations", label: "Reservas", icon: CalendarCheck },
  { id: "design", label: "Diseño", icon: Paintbrush },
  { id: "dorika", label: "Dorika", icon: MapPinned },
  { id: "profile", label: "Perfil", icon: UserRound },
  { id: "security", label: "Seguridad", icon: ShieldCheck },
  { id: "billing", label: "Facturación", icon: FileText },
  { id: "subscription", label: "Suscripción", icon: CreditCard },
];

function ColorEditor({ label, value, onChange, swatches }) {
  return (
    <div className="appearance-control">
      <div className="color-card-top">
        <div>
          <label className="label">{label}</label>
          <strong>{value}</strong>
        </div>
        <label className="color-chip" style={{ "--swatch": value }}>
          <input type="color" value={value} onChange={(event) => onChange(event.target.value)} />
          <span />
        </label>
      </div>
      <div className="color-swatches">
        {swatches.map((swatch) => (
          <button
            key={`${label}-${swatch}`}
            className="swatch-button"
            style={{ "--swatch": swatch }}
            type="button"
            onClick={() => onChange(swatch)}
          />
        ))}
      </div>
    </div>
  );
}

function SegmentedControl({ label, value, options, onChange }) {
  return (
    <div className="appearance-control">
      <label className="label">{label}</label>
      <div className="segmented-control">
        {options.map((option) => (
          <button
            key={option.value}
            className={`segmented-button ${value === option.value ? "is-active" : ""}`}
            type="button"
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function FontPicker({ value, options, onChange }) {
  return (
    <div className="appearance-control">
      <label className="label">Familia tipográfica</label>
      <div className="font-picker-grid">
        {options.map((option) => (
          <button
            key={option.value}
            className={`font-picker-button ${value === option.value ? "is-active" : ""}`}
            type="button"
            onClick={() => onChange(option.value)}
            style={{ fontFamily: FONT_FAMILY_STYLE_MAP[option.value] || FONT_FAMILY_STYLE_MAP.inter }}
          >
            <span className="font-picker-name">{option.label}</span>
            <small>Aa Bb Cc 123</small>
          </button>
        ))}
      </div>
    </div>
  );
}

function AccordionSection({ id, title, copy, openSection, onToggle, children, trailing, className = "", contentClassName = "" }) {
  const isOpen = openSection === id;

  return (
    <section id={`dashboard-section-${id}`} className={`dashboard-section panel accordion-section ${isOpen ? "is-open" : ""} ${className}`.trim()}>
      <button className="accordion-toggle" type="button" onClick={() => onToggle(id)} aria-expanded={isOpen}>
        <span className="accordion-toggle-copy">
          <strong className="section-title">{title}</strong>
          <span className="section-copy">{copy}</span>
        </span>
        <span className="accordion-toggle-meta">
          {trailing}
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>
      {isOpen ? <div className={`accordion-content ${contentClassName}`.trim()}>{children}</div> : null}
    </section>
  );
}

const PRIORITY_OPTIONS = [
  { value: 1, label: "Prioridad 1" },
  { value: 2, label: "Prioridad 2" },
  { value: 3, label: "Prioridad 3" },
];

const CHECKOUT_PLAN_OPTIONS = [
  { value: "basic", label: "Básico" },
  { value: "commercial", label: "Comercial" },
  { value: "plus", label: "Plus" },
];

const CHECKOUT_MODULE_OPTIONS = [
  { value: "commerce", label: "Comercio" },
  { value: "booking", label: "Agenda" },
];

const CHECKOUT_PLAN_RANK = {
  basic: 1,
  commercial: 2,
  plus: 3,
};

function getPlanPriceFromSettings(plan, settings = {}) {
  if (plan === "basic") return Number(settings?.basicAnnualPrice || 59900);
  if (plan === "plus") return Number(settings?.plusAnnualPrice || 169900);
  return Number(settings?.commercialAnnualPrice ?? settings?.annualPrice ?? 109900);
}

function isLowerCheckoutPlan(currentPlan = "", nextPlan = "") {
  const currentRank = CHECKOUT_PLAN_RANK[currentPlan] || 0;
  const nextRank = CHECKOUT_PLAN_RANK[nextPlan] || 0;
  return Boolean(currentRank && nextRank && nextRank < currentRank);
}

function getDefaultCheckoutModule(profile = {}) {
  if (profile?.commercialModule === "booking") return "booking";
  if (profile?.commercialModule === "commerce") return "commerce";
  return resolveUserModuleAccess(profile).commerce ? "commerce" : "booking";
}

function getModuleLabel(module = "") {
  return module === "booking" ? "Agenda" : "Comercio";
}

function getOppositeModule(module = "") {
  return module === "commerce" ? "booking" : "commerce";
}

function canConfigureActionPriority(type) {
  return type !== "payment_key" && !isSocialLinkType(type);
}

function getSubscriptionTone(status) {
  if (status === "active" || status === "trial") return "success";
  if (status === "grace_period") return "warning";
  if (status === "suspended") return "danger";
  return "";
}

function getSubscriptionLabel(status) {
  if (status === "trial") return "Período de prueba";
  if (status === "active") return "Activa";
  if (status === "grace_period") return "Vencida con plazo";
  if (status === "suspended") return "Suspendida";
  return "Sin definir";
}

function getSubscriptionMessage(status) {
  if (status === "trial") return "Tu cuenta sigue activa y puedes editar mientras termina el período de prueba.";
  if (status === "active") return "Tu cuenta está operativa y lista para seguir compartiendo y cobrando.";
  if (status === "grace_period") return "Tu cuenta requiere renovación para no perder edición durante el plazo de gracia.";
  if (status === "suspended") return "Tu cuenta necesita registrar el pago para volver a operar con normalidad.";
  return "Revisa el estado de tu cuenta para mantener la operación del perfil.";
}

export function ProfileForm({
  token,
  profile,
  onSaved,
  canEdit,
  isAdmin = false,
  subscriptionSettings,
  userEmailVerified,
  paying,
  checkoutConfig,
  recovery,
  recoveryLoading,
  recoveryMessage,
  onRecoveryFieldChange,
  onSaveRecovery,
  onResendRecoveryVerification,
  onCheckout,
  onAgencyRequest,
  onAgencyRevoke,
  publicUrl,
  onCopyPublicUrl,
  onDownloadQr,
  onLogout,
  agencyMode = false,
  agencyTargetUid = "",
  agencyPermissions = {},
}) {
  const [form, setForm] = useState({
    businessName: profile?.businessName || "",
    username: profile?.username || "",
    businessCategory: normalizeBusinessCategory(profile?.businessCategory),
    businessType: profile?.businessType || profile?.dorikaProfile?.businessType || "",
    businessHeadline: profile?.businessHeadline || "",
    businessSubheadline: profile?.businessSubheadline || "",
  });
  const [profileLinks, setProfileLinks] = useState(normalizeLinks(profile));
  const [appearance, setAppearance] = useState(normalizeAppearance(profile?.settings || APPEARANCE_DEFAULTS));
  const [customThemes, setCustomThemes] = useState(normalizeCustomThemes(profile?.customThemes));
  const [themeDraftName, setThemeDraftName] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [paymentMethods, setPaymentMethods] = useState(
    normalizePaymentMethods(profile?.paymentMethods, profile?.profileLinks, profile?.paymentQrUrl, profile?.paymentQrPath),
  );
  const [contactCard, setContactCard] = useState(normalizeContactCard(profile));
  const [billingProfile, setBillingProfile] = useState(normalizeBillingProfile(profile));
  const [businessHours, setBusinessHours] = useState(normalizeBusinessHours(profile?.businessHours));
  const [dorikaProfile, setDorikaProfile] = useState(normalizeDorikaProfile(profile?.dorikaProfile, profile));
  const [dorikaCover, setDorikaCover] = useState(null);
  const [dorikaCoverPreviewUrl, setDorikaCoverPreviewUrl] = useState("");
  const [dorikaCoverLoadError, setDorikaCoverLoadError] = useState(false);
  const [dorikaLocationLoading, setDorikaLocationLoading] = useState(false);
  const [dorikaLocationMessage, setDorikaLocationMessage] = useState("");
  const [dorikaMapOpen, setDorikaMapOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [selectedLinkValue, setSelectedLinkValue] = useState("");
  const [checkoutPlan, setCheckoutPlan] = useState(() => profile?.plan === "plus" ? "plus" : "commercial");
  const [checkoutModule, setCheckoutModule] = useState(() => getDefaultCheckoutModule(profile));
  const [moduleBusy, setModuleBusy] = useState("");
  const [activeWorkspace, setActiveWorkspace] = useState(() => (agencyMode && !canEdit ? "subscription" : getPrimaryWorkspaceForBusinessCategory(profile?.businessCategory)));
  const navCollapsed = true;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [openProfileSection, setOpenProfileSection] = useState("profile-identity");
  const [openDesignSection, setOpenDesignSection] = useState("design-themes");
  const [showAgencyLinkedPopup, setShowAgencyLinkedPopup] = useState(false);
  useEffect(() => {
    setForm({
      businessName: profile?.businessName || "",
      username: profile?.username || "",
      businessCategory: normalizeBusinessCategory(profile?.businessCategory),
      businessType: profile?.businessType || profile?.dorikaProfile?.businessType || "",
      businessHeadline: profile?.businessHeadline || "",
      businessSubheadline: profile?.businessSubheadline || "",
    });
    setProfileLinks(normalizeLinks(profile));
    setAppearance(normalizeAppearance(profile?.settings || APPEARANCE_DEFAULTS));
    setCustomThemes(normalizeCustomThemes(profile?.customThemes));
    setThemeDraftName("");
    setPhoto(null);
    setPaymentMethods(normalizePaymentMethods(profile?.paymentMethods, profile?.profileLinks, profile?.paymentQrUrl, profile?.paymentQrPath));
    setContactCard(normalizeContactCard(profile));
    setBillingProfile(normalizeBillingProfile(profile));
    setBusinessHours(normalizeBusinessHours(profile?.businessHours));
    setDorikaProfile(normalizeDorikaProfile(profile?.dorikaProfile, profile));
    setDorikaCover(null);
    setDorikaCoverLoadError(false);
    setDorikaLocationLoading(false);
    setDorikaLocationMessage("");
    setDorikaMapOpen(false);
    setSelectedType("");
    setSelectedLinkValue("");
    setCheckoutPlan(profile?.plan === "plus" ? "plus" : "commercial");
    setCheckoutModule(getDefaultCheckoutModule(profile));
    setModuleBusy("");
    setAlertMessage("");
  }, [profile]);

  useEffect(() => {
    if (!photo) {
      setPhotoPreviewUrl("");
      return;
    }

    const nextUrl = URL.createObjectURL(photo);
    setPhotoPreviewUrl(nextUrl);

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [photo]);

  useEffect(() => {
    if (!dorikaCover) {
      setDorikaCoverPreviewUrl("");
      return;
    }

    const nextUrl = URL.createObjectURL(dorikaCover);
    setDorikaCoverLoadError(false);
    setDorikaCoverPreviewUrl(nextUrl);

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [dorikaCover]);

  useEffect(() => {
    let cancelled = false;

    async function syncGeneratedTheme() {
      if (!photo) {
        setCustomThemes((current) => current.map((theme) => (
          theme.id === "generated-logo-theme"
            ? { ...theme, name: form.businessName ? `Tema ${form.businessName}` : "Tema de tu negocio" }
            : theme
        )));
        return;
      }

      try {
        const generatedTheme = await generateThemeFromLogoFile(photo, form.businessName);
        if (!generatedTheme || cancelled) return;
        setCustomThemes((current) => mergeGeneratedTheme(current, generatedTheme, form.businessName));
      } catch {
        // Keep existing custom themes even if the logo cannot be analyzed.
      }
    }

    syncGeneratedTheme();

    return () => {
      cancelled = true;
    };
  }, [photo, form.businessName]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    setDarkModeEnabled(document.documentElement.dataset.theme === "dark");
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [activeWorkspace]);

  const moduleRecommendation = useMemo(
    () => getBusinessCategoryModuleRecommendation(form.businessCategory),
    [form.businessCategory],
  );
  const savedModuleAccess = useMemo(() => resolveUserModuleAccess(profile), [profile]);
  const moduleAccess = useMemo(() => {
    if (profile?.moduleAccess) return savedModuleAccess;
    return resolveUserModuleAccess({ ...profile, businessCategory: form.businessCategory, businessType: form.businessType });
  }, [form.businessCategory, form.businessType, profile, savedModuleAccess]);
  const dorikaEligible = useMemo(
    () => isDorikaEligibleBusiness({ ...profile, city: billingProfile.city, billingProfile }),
    [billingProfile, profile],
  );

  const dashboardNavItems = useMemo(() => {
    const recommendedIds = getRecommendedWorkspaceIdsForBusinessCategory(form.businessCategory);
    const visibleIds = new Set(getVisibleWorkspaceIdsForBusinessCategory(form.businessCategory));
    if (moduleAccess.commerce && isBusinessModuleEligible({ businessCategory: form.businessCategory, businessType: form.businessType }, "commerce")) visibleIds.add("commerce");
    if (moduleAccess.booking && isBusinessModuleEligible({ businessCategory: form.businessCategory, businessType: form.businessType }, "booking")) visibleIds.add("booking");
    const priorityMap = new Map(recommendedIds.map((id, index) => [id, index]));

    const agencyAllowedIds = new Set([
      agencyPermissions.links ? "blocks" : "",
      agencyPermissions.commerce ? "commerce" : "",
      agencyPermissions.booking ? "booking" : "",
      agencyPermissions.design ? "design" : "",
      agencyPermissions.publicProfile ? "profile" : "",
      agencyPermissions.subscriptionRenewal ? "subscription" : "",
      agencyPermissions.dorika ? "dorika" : "",
    ].filter(Boolean));

    return [...DASHBOARD_NAV_ITEMS]
      .filter((item) => visibleIds.has(item.id))
      .filter((item) => !agencyMode || agencyAllowedIds.has(item.id))
      .filter((item) => !agencyMode || canEdit || item.id === "subscription")
      .filter((item) => !agencyMode || !["security", "billing", "reservations"].includes(item.id))
      .filter((item) => item.id !== "commerce" || canUseModule({ ...profile, moduleAccess, businessCategory: form.businessCategory, businessType: form.businessType }, "commerce"))
      .filter((item) => item.id !== "booking" || canUseModule({ ...profile, moduleAccess, businessCategory: form.businessCategory, businessType: form.businessType }, "booking"))
      .filter((item) => item.id !== "dorika" || dorikaEligible)
      .sort((left, right) => {
        const leftPriority = priorityMap.has(left.id) ? priorityMap.get(left.id) : 999;
        const rightPriority = priorityMap.has(right.id) ? priorityMap.get(right.id) : 999;
        if (leftPriority !== rightPriority) return leftPriority - rightPriority;
        return DASHBOARD_NAV_ITEMS.findIndex((item) => item.id === left.id)
          - DASHBOARD_NAV_ITEMS.findIndex((item) => item.id === right.id);
      })
      .map((item) => {
        const isRecommended = priorityMap.has(item.id);
        const recommendationRank = priorityMap.get(item.id);
        return {
          ...item,
          isRecommended,
          recommendationLabel: isRecommended && recommendationRank === 0 ? moduleRecommendation.moduleLabel : "Sugerido",
        };
      });
  }, [agencyMode, agencyPermissions.booking, agencyPermissions.commerce, agencyPermissions.design, agencyPermissions.dorika, agencyPermissions.links, agencyPermissions.publicProfile, agencyPermissions.subscriptionRenewal, canEdit, dorikaEligible, form.businessCategory, form.businessType, moduleAccess, moduleRecommendation, profile]);

  useEffect(() => {
    if (!agencyMode || canEdit || activeWorkspace === "subscription") return;
    setActiveWorkspace("subscription");
  }, [activeWorkspace, agencyMode, canEdit]);

  useEffect(() => {
    const workspaceIsVisible = dashboardNavItems.some((item) => item.id === activeWorkspace);
    if (!workspaceIsVisible) {
      setActiveWorkspace(dashboardNavItems[0]?.id || "blocks");
    }
  }, [activeWorkspace, dashboardNavItems]);

  useEffect(() => {
    const workspaceSectionMap = {
      profile: "profile-identity",
      security: "profile-security",
      billing: "profile-billing",
      subscription: "profile-subscription",
    };

    const nextSection = workspaceSectionMap[activeWorkspace];
    if (nextSection) {
      setOpenProfileSection(nextSection);
    }
  }, [activeWorkspace]);

  const previewUser = useMemo(() => ({
    publicLinkId: profile?.publicLinkId || "",
    businessName: form.businessName || "Tu negocio",
    username: form.username || "tu-usuario",
    usernameLower: profile?.usernameLower || form.username || "tu-usuario",
    status: profile?.status,
    plan: profile?.plan,
    commercialModule: profile?.commercialModule || "",
    moduleAccess,
    businessCategory: form.businessCategory,
    businessType: form.businessType,
    businessHeadline: form.businessHeadline,
    businessSubheadline: form.businessSubheadline,
    commerce: profile?.commerce,
    bookingConfig: profile?.bookingConfig,
    photo: photoPreviewUrl || profile?.photo || "",
    photoThumb: photoPreviewUrl || profile?.photoThumb || profile?.photo || "",
    paymentMethods: paymentMethods.map((method) => ({
      ...method,
      qrImageUrl: method.removeQr ? "" : method.qrPreviewUrl || method.qrImageUrl || "",
      qrPath: method.removeQr ? "" : method.qrPath || "",
    })),
    contactCardEnabled: contactCard.enabled,
    contactCardName: contactCard.name,
    contactCardTitle: contactCard.title,
    contactCardWhatsappLinkId: contactCard.whatsappLinkId,
    contactCardPhone: contactCard.phone,
    settings: appearance,
    profileLinks: profileLinks
      .filter((item) => item.value?.trim())
      .map((item) => ({
        ...item,
        url: normalizeLinkUrl(item),
      })),
  }), [appearance, contactCard.enabled, contactCard.name, contactCard.phone, contactCard.title, contactCard.whatsappLinkId, form.businessCategory, form.businessHeadline, form.businessName, form.businessSubheadline, form.businessType, form.username, moduleAccess, paymentMethods, photoPreviewUrl, profile?.bookingConfig, profile?.commerce, profile?.commercialModule, profile?.photo, profile?.photoThumb, profile?.plan, profile?.publicLinkId, profile?.status, profile?.usernameLower, profileLinks]);

  const previewPublicUrl = useMemo(() => {
    if (publicUrl) return publicUrl;
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://klicor.com").replace(/\/$/, "");
    return form.username ? `${baseUrl}/${form.username}` : baseUrl;
  }, [form.username, publicUrl]);

  const appearanceWarnings = useMemo(() => getAppearanceWarnings(appearance), [appearance]);
  const appearanceSuggestions = useMemo(() => getAppearanceSuggestions(appearance), [appearance]);
  const availableThemes = useMemo(() => {
    const usedIds = new Set();
    return [...customThemes, ...APPEARANCE_PRESETS].filter((theme) => {
      const themeId = String(theme?.id || "");
      if (!themeId || usedIds.has(themeId)) return false;
      usedIds.add(themeId);
      return true;
    });
  }, [customThemes]);
  const availableLinkTypes = useMemo(() => LINK_CATALOG.filter((item) => item.type !== "payment_key"), []);
  const selectedTypeCount = selectedType ? getLinkTypeCount(profileLinks, selectedType) : 0;
  const selectedLinkMeta = selectedType ? LINK_CATALOG_MAP[selectedType] : null;
  const whatsappLinks = useMemo(() => profileLinks.filter((item) => item.type === "whatsapp" && item.value?.trim()), [profileLinks]);
  const emailLink = useMemo(() => profileLinks.find((item) => item.type === "email" && item.value?.trim()), [profileLinks]);
  const websiteLink = useMemo(() => profileLinks.find((item) => item.type === "website" && item.value?.trim()), [profileLinks]);
  const contactCardPreview = useMemo(() => resolveContactCardData(previewUser), [previewUser]);
  const dorikaStoredCoverUrl = canDisplayPersistedImageUrl(dorikaProfile.coverImageUrl) ? cleanPersistentImageUrl(dorikaProfile.coverImageUrl) : "";
  const dorikaCoverVersion = resolveImageVersion(profile?.updatedAt) || dorikaProfile.coverImagePath || dorikaStoredCoverUrl;
  const dorikaCoverDisplayUrl = dorikaCoverPreviewUrl || (dorikaCoverLoadError ? "" : addImageVersion(dorikaStoredCoverUrl, dorikaCoverVersion));
  const dorikaProgress = useMemo(() => calculateDorikaProfileProgress({
    ...dorikaProfile,
    coverImageUrl: dorikaCoverDisplayUrl,
  }, {
    ...profile,
    businessCategory: form.businessCategory,
    city: billingProfile.city,
    billingProfile,
  }), [billingProfile, dorikaCoverDisplayUrl, dorikaProfile, form.businessCategory, profile]);
  const dorikaProgressPercent = Number.isFinite(dorikaProgress?.percent) ? dorikaProgress.percent : 0;
  const dorikaTasks = Array.isArray(dorikaProgress?.tasks) ? dorikaProgress.tasks : [];
  const dorikaCategoryLabel = BUSINESS_CATEGORY_OPTIONS.find((option) => option.value === form.businessCategory)?.label || "Tipo de negocio";
  const businessTypeOptions = useMemo(() => getBusinessTypeOptionsForCategory(form.businessCategory), [form.businessCategory]);
  const businessTypeLabel = businessTypeOptions.find((option) => option.value === form.businessType)?.label || "Sin definir";
  const dorikaHasExactCoordinates = Number.isFinite(dorikaProfile.latitude) && Number.isFinite(dorikaProfile.longitude);
  const showDorikaFeaturedProductsNote = ["food_drink", "retail_sales"].includes(form.businessCategory);

  useEffect(() => {
    setDorikaCoverLoadError(false);
  }, [dorikaStoredCoverUrl]);

  useEffect(() => {
    if (!form.businessType) return;
    if (businessTypeOptions.some((option) => option.value === form.businessType)) return;
    setForm((current) => ({ ...current, businessType: "" }));
  }, [businessTypeOptions, form.businessType]);

  useEffect(() => {
    if (!contactCard.whatsappLinkId) return;
    if (whatsappLinks.some((item) => item.id === contactCard.whatsappLinkId)) return;
    setContactCard((current) => ({ ...current, whatsappLinkId: "" }));
  }, [contactCard.whatsappLinkId, whatsappLinks]);

  function handleThemeToggle() {
    const nextMode = !darkModeEnabled;
    setDarkModeEnabled(nextMode);
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = nextMode ? "dark" : "light";
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextMode ? "dark" : "light");
    }
  }

  function updateDorikaField(field, value) {
    setDorikaProfile((current) => {
      const next = {
        ...current,
        [field]: value,
      };

      if (field === "locationPrivacy") {
        next.showLocation = value !== "contact_only";
      }

      if (field === "showLocation" && value === false) {
        next.locationPrivacy = "contact_only";
      }

      if (field === "showLocation" && value === true && next.locationPrivacy === "contact_only") {
        next.locationPrivacy = "exact";
      }

      return next;
    });
  }

  function scrollToDorikaTask(taskId = "") {
    const targetMap = {
      visibility: "dorika-visibility",
      location: "dorika-location",
      business_type: "dorika-appearance",
      cover: "dorika-appearance",
      description: "dorika-description",
    };
    const target = targetMap[taskId] || "dorika-visibility";
    const element = typeof document !== "undefined" ? document.getElementById(target) : null;
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "start" });
    if (target === "dorika-description") {
      window.setTimeout(() => {
        document.getElementById("dorika-description-input")?.focus();
      }, 280);
    }
  }

  function updateBusinessHoursField(field, value) {
    setBusinessHours((current) => normalizeBusinessHours({
      ...current,
      [field]: value,
    }));
  }

  function updateBusinessHourDay(dayKey, mapper) {
    setBusinessHours((current) => {
      const schedule = normalizeBusinessHours(current);
      return normalizeBusinessHours({
        ...schedule,
        days: schedule.days.map((day) => (
          day.day === dayKey ? mapper(day) : day
        )),
      });
    });
  }

  function updateBusinessHourDayOpen(dayKey, isOpen) {
    updateBusinessHourDay(dayKey, (day) => ({
      ...day,
      isOpen,
      shifts: day.shifts?.length ? day.shifts : createDefaultBusinessHourDay(dayKey).shifts,
    }));
  }

  function updateBusinessHourMode(dayKey, mode) {
    updateBusinessHourDay(dayKey, (day) => {
      const fallback = createDefaultBusinessHourDay(dayKey);
      if (mode === "continuous") {
        return {
          ...day,
          mode: "continuous",
          shifts: [day.shifts?.[0] || fallback.shifts[0] || { start: "08:00", end: "18:00" }],
        };
      }

      return {
        ...day,
        mode: "split",
        shifts: [
          day.shifts?.[0] || fallback.shifts[0] || { start: "08:00", end: "12:00" },
          day.shifts?.[1] || fallback.shifts[1] || { start: "14:00", end: "18:00" },
        ],
      };
    });
  }

  function updateBusinessHourShift(dayKey, shiftIndex, field, value) {
    updateBusinessHourDay(dayKey, (day) => ({
      ...day,
      shifts: day.shifts.map((shift, index) => (
        index === shiftIndex ? { ...shift, [field]: value } : shift
      )),
    }));
  }

  function captureDorikaLocation() {
    if (!canEdit) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setAlertMessage("Tu navegador no permite capturar la ubicación. Intenta desde un celular o navegador actualizado.");
      return;
    }

    setDorikaLocationLoading(true);
    setDorikaLocationMessage("");
    setAlertMessage("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = Math.round(position.coords.latitude * 10000000) / 10000000;
        const longitude = Math.round(position.coords.longitude * 10000000) / 10000000;
        const accuracy = Math.round(position.coords.accuracy || 0);
        setDorikaProfile((current) => ({
          ...current,
          latitude,
          longitude,
          locationAccuracyMeters: accuracy || null,
          mapLocationUpdatedAt: new Date().toISOString(),
          locationPrivacy: "exact",
          showLocation: true,
        }));
        setDorikaLocationMessage("Ubicación tomada desde este dispositivo. Si no cae en el local, ajusta el punto en el mapa.");
        setDorikaLocationLoading(false);
      },
      (error) => {
        const nextMessage = error?.code === 1
          ? "No pudimos acceder a tu ubicación. Activa el permiso del navegador e inténtalo de nuevo."
          : "No pudimos capturar la ubicación exacta. Intenta de nuevo estando en el local.";
        setAlertMessage(nextMessage);
        setDorikaLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
      },
    );
  }

  function saveDorikaMapLocation(point) {
    if (!canEdit) return;
    setDorikaProfile((current) => ({
      ...current,
      latitude: point.latitude,
      longitude: point.longitude,
      locationAccuracyMeters: point.locationAccuracyMeters || null,
      mapLocationUpdatedAt: new Date().toISOString(),
      locationPrivacy: "exact",
      showLocation: true,
    }));
    setDorikaLocationMessage("Punto del mapa guardado para Dorika.");
    setDorikaMapOpen(false);
  }

  function handleOpenPublicUrl() {
    if (!previewPublicUrl || typeof window === "undefined") return;
    window.open(previewPublicUrl, "_blank", "noopener,noreferrer");
  }

  async function saveProfile(overrides = {}) {
    const nextAppearance = overrides.appearance || appearance;
    const nextCustomThemes = overrides.customThemes || customThemes;
    const nextAppearanceWarnings = getAppearanceWarnings(nextAppearance);

    if (!canEdit) {
      setAlertMessage("Tu cuenta no permite edición en este momento.");
      return;
    }

    if (nextAppearanceWarnings.length) {
      setAlertMessage(nextAppearanceWarnings[0].message);
      return;
    }

    const nextCategory = form.businessCategory;
    const profileCategoryChanged = nextCategory !== normalizeBusinessCategory(profile?.businessCategory);
    const profileTypeChanged = form.businessType !== (profile?.businessType || profile?.dorikaProfile?.businessType || "");
    const currentCommerceMode = normalizeCommerceMode(profile?.commerce?.activeMode || profile?.commerceMode);
    const nextCommerceMode = resolveDefaultCommerceModeForBusinessCategory(nextCategory);
    const commerceModeWillChange = profileCategoryChanged
      && moduleAccess.commerce
      && currentCommerceMode
      && nextCommerceMode
      && currentCommerceMode !== nextCommerceMode;
    if ((profileCategoryChanged || profileTypeChanged) && shouldRestrictToPrimaryModuleOnProfileChange(profile)) {
      const nextPrimaryModule = resolvePrimaryModuleForBusinessCategory(nextCategory, form.businessType);
      const previousModule = nextPrimaryModule ? getOppositeModule(nextPrimaryModule) : "booking";
      const previousModuleWasActive = savedModuleAccess[previousModule];
      const nextModuleLabel = nextPrimaryModule ? getModuleLabel(nextPrimaryModule) : "solo link in bio";
      if (previousModuleWasActive && !window.confirm(`Al cambiar el perfil, Klicor cambiará tu módulo principal a ${nextModuleLabel}. Lo que hiciste en ${getModuleLabel(previousModule)} no se pierde, pero su enlace público dejará de funcionar. Para mantener ambos módulos activos necesitas el plan Plus y una categoría compatible. ¿Quieres continuar?`)) {
        return;
      }
    }
    if (commerceModeWillChange) {
      const currentModeLabel = resolveCommerceModeMeta(currentCommerceMode).label;
      const nextModeLabel = resolveCommerceModeMeta(nextCommerceMode).label;
      if (!window.confirm(`Al cambiar el perfil, Klicor cambiará la presentación de comercio de ${currentModeLabel} a ${nextModeLabel}. Tus categorías y productos no se pierden; solo cambia el tema, el enlace y la forma de mostrarlo. ¿Quieres continuar?`)) {
        return;
      }
    }

    setLoading(true);
    setMessage("");
    setAlertMessage("");
    try {
      const body = new FormData();
      body.append("businessName", form.businessName);
      body.append("username", form.username);
      body.append("businessCategory", form.businessCategory);
      body.append("businessType", form.businessType);
      body.append("businessHeadline", form.businessHeadline);
      body.append("businessSubheadline", form.businessSubheadline);
      body.append("profileLinks", JSON.stringify(profileLinks.filter((item) => !isSystemProfileLink(item) && String(item.value || "").trim())));
      body.append("paymentMethods", JSON.stringify(paymentMethods.map(({ qrFile, qrPreviewUrl, removeQr, ...method }) => ({
        ...method,
        qrImageUrl: removeQr ? "" : method.qrImageUrl || "",
        qrPath: removeQr ? "" : method.qrPath || "",
      }))));
      body.append("appearance", JSON.stringify(nextAppearance));
      body.append("customThemes", JSON.stringify(nextCustomThemes));
      body.append("contactCard", JSON.stringify(contactCard));
      body.append("billingProfile", JSON.stringify(billingProfile));
      body.append("businessHours", JSON.stringify(businessHours));
      body.append("dorikaProfile", JSON.stringify({
        ...dorikaProfile,
        enabled: dorikaEligible ? dorikaProfile.enabled : false,
        category: form.businessCategory,
        businessType: form.businessType,
        coverImageUrl: dorikaStoredCoverUrl,
      }));
      body.append("removePaymentQrIds", JSON.stringify(paymentMethods.filter((method) => method.removeQr).map((method) => method.id)));
      if (photo) body.append("photo", photo);
      if (dorikaCover) body.append("dorikaCover", dorikaCover);
      if (agencyMode && agencyTargetUid) body.append("targetUid", agencyTargetUid);
      paymentMethods.forEach((method) => {
        if (method.qrFile) {
          body.append(`paymentQrImage:${method.id}`, method.qrFile);
        }
      });

      const data = await apiFetch("/api/profile", {
        method: "POST",
        token,
        body,
        isFormData: true,
      });

      onSaved(data.user);
      setMessage("Cambios guardados correctamente.");
      return true;
    } catch (error) {
      setAlertMessage(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await saveProfile();
  }

  function toggleProfileSection(sectionId) {
    setOpenProfileSection((current) => (current === sectionId ? null : sectionId));
  }

  function toggleDesignSection(sectionId) {
    setOpenDesignSection((current) => (current === sectionId ? null : sectionId));
  }

  function addLink() {
    const meta = LINK_CATALOG_MAP[selectedType];
    if (!meta) {
      setAlertMessage("Selecciona el botón que quieres agregar.");
      return;
    }

    const cleanValue = selectedLinkValue.trim();
    if (!cleanValue) {
      setAlertMessage("Escribe el enlace o dato de contacto antes de agregar el botón.");
      return;
    }

    setProfileLinks((current) => applyDefaultLinkPriorityTiers([
      ...current,
      {
        id: `${selectedType}-${Date.now()}`,
        type: selectedType,
        label: meta.label,
        value: cleanValue,
        priorityTier: getDefaultPriorityTierForNewLink(current, selectedType, form.businessCategory),
        message: selectedType === "whatsapp" ? "Hola, quiero información" : "",
      },
    ], form.businessCategory));
    setSelectedType("");
    setSelectedLinkValue("");
    setAlertMessage("");
  }

  function updateLink(id, field, value) {
    setProfileLinks((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, [field]: value };
        if (next.type !== "whatsapp") next.message = "";
        return next;
      }),
    );
  }

  function removeLink(id) {
    setProfileLinks((current) => current.filter((item) => item.id !== id));
  }

  function updateLinkPriority(id, nextTier) {
    const tier = Number(nextTier);

    setProfileLinks((current) => {
      const currentItem = current.find((item) => item.id === id);
      if (!currentItem || !canConfigureActionPriority(currentItem.type)) return current;

      return current.map((item) => (item.id === id ? { ...item, priorityTier: tier } : item));
    });
  }

  function addPaymentMethod() {
    setPaymentMethods((current) => {
      return [
        ...current,
        {
          id: `payment-method-${Date.now()}`,
          entityId: "",
          accountType: "",
          accountNumber: "",
          brebKey: "",
        },
      ];
    });
  }

  function updatePaymentMethod(id, field, value) {
    setPaymentMethods((current) => current.map((method) => {
      if (method.id !== id) return method;
      const next = { ...method, [field]: value };
      if (field === "entityId") {
        if (!requiresAccountType(value)) {
          next.accountType = "";
        }

        const currentValue = String(method.accountNumber || method.brebKey || "").trim();
        if (usesBrebKeyField(value)) {
          next.accountNumber = "";
          next.brebKey = currentValue;
        } else {
          next.accountNumber = currentValue;
          next.brebKey = "";
        }
      }
      return next;
    }));
  }

  function updatePaymentMethodValue(id, value) {
    setPaymentMethods((current) => current.map((method) => {
      if (method.id !== id) return method;
      if (usesBrebKeyField(method.entityId)) {
        return {
          ...method,
          accountNumber: "",
          brebKey: value,
        };
      }

      return {
        ...method,
        accountNumber: value,
        brebKey: "",
      };
    }));
  }

  function removePaymentMethod(id) {
    setPaymentMethods((current) => {
      const target = current.find((method) => method.id === id);
      if (target?.qrPreviewUrl?.startsWith?.("blob:")) {
        URL.revokeObjectURL(target.qrPreviewUrl);
      }
      return current.filter((method) => method.id !== id);
    });
  }

  function updatePaymentMethodQr(id, file) {
    if (!file) return;

    setPaymentMethods((current) => current.map((method) => {
      if (method.id !== id) return method;
      if (method.qrPreviewUrl?.startsWith?.("blob:")) {
        URL.revokeObjectURL(method.qrPreviewUrl);
      }
      return {
        ...method,
        qrFile: file,
        qrPreviewUrl: URL.createObjectURL(file),
        removeQr: false,
      };
    }));
  }

  function removePaymentMethodQr(id) {
    setPaymentMethods((current) => current.map((method) => {
      if (method.id !== id) return method;
      if (method.qrPreviewUrl?.startsWith?.("blob:")) {
        URL.revokeObjectURL(method.qrPreviewUrl);
      }
      return {
        ...method,
        qrFile: null,
        qrPreviewUrl: "",
        qrImageUrl: "",
        qrPath: "",
        removeQr: true,
      };
    }));
  }

  function applyPreset(presetId) {
    const preset = [...customThemes, ...APPEARANCE_PRESETS].find((item) => item.id === presetId);
    if (!preset) return;
    setAppearance(normalizeAppearance({
      presetId: preset.id,
      advancedEnabled: false,
      ...preset.appearance,
    }));
    setThemeDraftName("");
  }

  function updateAppearance(field, value) {
    setAppearance((current) => normalizeAppearance({
      ...current,
      advancedEnabled: true,
      [field]: value,
    }));
  }

  function resetAppearance() {
    const targetPreset = [...customThemes, ...APPEARANCE_PRESETS].find((item) => item.id === appearance.presetId) || APPEARANCE_PRESETS[0];
    setAppearance(normalizeAppearance({
      presetId: targetPreset.id,
      advancedEnabled: false,
      ...targetPreset.appearance,
    }));
    setThemeDraftName("");
  }

  async function saveCurrentTheme() {
    if (appearanceWarnings.length) {
      setAlertMessage(appearanceWarnings[0].message);
      return;
    }

    const name = themeDraftName.trim();
    if (!name) {
      setAlertMessage("Ponle un nombre al tema antes de crearlo.");
      return;
    }

    const themeId = `custom-theme-${Date.now()}`;
    const themeAppearance = normalizeAppearance({
      ...appearance,
      presetId: themeId,
      advancedEnabled: false,
    });
    const nextTheme = {
      id: themeId,
      name,
      appearance: themeAppearance,
    };
    const nextCustomThemes = [nextTheme, ...customThemes].slice(0, 6);

    setCustomThemes(nextCustomThemes);
    setAppearance(themeAppearance);
    setThemeDraftName("");
    const saved = await saveProfile({ appearance: themeAppearance, customThemes: nextCustomThemes });
    if (saved) {
      setMessage("Tema guardado. Ya puedes volver a usarlo cuando quieras.");
    }
  }

  const selectedPhotoLabel = photo ? photo.name : profile?.photo ? "Imagen actual cargada" : "Aún no has elegido imagen";
  const usernameChanged = Boolean(profile?.username) && form.username.trim() && form.username.trim() !== profile.username;
  const recoveryProtected = Boolean(recovery?.backupEmailVerified);
  const contactCardEnabled = Boolean(contactCard.enabled);
  const billingProfileConfigured = Boolean(billingProfile.legalName && billingProfile.documentType && billingProfile.documentNumber);
  const billingProfileStarted = [
    billingProfile.legalName,
    billingProfile.documentNumber,
    billingProfile.verificationDigit,
    billingProfile.taxResponsibility,
    billingProfile.billingEmail,
    billingProfile.billingPhone,
    billingProfile.address,
    billingProfile.city,
    billingProfile.department,
  ].some((value) => String(value || "").trim());
  const billingDocumentTypeLabel = BILLING_DOCUMENT_OPTIONS.find((item) => item.value === billingProfile.documentType)?.label || "Documento";
  const billingCityOptions = useMemo(() => getCitiesForDepartment(billingProfile.department), [billingProfile.department]);
  const businessHoursStatus = useMemo(() => getBusinessOpenStatus(businessHours), [businessHours]);
  const businessHoursConfigured = Boolean(businessHours.enabled);
  const subscriptionTone = getSubscriptionTone(profile?.status);
  const subscriptionLabel = getSubscriptionLabel(profile?.status);
  const subscriptionMessage = getSubscriptionMessage(profile?.status);
  const currentPlan = profile?.plan || "trial";
  const hasActivePaidPlan = profile?.status === "active" && Boolean(CHECKOUT_PLAN_RANK[currentPlan]);
  const enabledModules = [
    moduleAccess.commerce && isBusinessModuleEligible({ businessCategory: form.businessCategory, businessType: form.businessType }, "commerce") ? "Comercio" : "",
    moduleAccess.booking && isBusinessModuleEligible({ businessCategory: form.businessCategory, businessType: form.businessType }, "booking") ? "Agenda" : "",
  ].filter(Boolean);
  const missingModules = ["commerce", "booking"].filter((module) => (
    !moduleAccess[module]
    && isBusinessModuleEligible({ businessCategory: form.businessCategory, businessType: form.businessType }, module)
  ));
  const canEnableExtraModule = ["trial", "plus", "pro", "agency", "courtesy"].includes(currentPlan) && ["trial", "active"].includes(profile?.status);
  const checkoutPlanPrice = getPlanPriceFromSettings(checkoutPlan, subscriptionSettings);
  const annualPriceLabel = Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(checkoutPlanPrice);
  const subscriptionActionLabel = paying
    ? "Abriendo pago..."
    : profile?.status === "active"
      ? "Renovar plan"
      : "Activar plan";
  const dashboardLogoSrc = photoPreviewUrl || profile?.photoThumb || profile?.photo || "/klicor-icon.png";
  const dashboardBusinessName = form.businessName?.trim() || profile?.businessName || "Tu negocio";
  const topbarStatusLabel =
    profile?.status === "trial"
      ? "Período de prueba"
      : profile?.status === "active"
        ? "Activo"
      : subscriptionLabel;
  const agencyRequests = Array.isArray(profile?.agencyRequests) ? profile.agencyRequests : [];
  const activeAgency = profile?.agencyAccess?.status === "active" ? profile.agencyAccess : null;

  useEffect(() => {
    if (!activeAgency || agencyMode) {
      setShowAgencyLinkedPopup(false);
      return undefined;
    }
    setShowAgencyLinkedPopup(true);
    const timeout = window.setTimeout(() => setShowAgencyLinkedPopup(false), 4200);
    return () => window.clearTimeout(timeout);
  }, [activeAgency, agencyMode]);

  function handleWorkspaceSelect(workspaceId) {
    setActiveWorkspace(workspaceId);
    setMobileNavOpen(false);
  }

  async function enableModule(module) {
    setModuleBusy(module);
    setMessage("");
    setAlertMessage("");
    try {
      const data = await apiFetch("/api/modules", {
        method: "POST",
        token,
        body: { module, ...(agencyMode && agencyTargetUid ? { targetUid: agencyTargetUid } : {}) },
      });
      onSaved(data.user);
      setMessage(`${getModuleLabel(module)} quedó habilitado en tu cuenta.`);
    } catch (error) {
      setAlertMessage(error.message);
    } finally {
      setModuleBusy("");
    }
  }

  return (
    <div className={`editor-layout ${navCollapsed ? "is-nav-collapsed" : ""} ${activeWorkspace === "commerce" ? "is-commerce-workspace" : ""} ${activeWorkspace === "booking" ? "is-booking-workspace" : ""} ${activeWorkspace === "reservations" ? "is-reservations-workspace" : ""}`.trim()}>
      {mobileNavOpen ? (
        <button
          className="editor-sidebar-backdrop"
          type="button"
          aria-label="Cerrar menú lateral"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}
      {alertMessage ? (
        <div className="dashboard-alert-backdrop" role="alertdialog" aria-modal="true" aria-label="Alerta del editor">
          <div className="dashboard-alert-card">
            <div className="dashboard-alert-icon">
              <AlertTriangle size={20} />
            </div>
            <div className="dashboard-alert-copy">
              <strong>Revisa este dato</strong>
              <p>{alertMessage}</p>
            </div>
            <button className="btn btn-primary" type="button" onClick={() => setAlertMessage("")}>
              Entendido
            </button>
          </div>
        </div>
      ) : null}
      {showAgencyLinkedPopup ? (
        <div className="agency-linked-toast" role="status" aria-live="polite">
          <strong>Agencia vinculada</strong>
          <span>{activeAgency?.agencyName || activeAgency?.agencyEmail} ya puede ayudarte a configurar tu Klicor.</span>
        </div>
      ) : null}
      {agencyRequests.length ? (
        <section className="agency-owner-notice">
          <div>
            <strong>Solicitud de agencia</strong>
            <span>{agencyRequests[0].agencyName || agencyRequests[0].agencyEmail} quiere ayudarte a configurar tu Klicor.</span>
            <small>Klicor facilita el acceso técnico. Al aceptar, el dueño del negocio asume responsabilidad sobre el acceso concedido. La agencia no podrá ver seguridad, facturación privada ni datos de clientes de citas.</small>
          </div>
          <div className="agency-owner-actions">
            <button className="btn btn-primary" type="button" onClick={() => onAgencyRequest?.(agencyRequests[0].id, "accept")}>
              Aceptar
            </button>
            <button className="btn btn-secondary" type="button" onClick={() => onAgencyRequest?.(agencyRequests[0].id, "reject")}>
              Rechazar
            </button>
          </div>
        </section>
      ) : null}
      {activeAgency && !agencyMode && activeWorkspace === "profile" ? (
        <section className="agency-owner-notice is-linked">
          <div>
            <strong>Agencia vinculada</strong>
            <span>Si quieres desvincular la agencia, puedes hacerlo desde esta sección de Perfil.</span>
            <small>{activeAgency.agencyName || activeAgency.agencyEmail} puede editar enlaces, diseño, comercio, métodos de pago visibles y configuración de agenda. No puede ver seguridad, facturación privada ni citas de clientes.</small>
          </div>
          <div className="agency-owner-actions">
            <button className="btn btn-secondary" type="button" onClick={() => onAgencyRevoke?.()}>
              Desvincular agencia
            </button>
          </div>
        </section>
      ) : null}
      <aside className={`editor-sidebar panel ${navCollapsed ? "is-collapsed" : ""} ${mobileNavOpen ? "is-mobile-open" : ""}`}>
        <div className="editor-sidebar-top">
          <button
            className="editor-sidebar-close"
            type="button"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Cerrar menú lateral"
            title="Cerrar menú lateral"
          >
            <X size={18} />
          </button>
          <button
            className={`editor-theme-toggle ${darkModeEnabled ? "is-active" : ""}`}
            type="button"
            onClick={handleThemeToggle}
            aria-label={darkModeEnabled ? "Desactivar modo oscuro" : "Activar modo oscuro"}
            title={darkModeEnabled ? "Desactivar modo oscuro" : "Activar modo oscuro"}
          >
            <span className="editor-theme-toggle-track">
              <span className="editor-theme-toggle-thumb">
                {darkModeEnabled ? <Moon size={14} /> : <Sun size={14} />}
              </span>
            </span>
          </button>
        </div>

        <nav className="editor-sidebar-nav" aria-label="Navegación del editor">
          {dashboardNavItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeWorkspace === tab.id;
            return (
              <button
                key={tab.id}
                className={`editor-sidebar-item ${isActive ? "is-active" : ""} ${tab.isRecommended ? "is-recommended" : ""}`.trim()}
                type="button"
                onClick={() => handleWorkspaceSelect(tab.id)}
                aria-current={isActive ? "page" : undefined}
                aria-label={tab.isRecommended ? `${tab.label} ${tab.recommendationLabel}` : tab.label}
                title={tab.isRecommended ? moduleRecommendation.hint : tab.label}
              >
                <span className="editor-sidebar-item-icon">
                  <Icon size={18} />
                </span>
                <span className="editor-sidebar-item-copy">
                  <strong>{tab.label}</strong>
                  {tab.isRecommended ? <small>{tab.recommendationLabel}</small> : null}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="editor-sidebar-footer">
          {isAdmin ? (
            <Link className="editor-sidebar-utility" href="/admin" title="Panel de administración" onClick={() => setMobileNavOpen(false)}>
              <span className="editor-sidebar-item-icon">
                <ShieldCheck size={18} />
              </span>
              <span className="editor-sidebar-item-copy">
                <strong>Panel admin</strong>
              </span>
            </Link>
          ) : null}

          <button className="editor-sidebar-utility" type="button" onClick={onLogout} title="Cerrar sesión">
            <span className="editor-sidebar-item-icon">
              <LogOut size={18} />
            </span>
            <span className="editor-sidebar-item-copy">
              <strong>Cerrar sesión</strong>
            </span>
          </button>
        </div>
      </aside>

      <section className="editor-topbar panel">
        <button
          className="editor-mobile-menu-button"
          type="button"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Abrir menú lateral"
          title="Abrir menú lateral"
        >
          <Menu size={18} />
        </button>
        <div className="editor-topbar-brand">
          <div className="dashboard-identity-logo">
            <img className="dashboard-identity-logo-image" src={dashboardLogoSrc} alt={dashboardBusinessName} />
          </div>
          <div className="editor-topbar-brand-copy">
            <strong className="editor-topbar-business-name">{dashboardBusinessName}</strong>
          </div>
        </div>

        <div className="dashboard-identity-meta">
          <span className={`status-badge ${subscriptionTone}`}>
            {subscriptionTone === "success" ? <ShieldCheck size={14} /> : null}
            <span>{topbarStatusLabel}</span>
          </span>
        </div>
      </section>

      {!["commerce", "booking", "reservations"].includes(activeWorkspace) ? (
        <aside className="preview-shell preview-shell-editor preview-shell-workspace">
          <div className="preview-header preview-header-editor">
            <div className="preview-toolbar">
              <div className="preview-link-card">
                <span className="dashboard-link-label">Link público</span>
                <strong>{previewPublicUrl}</strong>
              </div>
              <div className="preview-action-group">
                <button className="btn btn-secondary" type="button" onClick={onCopyPublicUrl} disabled={!previewPublicUrl}>
                  <Copy size={16} /> Copiar
                </button>
                <button className="btn btn-secondary" type="button" onClick={handleOpenPublicUrl} disabled={!previewPublicUrl}>
                  <ExternalLink size={16} /> Abrir
                </button>
                <button className="btn btn-secondary" type="button" onClick={onDownloadQr} disabled={!profile?.qrUrl}>
                  <Download size={16} /> Descargar QR
                </button>
              </div>
            </div>
          </div>
          <div className="preview-frame preview-frame-editor">
            <DashboardPreview user={previewUser} />
          </div>
        </aside>
      ) : null}

      <div className="editor-panel">
        <div className="editor-tabs" role="tablist" aria-label="Navegación del editor">
          {dashboardNavItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeWorkspace === tab.id;
            return (
              <button
                key={tab.id}
                className={`editor-tab ${isActive ? "is-active" : ""} ${tab.isRecommended ? "is-recommended" : ""}`.trim()}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveWorkspace(tab.id)}
                title={tab.isRecommended ? moduleRecommendation.hint : tab.label}
              >
                <Icon size={17} />
                <span>{tab.label}</span>
                {tab.isRecommended ? <small>{tab.recommendationLabel}</small> : null}
              </button>
            );
          })}
        </div>

        <form className="section-stack editor-panel-form" onSubmit={handleSubmit}>
          {["profile", "security", "billing", "subscription"].includes(activeWorkspace) ? (
            <section className="dashboard-section panel workspace-panel">
              <div className="dashboard-section-head workspace-panel-head">
                <div>
                  <h2 className="section-title" style={{ fontSize: "1.35rem" }}>
                    {activeWorkspace === "profile"
                      ? "Perfil del negocio"
                      : activeWorkspace === "security"
                        ? "Seguridad y recuperación"
                        : activeWorkspace === "billing"
                          ? "Facturación electrónica"
                          : "Suscripción y estado"}
                  </h2>
                  <p className="section-copy">
                    {activeWorkspace === "profile"
                      ? "Actualiza nombre, usuario, categoría, imagen y mensaje principal de tu Klicor."
                      : activeWorkspace === "security"
                        ? "Configura correo de respaldo, teléfono de recuperación y verificación."
                        : activeWorkspace === "billing"
                          ? "Datos privados para ayudarte a emitir la factura electrónica."
                          : "Plan actual, fechas operativas y acceso a renovación."}
                  </p>
                </div>
                {activeWorkspace === "profile" ? (
                  <span className="status-badge">{form.username || "Sin usuario"}</span>
                ) : activeWorkspace === "security" ? (
                  <span className={`status-badge ${recoveryProtected ? "success" : ""}`}>{recoveryProtected ? "Protegida" : "Pendiente"}</span>
                ) : activeWorkspace === "billing" ? (
                  <span className={`status-badge ${billingProfileConfigured ? "success" : ""}`}>
                    {billingProfileConfigured ? "Lista" : billingProfileStarted ? "Parcial" : "Pendiente"}
                  </span>
                ) : (
                  <span className={`status-badge ${subscriptionTone}`}>
                    <CreditCard size={14} />
                    {subscriptionLabel}
                  </span>
                )}
              </div>

              <div className="section-stack accordion-subsections">
            {activeWorkspace === "profile" ? (
            <AccordionSection
              id="profile-identity"
              title="Identidad del negocio"
              copy="Nombre del negocio, nombre de usuario e imagen principal."
              openSection={openProfileSection}
              onToggle={toggleProfileSection}
              className="accordion-subsection"
              trailing={<span className="status-badge">{form.username || "Sin usuario"}</span>}
            >
              <div className="profile-grid">
                <div>
                  <label className="label">Nombre del negocio</label>
                  <input
                    className="input"
                    value={form.businessName}
                    onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                    disabled={!canEdit}
                    required
                  />
                </div>
                <div>
                  <label className="label">Nombre de usuario</label>
                  <input
                    className="input"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    disabled={!canEdit}
                    required
                  />
                  <p className="muted" style={{ marginTop: ".45rem" }}>Este valor cambia tu URL visible. Tu enlace anterior y tu QR se mantienen funcionando.</p>
                </div>
              </div>

              <div className="profile-grid">
                <div>
                  <label className="label">Categoría del negocio</label>
                  <select
                    className="select"
                    value={form.businessCategory}
                    onChange={(e) => {
                      const nextCategory = e.target.value;
                      const nextOptions = getBusinessTypeOptionsForCategory(nextCategory);
                      setForm({
                        ...form,
                        businessCategory: nextCategory,
                        businessType: nextOptions.some((option) => option.value === form.businessType) ? form.businessType : "",
                      });
                    }}
                    disabled={!canEdit}
                  >
                    {BUSINESS_CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Qué hace o vende</label>
                  <select
                    className="select"
                    value={form.businessType}
                    onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                    disabled={!canEdit}
                  >
                    <option value="">Selecciona una opcion</option>
                    {businessTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="profile-grid">
                <div>
                  <label className="label">Slogan de tu negocio</label>
                  <input
                    className="input"
                    value={form.businessHeadline}
                    onChange={(e) => setForm({ ...form, businessHeadline: e.target.value })}
                    placeholder="Ejemplo: Pedidos, menú y atención en un solo link y un QR"
                    disabled={!canEdit}
                  />
                </div>
              </div>

              <div className="onboarding-location-card">
                <div>
                  <strong>Ciudad del negocio</strong>
                  <p className="section-copy">Este dato ayuda a ubicar mejor tu negocio dentro de Klicor.</p>
                </div>
                <div className="profile-grid">
                  <div>
                    <label className="label">Departamento</label>
                    <select
                      className="select"
                      value={billingProfile.department}
                      onChange={(e) =>
                        setBillingProfile((current) => ({
                          ...current,
                          department: e.target.value,
                          city: "",
                        }))
                      }
                      disabled={!canEdit}
                    >
                      <option value="">Selecciona un departamento</option>
                      {COLOMBIA_DEPARTMENT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Ciudad o municipio</label>
                    <select
                      className="select"
                      value={billingProfile.city}
                      onChange={(e) => setBillingProfile((current) => ({ ...current, city: e.target.value }))}
                      disabled={!canEdit || !billingProfile.department}
                    >
                      <option value="">{billingProfile.department ? "Selecciona una ciudad o municipio" : "Selecciona primero el departamento"}</option>
                      {billingCityOptions.map((cityOption) => (
                        <option key={cityOption.code} value={cityOption.name}>
                          {cityOption.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="label">Frase de apoyo</label>
                <input
                  className="input"
                  value={form.businessSubheadline}
                  onChange={(e) => setForm({ ...form, businessSubheadline: e.target.value })}
                  placeholder="Ejemplo: Haz tus pedidos aquí."
                  disabled={!canEdit}
                />
                <p className="muted" style={{ marginTop: ".45rem" }}>
                  Si lo dejas vacío, Klicor usará un texto sugerido según la categoría de tu negocio.
                </p>
              </div>

              {usernameChanged ? (
                <div className="notice">
                  <span>Al guardar, tu URL visible se actualiza al nuevo usuario. Los enlaces anteriores y el QR siguen resolviendo a tu perfil.</span>
                </div>
              ) : null}

              <div className="upload-inline">
                <label className="label">Imagen del negocio</label>
                <label className={`upload-card ${!canEdit ? "upload-card-disabled" : ""}`}>
                  <input
                    className="upload-input"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                    disabled={!canEdit}
                  />
                  <span className="upload-icon">{photo || profile?.photo ? <ImagePlus size={20} /> : <UploadCloud size={20} />}</span>
                  <span className="upload-copy">
                    <strong>{photo ? "Cambiar imagen" : "Subir imagen"}</strong>
                    <span>{selectedPhotoLabel}</span>
                    <small>PNG, JPG o WEBP hasta 2 MB</small>
                  </span>
                </label>
              </div>
            </AccordionSection>
            ) : null}

            {activeWorkspace === "profile" ? (
            <AccordionSection
              id="profile-hours"
              title="Horarios de atención"
              copy="Define cuándo recibes pedidos y mensajes comerciales desde tu tienda, menú o catálogo."
              openSection={openProfileSection}
              onToggle={toggleProfileSection}
              className="accordion-subsection"
              trailing={
                <span className={`status-badge ${businessHoursConfigured ? (businessHoursStatus.isOpen ? "success" : "warning") : ""}`}>
                  {businessHoursConfigured ? businessHoursStatus.label : "Sin horario"}
                </span>
              }
            >
              <div className="business-hours-panel">
                <label className="toggle-card">
                  <input
                    type="checkbox"
                    checked={businessHours.enabled}
                    onChange={(event) => updateBusinessHoursField("enabled", event.target.checked)}
                    disabled={!canEdit}
                  />
                  <span className="toggle-copy">
                    <strong>Usar horarios para pedidos</strong>
                    <small>Cuando esté cerrado, tus clientes podrán ver productos, pero no enviar pedidos.</small>
                  </span>
                </label>

                {businessHours.enabled ? (
                  <div className={`business-hours-status ${businessHoursStatus.isOpen ? "is-open" : "is-closed"}`.trim()}>
                    <strong>{businessHoursStatus.label}</strong>
                    <span>{businessHoursStatus.nextOpeningLabel || businessHoursStatus.detail}</span>
                  </div>
                ) : (
                  <div className="notice">
                    <span>Si no activas horarios, Klicor permitirá pedidos en cualquier momento.</span>
                  </div>
                )}

                <div className="business-hours-grid">
                  {BUSINESS_HOUR_DAY_OPTIONS.map((dayOption) => {
                    const day = businessHours.days.find((item) => item.day === dayOption.key) || createDefaultBusinessHourDay(dayOption.key);
                    return (
                      <article key={dayOption.key} className={`business-hours-day-card ${day.isOpen ? "is-open" : "is-closed"}`.trim()}>
                        <div className="business-hours-day-head">
                          <label className="switch-row">
                            <input
                              type="checkbox"
                              checked={day.isOpen}
                              onChange={(event) => updateBusinessHourDayOpen(dayOption.key, event.target.checked)}
                              disabled={!canEdit}
                            />
                            <span>{dayOption.label}</span>
                          </label>
                          <strong>{day.isOpen ? "Abierto" : "Cerrado"}</strong>
                        </div>

                        {day.isOpen ? (
                          <div className="business-hours-day-body">
                            <select
                              className="select"
                              value={day.mode}
                              onChange={(event) => updateBusinessHourMode(dayOption.key, event.target.value)}
                              disabled={!canEdit}
                            >
                              <option value="continuous">Jornada continua</option>
                              <option value="split">Mañana y tarde</option>
                            </select>

                            <div className="business-hours-shifts">
                              {day.shifts.map((shift, index) => (
                                <div className="business-hours-shift" key={`${dayOption.key}-${index}`}>
                                  <span>{day.mode === "split" ? (index === 0 ? "Mañana" : "Tarde") : "Horario"}</span>
                                  <input
                                    className="input"
                                    type="time"
                                    value={shift.start}
                                    onChange={(event) => updateBusinessHourShift(dayOption.key, index, "start", event.target.value)}
                                    disabled={!canEdit}
                                    aria-label={`${dayOption.label} abre ${day.mode === "split" && index === 1 ? "en la tarde" : "en la mañana"}`}
                                  />
                                  <input
                                    className="input"
                                    type="time"
                                    value={shift.end}
                                    onChange={(event) => updateBusinessHourShift(dayOption.key, index, "end", event.target.value)}
                                    disabled={!canEdit}
                                    aria-label={`${dayOption.label} cierra ${day.mode === "split" && index === 1 ? "en la tarde" : "en la mañana"}`}
                                  />
                                  <small>{formatDisplayTime(shift.start)} - {formatDisplayTime(shift.end)}</small>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="muted">No se recibirán pedidos este día.</p>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            </AccordionSection>
            ) : null}

            {activeWorkspace === "security" ? (
            <AccordionSection
              id="profile-security"
              title="Seguridad y recuperación"
              copy="Correo de respaldo, teléfono de recuperación y verificación."
              openSection={openProfileSection}
              onToggle={toggleProfileSection}
              className="accordion-subsection"
              trailing={
                <span className={`status-badge ${recoveryProtected ? "success" : ""}`}>
                  {recoveryProtected ? <ShieldCheck size={14} /> : null}
                  {recoveryProtected ? "Protegida" : "Pendiente"}
                </span>
              }
            >
              <div className="grid-3">
                <div className="kpi">
                  <strong>Correo de respaldo</strong>
                  <p className="muted" style={{ marginTop: ".5rem" }}>{recovery?.backupEmail || "Aún no configurado"}</p>
                  <p className="muted" style={{ marginTop: ".35rem" }}>{recovery?.backupEmailVerified ? "Verificado" : "Pendiente de verificación"}</p>
                </div>
                <div className="kpi">
                  <strong>Teléfono de recuperación</strong>
                  <p className="muted" style={{ marginTop: ".5rem" }}>{recovery?.recoveryPhone || "Aún no configurado"}</p>
                  <p className="muted" style={{ marginTop: ".35rem" }}>{recovery?.recoveryPhoneVerified ? "Verificado" : "Guardado para siguiente fase OTP"}</p>
                </div>
                <div className="kpi">
                  <strong>Estado</strong>
                  <p className="muted" style={{ marginTop: ".5rem" }}>
                    {recoveryProtected ? "Tu cuenta ya tiene un método de recuperación verificado." : "Configura y verifica al menos un correo de respaldo."}
                  </p>
                </div>
              </div>

              <div className="profile-grid">
                <div>
                  <label className="label">Correo de respaldo</label>
                  <div className="input-with-icon">
                    <Mail size={16} />
                    <input
                      className="input"
                      type="email"
                      value={recovery?.backupEmail || ""}
                      onChange={(e) => onRecoveryFieldChange("backupEmail", e.target.value)}
                      placeholder="respaldo@tuempresa.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Teléfono de recuperación</label>
                  <div className="input-with-icon">
                    <Phone size={16} />
                    <input
                      className="input"
                      value={recovery?.recoveryPhone || ""}
                      onChange={(e) => onRecoveryFieldChange("recoveryPhone", e.target.value)}
                      placeholder="+57 300 123 4567"
                    />
                  </div>
                </div>
              </div>

              {!recovery?.backupEmailVerified && recovery?.backupEmail ? (
                <div className="notice">
                  <span>
                    Verifica el correo de respaldo para usarlo en recuperación.
                    {recovery?.backupEmailVerificationExpiresAt ? " El enlace actual vence pronto." : ""}
                  </span>
                </div>
              ) : null}

              <div className="actions">
                <button className="btn btn-secondary" type="button" onClick={onSaveRecovery} disabled={recoveryLoading}>
                  {recoveryLoading ? <RefreshCw size={16} /> : <Mail size={16} />}
                  {recoveryLoading ? "Guardando..." : "Guardar recuperación"}
                </button>
                {recovery?.backupEmail && !recovery?.backupEmailVerified ? (
                  <button className="btn btn-secondary" type="button" onClick={onResendRecoveryVerification} disabled={recoveryLoading}>
                    <Send size={16} /> Reenviar verificación
                  </button>
                ) : null}
              </div>

              {recoveryMessage ? <p className="notice">{recoveryMessage}</p> : null}
            </AccordionSection>
            ) : null}

            {activeWorkspace === "billing" ? (
            <AccordionSection
              id="profile-billing"
              title="Información del negocio para facturación"
              copy="Datos privados para ayudarte a emitir la factura electrónica."
              openSection={openProfileSection}
              onToggle={toggleProfileSection}
              className="accordion-subsection"
              trailing={
                <span className={`status-badge ${billingProfileConfigured ? "success" : ""}`}>
                  {billingProfileConfigured ? "Lista" : billingProfileStarted ? "Parcial" : "Pendiente"}
                </span>
              }
            >
              <div className="notice">
                <span>Estos datos no se muestran en tu página pública. Son solo de apoyo interno para facturación electrónica.</span>
              </div>

              <div className="grid-3">
                <div className="kpi">
                  <strong>Razón social</strong>
                  <p className="muted" style={{ marginTop: ".5rem" }}>{billingProfile.legalName || "Aún no configurada"}</p>
                </div>
                <div className="kpi">
                  <strong>Documento</strong>
                  <p className="muted" style={{ marginTop: ".5rem" }}>
                    {billingProfile.documentNumber ? `${billingDocumentTypeLabel} ${billingProfile.documentNumber}` : "Aún no configurado"}
                  </p>
                </div>
                <div className="kpi">
                  <strong>Ubicación fiscal</strong>
                  <p className="muted" style={{ marginTop: ".5rem" }}>
                    {[billingProfile.city, billingProfile.department].filter(Boolean).join(", ") || "Aún no configurada"}
                  </p>
                </div>
              </div>

              <div className="profile-grid">
                <div>
                  <label className="label">Razón social o nombre legal</label>
                  <input
                    className="input"
                    value={billingProfile.legalName}
                    onChange={(e) => setBillingProfile((current) => ({ ...current, legalName: e.target.value }))}
                    placeholder="Nombre legal del negocio o persona"
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <label className="label">Tipo de documento</label>
                  <select
                    className="select"
                    value={billingProfile.documentType}
                    onChange={(e) => setBillingProfile((current) => ({ ...current, documentType: e.target.value }))}
                    disabled={!canEdit}
                  >
                    {BILLING_DOCUMENT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="profile-grid">
                <div>
                  <label className="label">Número de documento</label>
                  <input
                    className="input"
                    value={billingProfile.documentNumber}
                    onChange={(e) => setBillingProfile((current) => ({ ...current, documentNumber: e.target.value }))}
                    placeholder="900123456 o 1234567890"
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <label className="label">Dígito de verificación</label>
                  <input
                    className="input"
                    value={billingProfile.verificationDigit}
                    onChange={(e) => setBillingProfile((current) => ({ ...current, verificationDigit: e.target.value }))}
                    placeholder="Opcional, si aplica"
                    disabled={!canEdit}
                  />
                </div>
              </div>

              <div className="profile-grid">
                <div>
                  <label className="label">Correo de facturación</label>
                  <input
                    className="input"
                    type="email"
                    value={billingProfile.billingEmail}
                    onChange={(e) => setBillingProfile((current) => ({ ...current, billingEmail: e.target.value }))}
                    placeholder="facturación@tuempresa.com"
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <label className="label">Teléfono de facturación</label>
                  <input
                    className="input"
                    value={billingProfile.billingPhone}
                    onChange={(e) => setBillingProfile((current) => ({ ...current, billingPhone: e.target.value }))}
                    placeholder="+57 300 123 4567"
                    disabled={!canEdit}
                  />
                </div>
              </div>

              <div className="profile-grid">
                <div>
                  <label className="label">Dirección fiscal</label>
                  <input
                    className="input"
                    value={billingProfile.address}
                    onChange={(e) => setBillingProfile((current) => ({ ...current, address: e.target.value }))}
                    placeholder="Calle 10 # 20-30"
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <label className="label">Responsable de IVA</label>
                  <select
                    className="select"
                    value={billingProfile.taxResponsibility}
                    onChange={(e) => setBillingProfile((current) => ({ ...current, taxResponsibility: e.target.value }))}
                    disabled={!canEdit}
                  >
                    <option value="">Selecciona una opci\u00f3n</option>
                    {BILLING_RESPONSIBILITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="profile-grid">
                <div>
                  <label className="label">Departamento</label>
                  <select
                    className="select"
                    value={billingProfile.department}
                    onChange={(e) =>
                      setBillingProfile((current) => ({
                        ...current,
                        department: e.target.value,
                        city: "",
                      }))
                    }
                    disabled={!canEdit}
                  >
                    <option value="">Selecciona un departamento</option>
                    {COLOMBIA_DEPARTMENT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Ciudad o municipio</label>
                  <select
                    className="select"
                    value={billingProfile.city}
                    onChange={(e) => setBillingProfile((current) => ({ ...current, city: e.target.value }))}
                    disabled={!canEdit || !billingProfile.department}
                  >
                    <option value="">{billingProfile.department ? "Selecciona una ciudad o municipio" : "Selecciona primero el departamento"}</option>
                    {billingCityOptions.map((cityOption) => (
                      <option key={cityOption.code} value={cityOption.name}>
                        {cityOption.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">País</label>
                <input
                  className="input"
                  value={billingProfile.country}
                  onChange={(e) => setBillingProfile((current) => ({ ...current, country: e.target.value }))}
                  placeholder="Colombia"
                  disabled={!canEdit}
                />
              </div>
            </AccordionSection>
            ) : null}

            {activeWorkspace === "subscription" ? (
            <AccordionSection
              id="profile-subscription"
              title="Suscripción y estado"
              copy="Plan actual, fechas operativas y renovación."
              openSection={openProfileSection}
              onToggle={toggleProfileSection}
              className="accordion-subsection"
              trailing={
                <span className={`status-badge ${subscriptionTone}`}>
                  <CreditCard size={14} />
                  {subscriptionLabel}
                </span>
              }
            >
              <div className="grid-3">
                <div className="kpi">
                  <strong>Valor anual</strong>
                  <p className="muted" style={{ marginTop: ".5rem" }}>{annualPriceLabel}</p>
                </div>
                <div className="kpi">
                  <strong>Período de prueba</strong>
                  <p className="muted" style={{ marginTop: ".5rem" }}>{profile?.trialEndsAtLabel || "-"}</p>
                </div>
                <div className="kpi">
                  <strong>Expira</strong>
                  <p className="muted" style={{ marginTop: ".5rem" }}>{profile?.expiresAtLabel || "-"}</p>
                </div>
              </div>

              <div className="kpi">
                <strong>Estado operativo</strong>
                <p className="muted" style={{ marginTop: ".5rem" }}>{subscriptionMessage}</p>
              </div>

              <div className="kpi">
                <strong>Módulos activos</strong>
                <p className="muted" style={{ marginTop: ".5rem" }}>{enabledModules.length ? enabledModules.join(" + ") : "Solo link in bio"}</p>
                {missingModules.length ? (
                  <div className="actions" style={{ marginTop: ".85rem" }}>
                    {missingModules.map((module) => (
                      canEnableExtraModule ? (
                        <button
                          key={module}
                          className="btn btn-secondary"
                          type="button"
                          onClick={() => enableModule(module)}
                          disabled={Boolean(moduleBusy)}
                        >
                          {moduleBusy === module ? "Habilitando..." : `Habilitar ${getModuleLabel(module)}`}
                        </button>
                      ) : currentPlan === "commercial" ? (
                        <button
                          key={module}
                          className="btn btn-secondary"
                          type="button"
                          onClick={() => setCheckoutPlan("plus")}
                          disabled={paying}
                        >
                          Actualiza a Plus para usar {getModuleLabel(module)}
                        </button>
                      ) : null
                    ))}
                  </div>
                ) : null}
                {currentPlan === "commercial" && missingModules.length ? (
                  <p className="muted" style={{ marginTop: ".75rem" }}>El plan Comercial permite un solo módulo. Para usar Comercio y Agenda juntos, cambia a Plus.</p>
                ) : null}
              </div>

              <div className="form-grid">
                <div>
                  <label className="label">Plan a pagar</label>
                  <select className="select" value={checkoutPlan} onChange={(event) => setCheckoutPlan(event.target.value)} disabled={paying}>
                    {CHECKOUT_PLAN_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value} disabled={hasActivePaidPlan && isLowerCheckoutPlan(currentPlan, option.value)}>{option.label}</option>
                    ))}
                  </select>
                  {hasActivePaidPlan ? (
                    <p className="muted" style={{ marginTop: ".5rem" }}>Para bajar de plan debes esperar a que venza el plan actual o solicitar ajuste manual.</p>
                  ) : null}
                </div>
                {checkoutPlan === "commercial" ? (
                  <div>
                    <label className="label">Módulo Comercial</label>
                    <select className="select" value={checkoutModule} onChange={(event) => setCheckoutModule(event.target.value)} disabled={paying}>
                      {CHECKOUT_MODULE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                ) : null}
              </div>

              <div className="actions">
                <button className="btn btn-primary" type="button" onClick={() => onCheckout({ plan: checkoutPlan, module: checkoutPlan === "commercial" ? checkoutModule : "" })} disabled={paying || !userEmailVerified}>
                  <CreditCard size={16} /> {subscriptionActionLabel}
                </button>
              </div>

              {checkoutConfig ? (
                <div className="stack" style={{ gap: ".85rem" }}>
                  <p className="muted">
                    {checkoutConfig.openedExternally
                      ? "Abrimos Mercado Pago en una pestaña nueva para que el pago, incluido PSE, se complete fuera del panel."
                      : "El enlace oficial de Mercado Pago ya está listo. Si el navegador bloqueó la pestaña emergente, ábrelo manualmente."}
                  </p>
                  <button className="btn btn-secondary" type="button" onClick={() => { window.open(checkoutConfig.initPoint, "_blank", "noopener,noreferrer"); }}>
                    Abrir Mercado Pago
                  </button>
                </div>
              ) : null}
            </AccordionSection>
            ) : null}
          </div>
            </section>
          ) : null}

          {activeWorkspace === "commerce" ? (
            <CommerceWorkspace
              token={token}
              profile={{ ...profile, ...previewUser, uid: profile?.uid || profile?.id, savedUsername: profile?.username || "" }}
              active={activeWorkspace === "commerce"}
              canEdit={canEdit}
              agencyMode={agencyMode}
              agencyTargetUid={agencyTargetUid}
            />
          ) : null}

          {activeWorkspace === "booking" ? (
            <BookingWorkspace
              token={token}
              profile={{ ...profile, ...previewUser, uid: profile?.uid || profile?.id, savedUsername: profile?.username || "" }}
              active={activeWorkspace === "booking"}
              canEdit={canEdit}
              agencyMode={agencyMode}
              agencyTargetUid={agencyTargetUid}
            />
          ) : null}

          {activeWorkspace === "reservations" ? (
            <section className="dashboard-section panel workspace-panel reservations-placeholder-panel">
              <div className="dashboard-section-head workspace-panel-head">
                <div>
                  <h2 className="section-title" style={{ fontSize: "1.35rem" }}>Reservas</h2>
                  <p className="section-copy">Módulo pensado para turismo, experiencias, planes y actividades por cupos.</p>
                </div>
                <span className="status-badge">
                  <CalendarCheck size={14} />
                  Próximo módulo
                </span>
              </div>

              <div className="empty-state-card reservations-placeholder-card">
                <CalendarCheck size={28} />
                <strong>Reservas estará separado de Agenda</strong>
                <p>
                  Agenda seguirá siendo para servicios y salud/bienestar. Reservas será el módulo para turismo y experiencias,
                  con planes, cupos, fechas disponibles y confirmación de interesados.
                </p>
              </div>
            </section>
          ) : null}

          {activeWorkspace === "dorika" && dorikaEligible ? (
            <section className="dashboard-section panel workspace-panel dorika-profile-panel">
              <div className="dashboard-section-head workspace-panel-head">
                <div>
                  <h2 className="section-title" style={{ fontSize: "1.35rem" }}>Haz que te encuentren en Dorika</h2>
                  <p className="section-copy">Completa esta ficha poco a poco. Klicor sigue funcionando aunque no termines estos datos hoy.</p>
                </div>
                <span className={`status-badge ${dorikaProfile.enabled ? "success" : ""}`}>
                  <MapPinned size={14} />
                  {dorikaProfile.enabled ? "Visible" : "Oculto"}
                </span>
              </div>

              <div className="dorika-progress-card">
                <div>
                  <span className="dashboard-link-label">Perfil Dorika</span>
                  <strong>{dorikaProfile.enabled ? `${dorikaProgressPercent}% completo` : "Dorika desactivado"}</strong>
                  <p className="section-copy">Mientras más claro esté tu perfil, más fácil será que te descubran desde Dorika.</p>
                </div>
                <div className="dorika-progress-meter" aria-label={`Perfil Dorika ${dorikaProgressPercent}% completo`}>
                  <span style={{ width: `${dorikaProfile.enabled ? dorikaProgressPercent : 0}%` }} />
                </div>
              </div>

              <div className="dorika-task-grid">
                {dorikaTasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    className={`dorika-task-card ${task.complete ? "is-complete" : ""}`.trim()}
                    onClick={() => scrollToDorikaTask(task.id)}
                  >
                    <span>{task.complete ? <CheckCircle2 size={16} /> : <Star size={15} />}</span>
                    <strong>{task.label}</strong>
                    <small>{task.copy}</small>
                  </button>
                ))}
              </div>

              <div className="section-stack">
                <label id="dorika-visibility" className="toggle-card dorika-scroll-target">
                  <input
                    type="checkbox"
                    checked={dorikaProfile.enabled}
                    onChange={(e) => updateDorikaField("enabled", e.target.checked)}
                    disabled={!canEdit}
                  />
                  <span className="toggle-copy">
                    <strong>Aparecer en Dorika</strong>
                    <small>Tu negocio podrá mostrarse en búsquedas, secciones cercanas y recomendaciones.</small>
                  </span>
                </label>

                <div id="dorika-location" className="dorika-form-block dorika-scroll-target">
                  <div>
                    <h3 className="section-title" style={{ fontSize: "1.05rem" }}>Ubicación</h3>
                    <p className="section-copy">Muestra solo lo necesario para que te encuentren sin perder privacidad.</p>
                  </div>
                  <div className="profile-grid">
                    <div>
                      <label className="label">Ciudad</label>
                      <input className="input" value={dorikaProfile.city} onChange={(e) => updateDorikaField("city", e.target.value)} placeholder="Ej. Ocaña" disabled={!canEdit} />
                    </div>
                    <div>
                      <label className="label">Barrio o zona</label>
                      <input className="input" value={dorikaProfile.zone} onChange={(e) => updateDorikaField("zone", e.target.value)} placeholder="Ej. Centro" disabled={!canEdit} />
                    </div>
                  </div>
                  <div className="dorika-privacy-grid">
                    {DORIKA_LOCATION_PRIVACY_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`dorika-privacy-option ${dorikaProfile.locationPrivacy === option.value ? "is-active" : ""}`.trim()}
                        onClick={() => updateDorikaField("locationPrivacy", option.value)}
                        disabled={!canEdit}
                      >
                        <strong>{option.label}</strong>
                        <span>{option.copy}</span>
                      </button>
                    ))}
                  </div>
                  {dorikaProfile.locationPrivacy === "exact" ? (
                    <div className="dorika-location-capture">
                      <div>
                        <strong>Punto exacto en el mapa</strong>
                        <p className="section-copy">
                          Si estás en el local, puedes usar tu ubicación actual. Si estás en casa o en un PC, abre el mapa y mueve el pin hasta tu negocio.
                        </p>
                        <small>
                          {dorikaHasExactCoordinates
                            ? `Punto guardado${dorikaProfile.locationAccuracyMeters ? ` con precisión aprox. de ${dorikaProfile.locationAccuracyMeters} m` : " en el mapa"}.`
                            : "Aún no has guardado el punto exacto del negocio."}
                        </small>
                      </div>
                      <div className="dorika-location-actions">
                        <button className="btn btn-primary" type="button" onClick={() => setDorikaMapOpen(true)} disabled={!canEdit}>
                          <MapPinned size={16} />
                          Ubicar en mapa
                        </button>
                        <button className="btn btn-secondary" type="button" onClick={captureDorikaLocation} disabled={!canEdit || dorikaLocationLoading}>
                          {dorikaLocationLoading ? <RefreshCw className="spin" size={16} /> : <MapPin size={16} />}
                          Usar ubicación actual
                        </button>
                      </div>
                      {dorikaLocationMessage ? <span className="dorika-location-status">{dorikaLocationMessage}</span> : null}
                    </div>
                  ) : null}
                </div>

                {dorikaProfile.locationPrivacy !== "contact_only" ? (
                  <div className="dorika-form-block">
                    <div>
                      <h3 className="section-title" style={{ fontSize: "1.05rem" }}>Cómo encontrarte</h3>
                      <p className="section-copy">Perfecto para centros comerciales, edificios, plazoletas o locales internos.</p>
                    </div>
                    <div className="profile-grid">
                      <div>
                        <label className="label">Dirección visible</label>
                        <input className="input" value={dorikaProfile.address} onChange={(e) => updateDorikaField("address", e.target.value)} placeholder="Ej. Calle 10 #12-34" disabled={!canEdit} />
                      </div>
                      <div>
                        <label className="label">Lugar, edificio o centro comercial</label>
                        <input className="input" value={dorikaProfile.placeName} onChange={(e) => updateDorikaField("placeName", e.target.value)} placeholder="Ej. Centro Comercial City Gold" disabled={!canEdit} />
                      </div>
                    </div>
                    <div className="profile-grid">
                      <div>
                        <label className="label">Local, piso u oficina</label>
                        <input className="input" value={dorikaProfile.unit} onChange={(e) => updateDorikaField("unit", e.target.value)} placeholder="Ej. Local 204, piso 2" disabled={!canEdit} />
                      </div>
                      <div>
                        <label className="label">Referencia interna</label>
                        <input className="input" value={dorikaProfile.reference} onChange={(e) => updateDorikaField("reference", e.target.value)} placeholder="Ej. Frente a la plazoleta de comidas" disabled={!canEdit} />
                      </div>
                    </div>
                    <div>
                      <label className="label">Indicaciones cortas para llegar</label>
                      <textarea className="textarea" rows={3} value={dorikaProfile.arrivalInstructions} onChange={(e) => updateDorikaField("arrivalInstructions", e.target.value)} placeholder="Ej. Entra por la puerta principal, sube al segundo piso y gira a la derecha." disabled={!canEdit} />
                    </div>
                  </div>
                ) : null}

                <div id="dorika-appearance" className="dorika-form-block dorika-scroll-target">
                  <div>
                    <h3 className="section-title" style={{ fontSize: "1.05rem" }}>Cómo te verán</h3>
                    <p className="section-copy">Una portada y una descripción corta hacen que tu ficha se sienta más confiable.</p>
                  </div>
                  <label className={`upload-card dorika-cover-upload ${!canEdit ? "upload-card-disabled" : ""}`}>
                    <input
                      className="upload-input"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => {
                        setDorikaCoverLoadError(false);
                        setDorikaCover(e.target.files?.[0] || null);
                      }}
                      disabled={!canEdit}
                    />
                    <span className="upload-icon">{dorikaCoverDisplayUrl ? <ImagePlus size={20} /> : <UploadCloud size={20} />}</span>
                    <span className="upload-copy">
                      <strong>{dorikaCoverDisplayUrl ? "Cambiar portada" : "Subir portada para Dorika"}</strong>
                      <span>{dorikaCoverLoadError ? "No pudimos cargar la portada guardada. Sube una nueva foto." : "Foto horizontal del negocio, vitrina, producto o experiencia."}</span>
                    </span>
                    {dorikaCoverDisplayUrl ? (
                      <img
                        className="dorika-cover-preview"
                        src={dorikaCoverDisplayUrl}
                        alt="Portada para Dorika"
                        onError={() => setDorikaCoverLoadError(true)}
                      />
                    ) : null}
                  </label>
                  <div className="profile-grid">
                    <div className="dorika-category-note">
                      <span className="dashboard-link-label">Categoría en Dorika</span>
                      <strong>{dorikaCategoryLabel}</strong>
                      <small>La tomamos del tipo de negocio de tu perfil para no pedirte lo mismo dos veces.</small>
                    </div>
                    <div>
                      <span className="dashboard-link-label">Actividad del negocio</span>
                      <div className="dorika-category-note">
                        <strong>{businessTypeLabel}</strong>
                        <small>Se toma de tu perfil de Klicor. Cambialo en Identidad si necesitas ajustar filtros, mapa y secciones.</small>
                      </div>
                    </div>
                  </div>
                  <div id="dorika-description" className="dorika-scroll-target">
                    <label className="label">Descripción corta</label>
                    <input id="dorika-description-input" className="input" value={dorikaProfile.description} onChange={(e) => updateDorikaField("description", e.target.value)} placeholder="Ej. Pizza artesanal, pedidos rápidos y atención por WhatsApp." disabled={!canEdit} />
                  </div>
                </div>

                {showDorikaFeaturedProductsNote ? (
                  <div className="dorika-form-block dorika-featured-note">
                    <MapPin size={18} />
                    <div>
                      <strong>Productos destacados para Dorika</strong>
                      <p className="section-copy">En Mi tienda, Mi menú o Mi catálogo podrás marcar con estrella los productos que quieres mostrar primero en Dorika.</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          {activeWorkspace === "dorika" && dorikaEligible ? (
            <DorikaMapPicker
              open={dorikaMapOpen}
              businessName={form.businessName}
              initialLatitude={dorikaProfile.latitude}
              initialLongitude={dorikaProfile.longitude}
              initialCity={dorikaProfile.city || billingProfile.city}
              initialZone={dorikaProfile.zone}
              initialAddress={dorikaProfile.address}
              onClose={() => setDorikaMapOpen(false)}
              onSave={saveDorikaMapLocation}
            />
          ) : null}

          {activeWorkspace === "blocks" ? (
            <section className="dashboard-section panel workspace-panel">
              <div className="dashboard-section-head workspace-panel-head">
                <div>
                  <h2 className="section-title" style={{ fontSize: "1.35rem" }}>Enlaces y pagos</h2>
                  <p className="section-copy">Organiza botones, canales visibles, información de pago y el bloque para guardar contacto.</p>
                </div>
                <span className="status-badge">{profileLinks.length} enlaces</span>
              </div>

              <div className="section-stack">
          <div className="link-toolbar">
            <select
              className="select"
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setSelectedLinkValue("");
              }}
              disabled={!canEdit}
            >
              <option value="">Selecciona un botón nuevo</option>
              {availableLinkTypes.map((item) => (
                <option key={item.type} value={item.type}>
                  {item.label}
                </option>
              ))}
            </select>
            {selectedLinkMeta ? (
              <input
                className="input"
                value={selectedLinkValue}
                onChange={(e) => setSelectedLinkValue(e.target.value)}
                placeholder={selectedLinkMeta.placeholder}
                aria-label={`Dato para ${selectedLinkMeta.label}`}
                disabled={!canEdit}
              />
            ) : null}
            <button className="btn btn-secondary" type="button" onClick={addLink} disabled={!canEdit || !selectedType}>
              <Plus size={16} /> Agregar enlace
            </button>
          </div>

          <p className="muted">
            {!selectedType
              ? "Elige qué botón quieres sumar a tu página. Luego escribe el enlace o dato y agrégalo."
              : `${selectedLinkMeta?.label || "Este botón"}: ya tienes ${selectedTypeCount}. Puedes agregar más si necesitas.`}
          </p>

          <div className="section-divider" />

          <div className="dashboard-section-head">
            <div>
              <h3 className="section-title" style={{ fontSize: "1.05rem" }}>Información de pago</h3>
              <p className="section-copy">Configura los métodos que necesites para cobrar. Puedes usar cuenta bancaria, billetera o llave Bre-B.</p>
            </div>
            <span className="status-badge">{paymentMethods.length} métodos</span>
          </div>

          <div className="section-stack">
            <div className="payment-methods-stack">
              {paymentMethods.map((method, index) => {
                const showAccountType = requiresAccountType(method.entityId);
                const usesBrebValue = usesBrebKeyField(method.entityId);
                const paymentValue = usesBrebValue ? method.brebKey : method.accountNumber;
                return (
                  <div className="link-row payment-method-row" key={method.id}>
                    <div className="payment-method-fields">
                      <div>
                        <label className="label">Entidad</label>
                        <select
                          className="select"
                          value={method.entityId}
                          onChange={(e) => updatePaymentMethod(method.id, "entityId", e.target.value)}
                          disabled={!canEdit}
                        >
                          <option value="">Selecciona una entidad</option>
                          {COLOMBIA_FINANCIAL_ENTITY_OPTIONS.map((option) => (
                            <option key={`${method.id}-${option.value}`} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="label">Número de cuenta o llave Bre-B</label>
                        <input
                          className="input"
                          value={paymentValue}
                          placeholder={usesBrebValue ? "Ej. tu-llave@breb" : showAccountType ? "Ej. 1234567890" : "Ej. 3001234567"}
                          onChange={(e) => updatePaymentMethodValue(method.id, e.target.value)}
                          disabled={!canEdit}
                        />
                      </div>
                      {showAccountType ? (
                        <div>
                        <label className="label">Tipo de cuenta</label>
                        <select
                          className="select"
                          value={method.accountType}
                          onChange={(e) => updatePaymentMethod(method.id, "accountType", e.target.value)}
                          disabled={!canEdit}
                        >
                          <option value="">Selecciona el tipo</option>
                          {ACCOUNT_TYPE_OPTIONS.map((option) => (
                            <option key={`${method.id}-${option.value}`} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      ) : null}
                    </div>

                    <button className="btn btn-secondary payment-method-delete" type="button" onClick={() => removePaymentMethod(method.id)} disabled={!canEdit} aria-label={`Eliminar método de pago ${index + 1}`}>
                      <Trash2 size={16} />
                    </button>

                    <div className="link-row-message payment-method-secondary-row">
                      {method.entityId ? (
                        <div className="payment-method-qr-group">
                          <label className={`payment-method-qr-chip ${!canEdit ? "payment-method-qr-chip-disabled" : ""}`}>
                            <input
                              className="upload-input"
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              onChange={(e) => updatePaymentMethodQr(method.id, e.target.files?.[0] || null)}
                              disabled={!canEdit}
                            />
                            {method.qrPreviewUrl || method.qrImageUrl ? <ImagePlus size={14} /> : <UploadCloud size={14} />}
                            <span>{method.qrPreviewUrl || method.qrImageUrl ? "Cambiar QR" : "Subir QR"}</span>
                          </label>
                          {(method.qrPreviewUrl || method.qrImageUrl) ? (
                            <button
                              className="btn btn-secondary payment-method-qr-remove"
                              type="button"
                              onClick={() => removePaymentMethodQr(method.id)}
                              disabled={!canEdit}
                              aria-label={`Quitar QR del método de pago ${index + 1}`}
                            >
                              <Trash2 size={14} /> Quitar QR
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                      <p className="muted payment-method-summary">
                        {method.entityId
                          ? `Método ${index + 1}: ${resolveFinancialEntityLabel(method.entityId)}.`
                          : "Selecciona una entidad para definir cómo se mostrará este método."}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="payment-method-toolbar">
              <button className="btn btn-secondary" type="button" onClick={addPaymentMethod} disabled={!canEdit}>
                <Plus size={16} /> Agregar método de pago
              </button>
              <p className="muted">Puedes configurar varios métodos visibles en tu página.</p>
            </div>

          </div>

          <div className="section-divider" />

          <div className="stack">
            {profileLinks.length ? profileLinks.map((item) => {
              const meta = LINK_CATALOG_MAP[item.type] || LINK_CATALOG_MAP.website;
              return (
                <div className="link-row" key={item.id}>
                  <div>
                    <label className="label">Etiqueta</label>
                    <input className="input" value={item.label} onChange={(e) => updateLink(item.id, "label", e.target.value)} disabled={!canEdit} />
                  </div>
                  <div>
                    <label className="label">
                      {meta.kind === "phone" ? "Número" : meta.kind === "text" ? "Llave" : meta.kind === "email" ? "Correo" : "URL"}
                    </label>
                    <input className="input" value={item.value} placeholder={meta.placeholder} onChange={(e) => updateLink(item.id, "value", e.target.value)} disabled={!canEdit} />
                  </div>
                  <button className="btn btn-secondary link-remove" type="button" onClick={() => removeLink(item.id)} disabled={!canEdit} aria-label={`Eliminar enlace ${item.label || meta.label || ""}`.trim()}>
                    <Trash2 size={16} />
                  </button>
                  {item.type === "whatsapp" ? (
                    <div className="link-row-message">
                      <label className="label">Mensaje inicial</label>
                      <input className="input" value={item.message || ""} placeholder="Hola, quiero información" onChange={(e) => updateLink(item.id, "message", e.target.value)} disabled={!canEdit} />
                    </div>
                  ) : null}
                  {canConfigureActionPriority(item.type) ? (
                    <div className="link-row-message">
                      <label className="label">Prioridad del botón</label>
                      <div className="link-priority-row">
                        <select
                          className="select"
                          value={Number(item.priorityTier || 3)}
                          onChange={(e) => updateLinkPriority(item.id, e.target.value)}
                          disabled={!canEdit}
                        >
                          {PRIORITY_OPTIONS.map((option) => (
                            <option key={`${item.id}-${option.value}`} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            }) : (
              <div className="kpi">
                <strong>Sin enlaces todavía</strong>
                <p className="muted" style={{ marginTop: ".5rem" }}>Agrega tu primer canal para empezar a construir tu página pública.</p>
              </div>
            )}
          </div>
          <div className="section-divider" />

          <div className="dashboard-section-head">
            <div>
              <h3 className="section-title" style={{ fontSize: "1.05rem" }}>Guardar contacto</h3>
              <p className="section-copy">Decide si tu página mostrará un botón para guardar tu negocio como contacto.</p>
            </div>
            <span className={`status-badge ${contactCardEnabled ? "success" : ""}`}>
              {contactCardEnabled ? <Link2 size={14} /> : null}
              {contactCardEnabled ? "Activo" : "Oculto"}
            </span>
          </div>

          <label className="toggle-card">
            <input
              type="checkbox"
              checked={contactCardEnabled}
              onChange={(e) => setContactCard((current) => ({ ...current, enabled: e.target.checked }))}
              disabled={!canEdit}
            />
            <span className="toggle-copy">
              <strong>Mostrar botón Guardar contacto en mi página</strong>
              <small>Klicor generará una vCard simple con tus datos públicos si lo activas.</small>
            </span>
          </label>

          {contactCardEnabled ? (
            <div className="section-stack">
              <div className="profile-grid">
                <div>
                  <label className="label">Nombre del contacto</label>
                  <input
                    className="input"
                    value={contactCard.name}
                    onChange={(e) => setContactCard((current) => ({ ...current, name: e.target.value }))}
                    placeholder={form.businessName || "Tu negocio"}
                    disabled={!canEdit}
                  />
                  <p className="muted" style={{ marginTop: ".45rem" }}>Si lo dejas vacío, usamos el nombre del negocio.</p>
                </div>
                <div>
                  <label className="label">Cargo o rol</label>
                  <input
                    className="input"
                    value={contactCard.title}
                    onChange={(e) => setContactCard((current) => ({ ...current, title: e.target.value }))}
                    placeholder="Gerente, asesor, médico, fotógrafo..."
                    disabled={!canEdit}
                  />
                </div>
              </div>

              {whatsappLinks.length ? (
                <div>
                  <label className="label">WhatsApp para el contacto</label>
                  <select
                    className="select"
                    value={contactCard.whatsappLinkId}
                    onChange={(e) => setContactCard((current) => ({ ...current, whatsappLinkId: e.target.value }))}
                    disabled={!canEdit}
                  >
                    <option value="">Usar el primer WhatsApp disponible</option>
                    {whatsappLinks.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label} - {item.value}
                      </option>
                    ))}
                  </select>
                  <p className="muted" style={{ marginTop: ".45rem" }}>Ese número se guardará dentro del contacto.</p>
                </div>
              ) : (
                <div>
                  <label className="label">Teléfono del contacto</label>
                  <input
                    className="input"
                    value={contactCard.phone}
                    onChange={(e) => setContactCard((current) => ({ ...current, phone: e.target.value }))}
                    placeholder="+57 300 123 4567"
                    disabled={!canEdit}
                  />
                  <p className="muted" style={{ marginTop: ".45rem" }}>Como no tienes WhatsApp agregado, puedes escribir un número público manual.</p>
                </div>
              )}

              <div className="grid-3">
                <div className="kpi">
                  <strong>Correo del contacto</strong>
                  <p className="muted" style={{ marginTop: ".5rem" }}>{emailLink?.value || "Agrega un enlace de correo en Enlaces y cobros"}</p>
                </div>
                <div className="kpi">
                  <strong>Web del contacto</strong>
                  <p className="muted" style={{ marginTop: ".5rem" }}>{websiteLink?.value || "Usaremos tu página de Klicor si no agregas un sitio web"}</p>
                </div>
                <div className="kpi">
                  <strong>Estado</strong>
                  <p className="muted" style={{ marginTop: ".5rem" }}>
                    {contactCardPreview.shouldShow ? "El botón Guardar contacto ya quedaría listo en tu página." : "Completa los datos para que el contacto tenga al menos un canal útil."}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
              </div>
            </section>
          ) : null}

          {activeWorkspace === "design" ? (
            <section className="dashboard-section panel workspace-panel">
              <div className="dashboard-section-head workspace-panel-head">
                <div>
                  <h2 className="section-title" style={{ fontSize: "1.35rem" }}>Crear tema</h2>
                  <p className="section-copy">Crea, guarda y reutiliza el estilo visual de tu Klicor sin rehacerlo cada vez.</p>
                </div>
                <span className="status-badge">{appearance.advancedEnabled ? "Sin guardar" : "Tema activo"}</span>
              </div>

              <div className="section-stack">
                {availableThemes.some((theme) => theme.id === "generated-logo-theme") ? (
                  <div className="notice">
                    <span>Detectamos colores de tu logo y te dejamos un tema privado sugerido dentro de Temas.</span>
                  </div>
                ) : null}

                <div className={`panel accordion-section preset-accordion ${openDesignSection === "design-themes" ? "is-open" : ""}`}>
                  <button className="accordion-toggle" type="button" onClick={() => toggleDesignSection("design-themes")} aria-expanded={openDesignSection === "design-themes"}>
                    <span className="accordion-toggle-copy">
                      <strong className="section-title" style={{ fontSize: "1rem" }}>Temas</strong>
                      <span className="section-copy">Elige un tema listo para empezar más rápido.</span>
                    </span>
                    <span className="accordion-toggle-meta">
                      <span className="status-badge">{availableThemes.length} opciones</span>
                      {openDesignSection === "design-themes" ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </span>
                  </button>

                  {openDesignSection === "design-themes" ? (
                    <div className="accordion-content">
                      <div className="appearance-presets">
                        {availableThemes.map((preset) => (
                          <button
                            key={preset.id}
                            className={`appearance-preset ${appearance.presetId === preset.id ? "is-active" : ""}`}
                            type="button"
                            onClick={() => applyPreset(preset.id)}
                            style={{
                              "--preset-primary": preset.appearance.primaryColor,
                              "--preset-surface": preset.appearance.surfaceColor,
                              "--preset-text": preset.appearance.textPrimaryColor,
                            }}
                          >
                            <span className="preset-tone" />
                            <span className="preset-swatches">
                              <i style={{ background: preset.appearance.primaryColor }} />
                              <i style={{ background: preset.appearance.backgroundColor }} />
                              <i style={{ background: preset.appearance.surfaceColor }} />
                            </span>
                            <strong>{preset.name}</strong>
                            {preset.id === "generated-logo-theme" ? <small>Tema privado sugerido desde tu logo</small> : null}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className={`panel accordion-section preset-accordion ${openDesignSection === "design-fonts" ? "is-open" : ""}`}>
                  <button className="accordion-toggle" type="button" onClick={() => toggleDesignSection("design-fonts")} aria-expanded={openDesignSection === "design-fonts"}>
                    <span className="accordion-toggle-copy">
                      <strong className="section-title" style={{ fontSize: "1rem" }}>Fuentes</strong>
                      <span className="section-copy">Define el tono tipográfico de tu Klicor.</span>
                    </span>
                    <span className="accordion-toggle-meta">
                      <span className="status-badge">
                        {APPEARANCE_FONT_OPTIONS.find((option) => option.value === appearance.fontFamily)?.label || "Inter"}
                      </span>
                      {openDesignSection === "design-fonts" ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </span>
                  </button>

                  {openDesignSection === "design-fonts" ? (
                    <div className="accordion-content">
                      <FontPicker
                        value={appearance.fontFamily}
                        options={APPEARANCE_FONT_OPTIONS}
                        onChange={(value) => updateAppearance("fontFamily", value)}
                      />
                    </div>
                  ) : null}
                </div>

                <div className={`panel accordion-section preset-accordion ${openDesignSection === "design-social" ? "is-open" : ""}`}>
                  <button className="accordion-toggle" type="button" onClick={() => toggleDesignSection("design-social")} aria-expanded={openDesignSection === "design-social"}>
                    <span className="accordion-toggle-copy">
                      <strong className="section-title" style={{ fontSize: "1rem" }}>Iconos de redes</strong>
                      <span className="section-copy">Elige si prefieres tarjetas suaves o iconos de marca.</span>
                    </span>
                    <span className="accordion-toggle-meta">
                      <span className="status-badge">
                        {SOCIAL_STYLE_OPTIONS.find((option) => option.value === appearance.socialStyle)?.label || "Tarjeta"}
                      </span>
                      {openDesignSection === "design-social" ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </span>
                  </button>

                  {openDesignSection === "design-social" ? (
                    <div className="accordion-content">
                      <SegmentedControl
                        label="Estilo de iconos"
                        value={appearance.socialStyle}
                        options={SOCIAL_STYLE_OPTIONS}
                        onChange={(value) => updateAppearance("socialStyle", value)}
                      />
                    </div>
                  ) : null}
                </div>

                <div className={`panel accordion-section preset-accordion ${openDesignSection === "design-advanced" ? "is-open" : ""}`}>
                  <button className="accordion-toggle" type="button" onClick={() => toggleDesignSection("design-advanced")} aria-expanded={openDesignSection === "design-advanced"}>
                    <span className="accordion-toggle-copy">
                      <strong className="section-title" style={{ fontSize: "1rem" }}>Crear tema</strong>
                      <span className="section-copy">Ajusta colores, bordes y sombras, ponle nombre y guárdalo solo para tu negocio.</span>
                    </span>
                    <span className="accordion-toggle-meta">
                      <span className="status-badge">{appearance.advancedEnabled ? "Listo para guardar" : "Guiado"}</span>
                      {openDesignSection === "design-advanced" ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </span>
                  </button>

                  {openDesignSection === "design-advanced" ? (
                    <div className="accordion-content section-stack">
                      <div className="theme-save-card">
                        <div>
                          <strong>Guardar como tema propio</strong>
                          <p className="section-copy">Esto crea una versión nueva. No modifica los temas sugeridos ni los temas que ya guardaste.</p>
                        </div>
                        <div className="theme-save-actions">
                          <input
                            className="input"
                            value={themeDraftName}
                            onChange={(event) => setThemeDraftName(event.target.value)}
                            placeholder="Ej. Tema principal de mi negocio"
                            disabled={!canEdit}
                          />
                          <button className="btn btn-primary" type="button" onClick={saveCurrentTheme} disabled={!canEdit || loading || appearanceWarnings.length > 0}>
                            {loading ? "Guardando..." : "Crear tema"}
                          </button>
                        </div>
                      </div>
                      <div className="appearance-grid appearance-grid-colors">
                        <ColorEditor label="Color principal" value={appearance.primaryColor} onChange={(value) => updateAppearance("primaryColor", value)} swatches={APPEARANCE_SWATCHES.primaryColor} />
                        <ColorEditor label="Prioridad 2" value={appearance.secondaryColor} onChange={(value) => updateAppearance("secondaryColor", value)} swatches={APPEARANCE_SWATCHES.secondaryColor} />
                        <ColorEditor label="Prioridad 3" value={appearance.tertiaryColor} onChange={(value) => updateAppearance("tertiaryColor", value)} swatches={APPEARANCE_SWATCHES.tertiaryColor} />
                        <ColorEditor label="Color de fondo" value={appearance.backgroundColor} onChange={(value) => updateAppearance("backgroundColor", value)} swatches={APPEARANCE_SWATCHES.backgroundColor} />
                        <ColorEditor label="Color de tarjetas" value={appearance.surfaceColor} onChange={(value) => updateAppearance("surfaceColor", value)} swatches={APPEARANCE_SWATCHES.surfaceColor} />
                        <ColorEditor label="Texto principal" value={appearance.textPrimaryColor} onChange={(value) => updateAppearance("textPrimaryColor", value)} swatches={APPEARANCE_SWATCHES.textPrimaryColor} />
                        <ColorEditor label="Texto botón principal" value={appearance.buttonPrimaryTextColor} onChange={(value) => updateAppearance("buttonPrimaryTextColor", value)} swatches={APPEARANCE_SWATCHES.buttonPrimaryTextColor} />
                        <ColorEditor label="Texto botón prioridad 2" value={appearance.buttonSecondaryTextColor} onChange={(value) => updateAppearance("buttonSecondaryTextColor", value)} swatches={APPEARANCE_SWATCHES.buttonSecondaryTextColor} />
                        <ColorEditor label="Texto botón prioridad 3" value={appearance.buttonTertiaryTextColor} onChange={(value) => updateAppearance("buttonTertiaryTextColor", value)} swatches={APPEARANCE_SWATCHES.buttonTertiaryTextColor} />
                      </div>

                      <div className="appearance-grid">
                        <SegmentedControl label="Botón" value={appearance.buttonStyle} options={[{ label: "Sólido", value: "solid" }, { label: "Contorno", value: "outline" }, { label: "Suave", value: "soft" }]} onChange={(value) => updateAppearance("buttonStyle", value)} />
                        <SegmentedControl label="Borde del botón" value={appearance.buttonRadius} options={[{ label: "Redondeado", value: "rounded" }, { label: "Más recto", value: "square" }]} onChange={(value) => updateAppearance("buttonRadius", value)} />
                        <SegmentedControl label="Tarjeta" value={appearance.cardTransparency} options={[{ label: "Sólida", value: "solid" }, { label: "Transparencia leve", value: "soft" }]} onChange={(value) => updateAppearance("cardTransparency", value)} />
                        <SegmentedControl label="Sombra" value={appearance.cardShadow} options={[{ label: "Ninguna", value: "none" }, { label: "Suave", value: "soft" }, { label: "Media", value: "medium" }]} onChange={(value) => updateAppearance("cardShadow", value)} />
                        <SegmentedControl label="Forma de imagen" value={appearance.avatarShape} options={[{ label: "Circular", value: "circle" }, { label: "Redondeada", value: "rounded" }, { label: "Cuadrado suave", value: "soft-square" }]} onChange={(value) => updateAppearance("avatarShape", value)} />
                        <SegmentedControl label="Tamaño del nombre" value={appearance.nameSize} options={[{ label: "S", value: "s" }, { label: "M", value: "m" }, { label: "L", value: "l" }]} onChange={(value) => updateAppearance("nameSize", value)} />
                        <SegmentedControl label="Peso del nombre" value={appearance.nameWeight} options={[{ label: "Regular", value: "regular" }, { label: "Negrita", value: "bold" }]} onChange={(value) => updateAppearance("nameWeight", value)} />
                      </div>
                    </div>
                  ) : null}
                </div>

                {appearanceWarnings.length ? (
                  <div className="notice notice-danger">
                    <span>{appearanceWarnings[0].message}</span>
                  </div>
                ) : null}

                {!appearanceWarnings.length && appearanceSuggestions.length ? (
                  <div className="notice">
                    <span>{appearanceSuggestions[0].message}</span>
                  </div>
                ) : null}

                <div className="actions">
                  <button className="btn btn-secondary" type="button" onClick={resetAppearance}>
                    <RotateCcw size={16} /> Restablecer
                  </button>
                </div>
              </div>
            </section>
          ) : null}
        {!["commerce", "booking", "reservations"].includes(activeWorkspace) ? (
          <>
            <div className="actions editor-form-footer">
              <button className="btn btn-primary" type="submit" disabled={loading || !canEdit || appearanceWarnings.length > 0}>
                {loading ? <RefreshCw size={16} /> : null}
                Guardar cambios
              </button>
            </div>

            {message ? <p className="notice">{message}</p> : null}
          </>
        ) : null}
      </form>
    </div>
    </div>
  );
}

