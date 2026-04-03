"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  CreditCard,
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Link2,
  MonitorSmartphone,
  Paintbrush,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  UploadCloud,
  Mail,
  Phone,
  Send,
  ShieldCheck,
} from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import { BUSINESS_CATEGORY_OPTIONS, normalizeBusinessCategory } from "@/lib/business-categories";
import { COLOMBIA_DEPARTMENT_OPTIONS, getCitiesForDepartment, resolveCityName, resolveDepartmentName } from "@/lib/colombia-locations";
import { resolveContactCardData } from "@/lib/contact-card";
import { canAddLinkType, getLinkTypeCount, getLinkTypeLimit, LINK_CATALOG, LINK_CATALOG_MAP } from "@/lib/link-catalog";
import { APPEARANCE_DEFAULTS, APPEARANCE_PRESETS, APPEARANCE_SWATCHES, getAppearanceSuggestions, getAppearanceWarnings, normalizeAppearance } from "@/lib/theme-system";

const LandingView = dynamic(
  () => import("@/components/landing-view").then((mod) => mod.LandingView),
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

function normalizeLinks(profile) {
  if (Array.isArray(profile?.profileLinks) && profile.profileLinks.length) {
    return profile.profileLinks.map((item) => ({
      id: item.id,
      type: item.type,
      label: item.label,
      value: item.value,
      message: item.message || "",
    }));
  }

  const legacy = profile?.links || {};
  return Object.entries(legacy)
    .filter(([, value]) => value)
    .map(([type, value], index) => ({
      id: `${type}-${index}`,
      type,
      label: LINK_CATALOG_MAP[type]?.label || "Enlace",
      value,
      message: type === "whatsapp" ? "Hola, quiero información" : "",
    }));
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

const WORKSPACE_TABS = [
  { id: "blocks", label: "Bloques", icon: Link2 },
  { id: "design", label: "Diseño", icon: Paintbrush },
  { id: "settings", label: "Ajustes", icon: ShieldCheck },
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
}) {
  const [form, setForm] = useState({
    businessName: profile?.businessName || "",
    username: profile?.username || "",
    businessCategory: normalizeBusinessCategory(profile?.businessCategory),
    businessHeadline: profile?.businessHeadline || "",
    businessSubheadline: profile?.businessSubheadline || "",
  });
  const [profileLinks, setProfileLinks] = useState(normalizeLinks(profile));
  const [appearance, setAppearance] = useState(normalizeAppearance(profile?.settings || APPEARANCE_DEFAULTS));
  const [photo, setPhoto] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [paymentQrImage, setPaymentQrImage] = useState(null);
  const [paymentQrPreviewUrl, setPaymentQrPreviewUrl] = useState("");
  const [contactCard, setContactCard] = useState(normalizeContactCard(profile));
  const [billingProfile, setBillingProfile] = useState(normalizeBillingProfile(profile));
  const [message, setMessage] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState("whatsapp");
  const [activeWorkspace, setActiveWorkspace] = useState("blocks");
  const [openProfileSection, setOpenProfileSection] = useState(null);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const savedPaymentQrUrl = profile?.paymentQrUrl && profile?.username ? `/${profile.username}/payment-qr` : profile?.paymentQrUrl || "";

  useEffect(() => {
    setForm({
      businessName: profile?.businessName || "",
      username: profile?.username || "",
      businessCategory: normalizeBusinessCategory(profile?.businessCategory),
      businessHeadline: profile?.businessHeadline || "",
      businessSubheadline: profile?.businessSubheadline || "",
    });
    setProfileLinks(normalizeLinks(profile));
    setAppearance(normalizeAppearance(profile?.settings || APPEARANCE_DEFAULTS));
    setPhoto(null);
    setPaymentQrImage(null);
    setContactCard(normalizeContactCard(profile));
    setBillingProfile(normalizeBillingProfile(profile));
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
    if (!paymentQrImage) {
      setPaymentQrPreviewUrl("");
      return;
    }

    const nextUrl = URL.createObjectURL(paymentQrImage);
    setPaymentQrPreviewUrl(nextUrl);

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [paymentQrImage]);

  const previewUser = useMemo(() => ({
    publicLinkId: profile?.publicLinkId || "",
    businessName: form.businessName || "Tu negocio",
    username: form.username || "tu-usuario",
    businessCategory: form.businessCategory,
    businessHeadline: form.businessHeadline,
    businessSubheadline: form.businessSubheadline,
    photo: photoPreviewUrl || profile?.photo || "",
    paymentQrUrl: paymentQrPreviewUrl || savedPaymentQrUrl,
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
  }), [appearance, contactCard.enabled, contactCard.name, contactCard.phone, contactCard.title, contactCard.whatsappLinkId, form.businessCategory, form.businessHeadline, form.businessName, form.businessSubheadline, form.username, paymentQrPreviewUrl, photoPreviewUrl, profile?.photo, profile?.publicLinkId, profileLinks, savedPaymentQrUrl]);

  const appearanceWarnings = useMemo(() => getAppearanceWarnings(appearance), [appearance]);
  const appearanceSuggestions = useMemo(() => getAppearanceSuggestions(appearance), [appearance]);
  const selectedTypeLimit = getLinkTypeLimit(selectedType);
  const selectedTypeCount = getLinkTypeCount(profileLinks, selectedType);
  const selectedTypeAvailable = canAddLinkType(profileLinks, selectedType);
  const whatsappLinks = useMemo(() => profileLinks.filter((item) => item.type === "whatsapp" && item.value?.trim()), [profileLinks]);
  const emailLink = useMemo(() => profileLinks.find((item) => item.type === "email" && item.value?.trim()), [profileLinks]);
  const websiteLink = useMemo(() => profileLinks.find((item) => item.type === "website" && item.value?.trim()), [profileLinks]);
  const contactCardPreview = useMemo(() => resolveContactCardData(previewUser), [previewUser]);

  useEffect(() => {
    if (!contactCard.whatsappLinkId) return;
    if (whatsappLinks.some((item) => item.id === contactCard.whatsappLinkId)) return;
    setContactCard((current) => ({ ...current, whatsappLinkId: "" }));
  }, [contactCard.whatsappLinkId, whatsappLinks]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canEdit) {
      setAlertMessage("Tu cuenta no permite edición en este momento.");
      return;
    }

    if (appearanceWarnings.length) {
      setAlertMessage(appearanceWarnings[0].message);
      return;
    }

    setLoading(true);
    setMessage("");
    setAlertMessage("");
    try {
      const body = new FormData();
      body.append("businessName", form.businessName);
      body.append("username", form.username);
      body.append("businessCategory", form.businessCategory);
      body.append("businessHeadline", form.businessHeadline);
      body.append("businessSubheadline", form.businessSubheadline);
      body.append("profileLinks", JSON.stringify(profileLinks));
      body.append("appearance", JSON.stringify(appearance));
      body.append("contactCard", JSON.stringify(contactCard));
      body.append("billingProfile", JSON.stringify(billingProfile));
      if (photo) body.append("photo", photo);
      if (paymentQrImage) body.append("paymentQrImage", paymentQrImage);

      const data = await apiFetch("/api/profile", {
        method: "POST",
        token,
        body,
        isFormData: true,
      });

      onSaved(data.user);
      setMessage("Cambios guardados correctamente.");
    } catch (error) {
      setAlertMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleProfileSection(sectionId) {
    setOpenProfileSection((current) => (current === sectionId ? null : sectionId));
  }

  function addLink() {
    const meta = LINK_CATALOG_MAP[selectedType];
    if (!selectedTypeAvailable) {
      setAlertMessage(
        selectedType === "whatsapp"
          ? "Solo puedes agregar hasta 2 enlaces de WhatsApp."
          : `Solo puedes agregar 1 enlace de ${meta.label}.`,
      );
      return;
    }

    setProfileLinks((current) => [
      ...current,
      {
        id: `${selectedType}-${Date.now()}`,
        type: selectedType,
        label: meta.label,
        value: "",
        message: selectedType === "whatsapp" ? "Hola, quiero información" : "",
      },
    ]);
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

  function applyPreset(presetId) {
    const preset = APPEARANCE_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    setAppearance({
      presetId: preset.id,
      advancedEnabled: false,
      ...preset.appearance,
    });
  }

  function updateAppearance(field, value) {
    setAppearance((current) => normalizeAppearance({
      ...current,
      advancedEnabled: true,
      [field]: value,
    }));
  }

  function resetAppearance() {
    const targetPreset = APPEARANCE_PRESETS.find((item) => item.id === appearance.presetId) || APPEARANCE_PRESETS[0];
    setAppearance({
      presetId: targetPreset.id,
      advancedEnabled: false,
      ...targetPreset.appearance,
    });
  }

  const selectedPhotoLabel = photo ? photo.name : profile?.photo ? "Imagen actual cargada" : "Aún no has elegido imagen";
  const selectedPaymentQrLabel = paymentQrImage
    ? paymentQrImage.name
    : profile?.paymentQrUrl
      ? "QR oficial cargado"
      : "Aún no has cargado un QR oficial";
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
  const subscriptionTone = getSubscriptionTone(profile?.status);
  const subscriptionLabel = getSubscriptionLabel(profile?.status);
  const subscriptionMessage = getSubscriptionMessage(profile?.status);
  const annualPriceLabel = Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(subscriptionSettings?.annualPrice || 0);
  const subscriptionActionLabel = paying
    ? "Abriendo pago..."
    : profile?.status === "active"
      ? "Renovar plan"
      : "Activar plan";

  return (
    <div className="editor-layout">
      {alertMessage ? (
        <div className="dashboard-alert-backdrop" role="alertdialog" aria-modal="true" aria-label="Alerta del editor">
          <div className="dashboard-alert-card">
            <div className="dashboard-alert-icon">
              <AlertTriangle size={20} />
            </div>
            <div className="dashboard-alert-copy">
              <strong>Revisa este enlace</strong>
              <p>{alertMessage}</p>
            </div>
            <button className="btn btn-primary" type="button" onClick={() => setAlertMessage("")}>
              Entendido
            </button>
          </div>
        </div>
      ) : null}
      <aside className="preview-shell preview-shell-editor">
        <div className="preview-header preview-header-editor">
          <div className="stack" style={{ gap: ".45rem" }}>
            <span className="pill"><MonitorSmartphone size={16} /> Vista previa</span>
            <h3 className="section-title" style={{ fontSize: "1.1rem" }}>Así se verá tu Klicor</h3>
            <p className="section-copy">Edita a la derecha y revisa aquí cómo cambia tu página pública en tiempo real.</p>
          </div>
        </div>
        <div className="preview-frame">
          <LandingView user={previewUser} preview />
        </div>
      </aside>

      <div className="editor-panel">
        <div className="editor-tabs" role="tablist" aria-label="Navegación del editor">
          {WORKSPACE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeWorkspace === tab.id;
            return (
              <button
                key={tab.id}
                className={`editor-tab ${isActive ? "is-active" : ""}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveWorkspace(tab.id)}
              >
                <Icon size={17} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <form className="section-stack editor-panel-form" onSubmit={handleSubmit}>
          {activeWorkspace === "settings" ? (
            <section className="dashboard-section panel workspace-panel">
              <div className="dashboard-section-head workspace-panel-head">
                <div>
                  <h2 className="section-title" style={{ fontSize: "1.35rem" }}>Ajustes del negocio</h2>
                  <p className="section-copy">Actualiza identidad, seguridad, facturación y estado operativo de la cuenta.</p>
                </div>
                <span className={`status-badge ${recoveryProtected ? "success" : ""}`}>{recoveryProtected ? "Protegida" : "Pendiente"}</span>
              </div>

              <div className="section-stack accordion-subsections">
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
                    onChange={(e) => setForm({ ...form, businessCategory: e.target.value })}
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
                  <label className="label">Título comercial</label>
                  <input
                    className="input"
                    value={form.businessHeadline}
                    onChange={(e) => setForm({ ...form, businessHeadline: e.target.value })}
                    placeholder="Ejemplo: Pedidos, menú y atención en un solo link y un QR"
                    disabled={!canEdit}
                  />
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

            <AccordionSection
              id="profile-billing"
              title="Información del negocio para facturación"
              copy="Datos privados para ayudarte a emitir la factura electrónica manualmente."
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
                <span>Estos datos no se muestran en tu página pública. Son solo de apoyo interno para facturación manual.</span>
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
                    placeholder="facturacion@tuempresa.com"
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
                  <label className="label">Responsabilidad</label>
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

              <div className="actions">
                <button className="btn btn-primary" type="button" onClick={onCheckout} disabled={paying || !userEmailVerified}>
                  <CreditCard size={16} /> {subscriptionActionLabel}
                </button>
              </div>

              {checkoutConfig ? (
                <div className="stack" style={{ gap: ".85rem" }}>
                  <p className="muted">El proceso oficial de pago de Mercado Pago ya está listo. Si el widget no responde, puedes continuar por redirección.</p>
                  <div id="mercadopago-checkout" />
                  <button className="btn btn-secondary" type="button" onClick={() => { window.location.href = checkoutConfig.initPoint; }}>
                    Abrir pago por redirección
                  </button>
                </div>
              ) : null}
            </AccordionSection>
          </div>
            </section>
          ) : null}

          {activeWorkspace === "blocks" ? (
            <section className="dashboard-section panel workspace-panel">
              <div className="dashboard-section-head workspace-panel-head">
                <div>
                  <h2 className="section-title" style={{ fontSize: "1.35rem" }}>Bloques y cobros</h2>
                  <p className="section-copy">Organiza botones, canales visibles, llave Bre-B y el bloque para guardar contacto.</p>
                </div>
                <span className="status-badge">{profileLinks.length} enlaces</span>
              </div>

              <div className="section-stack">
          <div className="link-toolbar">
            <select className="select" value={selectedType} onChange={(e) => setSelectedType(e.target.value)} disabled={!canEdit}>
              {LINK_CATALOG.map((item) => (
                <option key={item.type} value={item.type}>
                  {item.label}
                  {getLinkTypeCount(profileLinks, item.type) >= getLinkTypeLimit(item.type) ? " - limite alcanzado" : ""}
                </option>
              ))}
            </select>
            <button className="btn btn-secondary" type="button" onClick={addLink} disabled={!canEdit || !selectedTypeAvailable}>
              <Plus size={16} /> Agregar enlace
            </button>
          </div>

          <p className="muted">
            {selectedType === "payment_key"
              ? "Usa este tipo para mostrar una llave de pago con botones para copiar y ver el QR en tu página."
              : null}
            {selectedType === "payment_key" ? " " : ""}
            {selectedType === "whatsapp"
              ? `WhatsApp permite hasta ${selectedTypeLimit} enlaces. Ya tienes ${selectedTypeCount}.`
              : `${LINK_CATALOG_MAP[selectedType]?.label || "Esta red"} permite solo ${selectedTypeLimit} enlace. Ya tienes ${selectedTypeCount}.`}
          </p>

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
                  <button className="btn btn-secondary link-remove" type="button" onClick={() => removeLink(item.id)} disabled={!canEdit}>
                    <Trash2 size={16} />
                  </button>
                  {item.type === "whatsapp" ? (
                    <div className="link-row-message">
                      <label className="label">Mensaje inicial</label>
                      <input className="input" value={item.message || ""} placeholder="Hola, quiero información" onChange={(e) => updateLink(item.id, "message", e.target.value)} disabled={!canEdit} />
                    </div>
                  ) : null}
                  {item.type === "payment_key" ? (
                    <div className="link-row-message payment-key-upload">
                      <label className="label">QR oficial del banco o billetera</label>
                      <label className={`upload-card ${!canEdit ? "upload-card-disabled" : ""}`}>
                        <input
                          className="upload-input"
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(e) => setPaymentQrImage(e.target.files?.[0] || null)}
                          disabled={!canEdit}
                        />
                        <span className="upload-icon">{paymentQrImage || profile?.paymentQrUrl ? <ImagePlus size={20} /> : <UploadCloud size={20} />}</span>
                        <span className="upload-copy">
                          <strong>{paymentQrImage ? "Cambiar QR oficial" : "Subir QR oficial"}</strong>
                          <span>{selectedPaymentQrLabel}</span>
                          <small>Sube la imagen oficial generada en Nequi, Daviplata o tu banco</small>
                        </span>
                      </label>
                      <p className="muted payment-key-upload-copy">
                        Este QR no lo genera Klicor. Si cambias la llave, guarda una nueva imagen oficial del QR.
                      </p>
                      {paymentQrPreviewUrl || savedPaymentQrUrl ? (
                        <div className="payment-qr-preview">
                          <img src={paymentQrPreviewUrl || savedPaymentQrUrl} alt="QR oficial de pago" />
                        </div>
                      ) : null}
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
                  <h2 className="section-title" style={{ fontSize: "1.35rem" }}>Diseño de la página</h2>
                  <p className="section-copy">Elige un tema y luego ajusta colores, botones y personalidad visual del perfil.</p>
                </div>
                <span className="status-badge">{appearance.advancedEnabled ? "Avanzado" : "Tema"}</span>
              </div>

              <div className="section-stack">
          <div className="dashboard-section-head">
            <div>
              <h3 className="section-title" style={{ fontSize: "1.05rem" }}>Diseño de la página</h3>
              <p className="section-copy">Mantenemos el estilo guiado para que tu Klicor se vea clara y legible.</p>
            </div>
            <button
              className={`btn ${appearance.advancedEnabled ? "btn-primary" : "btn-secondary"}`}
              type="button"
              onClick={() => setAppearance((current) => ({ ...current, advancedEnabled: !current.advancedEnabled }))}
            >
              <Paintbrush size={16} /> Personalizar diseño
            </button>
          </div>

          <div className={`panel accordion-section preset-accordion ${presetsOpen ? "is-open" : ""}`}>
            <button className="accordion-toggle" type="button" onClick={() => setPresetsOpen((current) => !current)} aria-expanded={presetsOpen}>
              <span className="accordion-toggle-copy">
                <strong className="section-title" style={{ fontSize: "1rem" }}>Temas</strong>
                <span className="section-copy">Elige un tema listo para empezar más rápido.</span>
              </span>
              <span className="accordion-toggle-meta">
                <span className="status-badge">{APPEARANCE_PRESETS.length} opciones</span>
                {presetsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </span>
            </button>

            {presetsOpen ? (
              <div className="accordion-content">
                <div className="appearance-presets">
                  {APPEARANCE_PRESETS.map((preset) => (
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
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {appearance.advancedEnabled ? (
            <div className="section-stack">
              <div className="appearance-grid appearance-grid-colors">
                <ColorEditor label="Color principal" value={appearance.primaryColor} onChange={(value) => updateAppearance("primaryColor", value)} swatches={APPEARANCE_SWATCHES.primaryColor} />
                <ColorEditor label="Color de fondo" value={appearance.backgroundColor} onChange={(value) => updateAppearance("backgroundColor", value)} swatches={APPEARANCE_SWATCHES.backgroundColor} />
                <ColorEditor label="Color de tarjetas" value={appearance.surfaceColor} onChange={(value) => updateAppearance("surfaceColor", value)} swatches={APPEARANCE_SWATCHES.surfaceColor} />
                <ColorEditor label="Texto principal" value={appearance.textPrimaryColor} onChange={(value) => updateAppearance("textPrimaryColor", value)} swatches={APPEARANCE_SWATCHES.textPrimaryColor} />
                <ColorEditor label="Texto de botones" value={appearance.buttonTextColor} onChange={(value) => updateAppearance("buttonTextColor", value)} swatches={APPEARANCE_SWATCHES.buttonTextColor} />
              </div>

              <div className="appearance-grid">
                <SegmentedControl label="Fondo" value={appearance.backgroundStyle} options={[{ label: "Sólido", value: "solid" }, { label: "Degradado", value: "gradient" }]} onChange={(value) => updateAppearance("backgroundStyle", value)} />
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

        <div className="actions editor-form-footer">
          <button className="btn btn-primary" type="submit" disabled={loading || !canEdit || appearanceWarnings.length > 0}>
            {loading ? <RefreshCw size={16} /> : null}
            Guardar cambios
          </button>
        </div>

        {message ? <p className="notice">{message}</p> : null}
      </form>
    </div>
    </div>
  );
}

