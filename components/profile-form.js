"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ImagePlus,
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
import { canAddLinkType, getLinkTypeCount, getLinkTypeLimit, LINK_CATALOG, LINK_CATALOG_MAP } from "@/lib/link-catalog";
import { LandingView } from "@/components/landing-view";
import { APPEARANCE_DEFAULTS, APPEARANCE_PRESETS, APPEARANCE_SWATCHES, getAppearanceSuggestions, getAppearanceWarnings, normalizeAppearance } from "@/lib/theme-system";

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
      message: type === "whatsapp" ? "Hola, quiero informacion" : "",
    }));
}

function normalizeLinkUrl(item) {
  const raw = String(item.value || "").trim();
  if (!raw) return "";

  const meta = LINK_CATALOG_MAP[item.type];
  if (meta?.kind === "phone") {
    const digits = raw.replace(/\D/g, "");
    const message = (item.message || "Hola, quiero informacion").trim();
    return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : "";
  }

  if (meta?.kind === "text") {
    return "";
  }

  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

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

function AccordionSection({ id, title, copy, openSection, onToggle, children, trailing }) {
  const isOpen = openSection === id;

  return (
    <section className={`dashboard-section panel accordion-section ${isOpen ? "is-open" : ""}`}>
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
      {isOpen ? <div className="accordion-content">{children}</div> : null}
    </section>
  );
}

export function ProfileForm({
  token,
  profile,
  onSaved,
  canEdit,
  recovery,
  recoveryLoading,
  recoveryMessage,
  onRecoveryFieldChange,
  onSaveRecovery,
  onResendRecoveryVerification,
}) {
  const [form, setForm] = useState({
    businessName: profile?.businessName || "",
    username: profile?.username || "",
  });
  const [profileLinks, setProfileLinks] = useState(normalizeLinks(profile));
  const [appearance, setAppearance] = useState(normalizeAppearance(profile?.settings || APPEARANCE_DEFAULTS));
  const [photo, setPhoto] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [paymentQrImage, setPaymentQrImage] = useState(null);
  const [paymentQrPreviewUrl, setPaymentQrPreviewUrl] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState("whatsapp");
  const [openSection, setOpenSection] = useState(null);
  const [presetsOpen, setPresetsOpen] = useState(false);

  useEffect(() => {
    setForm({
      businessName: profile?.businessName || "",
      username: profile?.username || "",
    });
    setProfileLinks(normalizeLinks(profile));
    setAppearance(normalizeAppearance(profile?.settings || APPEARANCE_DEFAULTS));
    setPhoto(null);
    setPaymentQrImage(null);
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
    businessName: form.businessName || "Tu negocio",
    username: form.username || "tu-usuario",
    photo: photoPreviewUrl || profile?.photo || "",
    paymentQrUrl: paymentQrPreviewUrl || profile?.paymentQrUrl || "",
    settings: appearance,
    profileLinks: profileLinks
      .filter((item) => item.value?.trim())
      .map((item) => ({
        ...item,
        url: normalizeLinkUrl(item),
      })),
  }), [appearance, form.businessName, form.username, paymentQrPreviewUrl, photoPreviewUrl, profile?.paymentQrUrl, profile?.photo, profileLinks]);

  const appearanceWarnings = useMemo(() => getAppearanceWarnings(appearance), [appearance]);
  const appearanceSuggestions = useMemo(() => getAppearanceSuggestions(appearance), [appearance]);
  const selectedTypeLimit = getLinkTypeLimit(selectedType);
  const selectedTypeCount = getLinkTypeCount(profileLinks, selectedType);
  const selectedTypeAvailable = canAddLinkType(profileLinks, selectedType);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canEdit) {
      setMessage("Tu cuenta no permite edicion en este momento.");
      return;
    }

    if (appearanceWarnings.length) {
      setMessage(appearanceWarnings[0].message);
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const body = new FormData();
      body.append("businessName", form.businessName);
      body.append("username", form.username);
      body.append("profileLinks", JSON.stringify(profileLinks));
      body.append("appearance", JSON.stringify(appearance));
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
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleSection(sectionId) {
    setOpenSection((current) => (current === sectionId ? null : sectionId));
  }

  function addLink() {
    const meta = LINK_CATALOG_MAP[selectedType];
    if (!selectedTypeAvailable) {
      setMessage(
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
        message: selectedType === "whatsapp" ? "Hola, quiero informacion" : "",
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

  const selectedPhotoLabel = photo ? photo.name : profile?.photo ? "Imagen actual cargada" : "Aun no has elegido imagen";
  const selectedPaymentQrLabel = paymentQrImage
    ? paymentQrImage.name
    : profile?.paymentQrUrl
      ? "QR oficial cargado"
      : "Aun no has cargado un QR oficial";
  const usernameChanged = Boolean(profile?.username) && form.username.trim() && form.username.trim() !== profile.username;
  const recoveryProtected = Boolean(recovery?.backupEmailVerified);

  return (
    <div className="editor-layout">
      <form className="section-stack" onSubmit={handleSubmit}>
        <AccordionSection
          id="profile"
          title="Perfil"
          copy="Actualiza nombre, username, imagen y seguridad de la cuenta."
          openSection={openSection}
          onToggle={toggleSection}
          trailing={<span className={`status-badge ${recoveryProtected ? "success" : ""}`}>{recoveryProtected ? "Protegida" : "Pendiente"}</span>}
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
              <label className="label">Username</label>
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

          {usernameChanged ? (
            <div className="notice">
              <span>Al guardar, tu URL visible se actualiza al nuevo username. Los enlaces anteriores y el QR siguen resolviendo a tu perfil.</span>
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

          <div className="section-divider" />

          <div className="dashboard-section-head">
            <div>
              <h3 className="section-title" style={{ fontSize: "1.05rem" }}>Seguridad y recuperacion</h3>
              <p className="section-copy">Protege tu QR y tu enlace con un correo de respaldo y un telefono de recuperacion.</p>
            </div>
            <span className={`status-badge ${recoveryProtected ? "success" : ""}`}>
              {recoveryProtected ? <ShieldCheck size={14} /> : null}
              {recoveryProtected ? "Protegida" : "Pendiente"}
            </span>
          </div>

          <div className="grid-3">
            <div className="kpi">
              <strong>Correo de respaldo</strong>
              <p className="muted" style={{ marginTop: ".5rem" }}>{recovery?.backupEmail || "Aun no configurado"}</p>
              <p className="muted" style={{ marginTop: ".35rem" }}>{recovery?.backupEmailVerified ? "Verificado" : "Pendiente de verificacion"}</p>
            </div>
            <div className="kpi">
              <strong>Telefono de recuperacion</strong>
              <p className="muted" style={{ marginTop: ".5rem" }}>{recovery?.recoveryPhone || "Aun no configurado"}</p>
              <p className="muted" style={{ marginTop: ".35rem" }}>{recovery?.recoveryPhoneVerified ? "Verificado" : "Guardado para siguiente fase OTP"}</p>
            </div>
            <div className="kpi">
              <strong>Estado</strong>
              <p className="muted" style={{ marginTop: ".5rem" }}>
                {recoveryProtected ? "Tu cuenta ya tiene un metodo de recuperacion verificado." : "Configura y verifica al menos un correo de respaldo."}
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
              <label className="label">Telefono de recuperacion</label>
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
                Verifica el correo de respaldo para usarlo en recuperacion.
                {recovery?.backupEmailVerificationExpiresAt ? " El enlace actual vence pronto." : ""}
              </span>
            </div>
          ) : null}

          <div className="actions">
            <button className="btn btn-secondary" type="button" onClick={onSaveRecovery} disabled={recoveryLoading}>
              {recoveryLoading ? <RefreshCw size={16} /> : <Mail size={16} />}
              {recoveryLoading ? "Guardando..." : "Guardar recuperacion"}
            </button>
            {recovery?.backupEmail && !recovery?.backupEmailVerified ? (
              <button className="btn btn-secondary" type="button" onClick={onResendRecoveryVerification} disabled={recoveryLoading}>
                <Send size={16} /> Reenviar verificacion
              </button>
            ) : null}
          </div>

          {recoveryMessage ? <p className="notice">{recoveryMessage}</p> : null}
        </AccordionSection>

        <AccordionSection
          id="links"
          title="Enlaces"
          copy="Agrega y ordena los canales principales de tu negocio."
          openSection={openSection}
          onToggle={toggleSection}
          trailing={<span className="status-badge">{profileLinks.length} enlaces</span>}
        >
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
              ? "Usa este tipo para mostrar una llave de pago con botones de copiar y ver QR en la landing."
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
                      {meta.kind === "phone" ? "Numero" : meta.kind === "text" ? "Llave" : "URL"}
                    </label>
                    <input className="input" value={item.value} placeholder={meta.placeholder} onChange={(e) => updateLink(item.id, "value", e.target.value)} disabled={!canEdit} />
                  </div>
                  <button className="btn btn-secondary link-remove" type="button" onClick={() => removeLink(item.id)} disabled={!canEdit}>
                    <Trash2 size={16} />
                  </button>
                  {item.type === "whatsapp" ? (
                    <div className="link-row-message">
                      <label className="label">Mensaje inicial</label>
                      <input className="input" value={item.message || ""} placeholder="Hola, quiero informacion" onChange={(e) => updateLink(item.id, "message", e.target.value)} disabled={!canEdit} />
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
                        Este QR no lo genera Linka. Si cambias la llave, guarda una nueva imagen oficial del QR.
                      </p>
                      {paymentQrPreviewUrl || profile?.paymentQrUrl ? (
                        <div className="payment-qr-preview">
                          <img src={paymentQrPreviewUrl || profile?.paymentQrUrl} alt="QR oficial de pago" />
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            }) : (
              <div className="kpi">
                <strong>Sin enlaces todavia</strong>
                <p className="muted" style={{ marginTop: ".5rem" }}>Agrega tu primer canal para empezar a construir tu pagina publica.</p>
              </div>
            )}
          </div>
        </AccordionSection>

        <AccordionSection
          id="appearance"
          title="Apariencia"
          copy="Usa un preset o abre el modo avanzado para personalizar con control."
          openSection={openSection}
          onToggle={toggleSection}
          trailing={<span className="status-badge">{appearance.advancedEnabled ? "Avanzado" : "Preset"}</span>}
        >
          <div className="dashboard-section-head">
            <div>
              <h3 className="section-title" style={{ fontSize: "1.05rem" }}>Diseño de la landing</h3>
              <p className="section-copy">Mantenemos el estilo guiado para que tu Linka se vea limpia y legible.</p>
            </div>
            <button
              className={`btn ${appearance.advancedEnabled ? "btn-primary" : "btn-secondary"}`}
              type="button"
              onClick={() => setAppearance((current) => ({ ...current, advancedEnabled: !current.advancedEnabled }))}
            >
              <Paintbrush size={16} /> Personalizar diseno
            </button>
          </div>

          <div className={`panel accordion-section preset-accordion ${presetsOpen ? "is-open" : ""}`}>
            <button className="accordion-toggle" type="button" onClick={() => setPresetsOpen((current) => !current)} aria-expanded={presetsOpen}>
              <span className="accordion-toggle-copy">
                <strong className="section-title" style={{ fontSize: "1rem" }}>Presets visuales</strong>
                <span className="section-copy">Elige una combinacion lista para empezar mas rapido.</span>
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
              <div className="appearance-grid">
                <ColorEditor label="Color principal" value={appearance.primaryColor} onChange={(value) => updateAppearance("primaryColor", value)} swatches={APPEARANCE_SWATCHES.primaryColor} />
                <ColorEditor label="Color de fondo" value={appearance.backgroundColor} onChange={(value) => updateAppearance("backgroundColor", value)} swatches={APPEARANCE_SWATCHES.backgroundColor} />
                <ColorEditor label="Color de tarjetas" value={appearance.surfaceColor} onChange={(value) => updateAppearance("surfaceColor", value)} swatches={APPEARANCE_SWATCHES.surfaceColor} />
                <ColorEditor label="Texto principal" value={appearance.textPrimaryColor} onChange={(value) => updateAppearance("textPrimaryColor", value)} swatches={APPEARANCE_SWATCHES.textPrimaryColor} />
                <ColorEditor label="Texto secundario" value={appearance.textSecondaryColor} onChange={(value) => updateAppearance("textSecondaryColor", value)} swatches={APPEARANCE_SWATCHES.textSecondaryColor} />
                <ColorEditor label="Texto de botones" value={appearance.buttonTextColor} onChange={(value) => updateAppearance("buttonTextColor", value)} swatches={APPEARANCE_SWATCHES.buttonTextColor} />
              </div>

              <div className="appearance-grid">
                <SegmentedControl label="Fondo" value={appearance.backgroundStyle} options={[{ label: "Solido", value: "solid" }, { label: "Degradado", value: "gradient" }]} onChange={(value) => updateAppearance("backgroundStyle", value)} />
                <SegmentedControl label="Boton" value={appearance.buttonStyle} options={[{ label: "Solido", value: "solid" }, { label: "Outline", value: "outline" }, { label: "Suave", value: "soft" }]} onChange={(value) => updateAppearance("buttonStyle", value)} />
                <SegmentedControl label="Borde de boton" value={appearance.buttonRadius} options={[{ label: "Redondeado", value: "rounded" }, { label: "Mas recto", value: "square" }]} onChange={(value) => updateAppearance("buttonRadius", value)} />
                <SegmentedControl label="Tarjeta" value={appearance.cardTransparency} options={[{ label: "Solida", value: "solid" }, { label: "Transparencia leve", value: "soft" }]} onChange={(value) => updateAppearance("cardTransparency", value)} />
                <SegmentedControl label="Sombra" value={appearance.cardShadow} options={[{ label: "Ninguna", value: "none" }, { label: "Soft", value: "soft" }, { label: "Medium", value: "medium" }]} onChange={(value) => updateAppearance("cardShadow", value)} />
                <SegmentedControl label="Forma de imagen" value={appearance.avatarShape} options={[{ label: "Circular", value: "circle" }, { label: "Rounded", value: "rounded" }, { label: "Cuadrado suave", value: "soft-square" }]} onChange={(value) => updateAppearance("avatarShape", value)} />
                <SegmentedControl label="Tamano del nombre" value={appearance.nameSize} options={[{ label: "S", value: "s" }, { label: "M", value: "m" }, { label: "L", value: "l" }]} onChange={(value) => updateAppearance("nameSize", value)} />
                <SegmentedControl label="Peso del nombre" value={appearance.nameWeight} options={[{ label: "Regular", value: "regular" }, { label: "Bold", value: "bold" }]} onChange={(value) => updateAppearance("nameWeight", value)} />
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
        </AccordionSection>

        <div className="actions editor-form-footer">
          <button className="btn btn-primary" type="submit" disabled={loading || !canEdit || appearanceWarnings.length > 0}>
            {loading ? <RefreshCw size={16} /> : null}
            Guardar cambios
          </button>
        </div>

        {message ? <p className="notice">{message}</p> : null}
      </form>

      <aside className="preview-shell">
        <div className="preview-header">
          <span className="pill"><MonitorSmartphone size={16} /> Preview real</span>
          <p className="section-copy">Refleja el diseno final de la landing publica.</p>
        </div>
        <div className="preview-frame">
          <LandingView user={previewUser} preview />
        </div>
      </aside>
    </div>
  );
}
