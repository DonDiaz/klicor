"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, ExternalLink, ImagePlus, MonitorSmartphone, Paintbrush, Plus, RefreshCw, RotateCcw, Trash2, UploadCloud } from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import { canAddLinkType, getLinkTypeCount, getLinkTypeLimit, LINK_CATALOG, LINK_CATALOG_MAP } from "@/lib/link-catalog";
import { LandingView } from "@/components/landing-view";
import { APPEARANCE_DEFAULTS, APPEARANCE_PRESETS, APPEARANCE_SWATCHES, getAppearanceWarnings, normalizeAppearance } from "@/lib/theme-system";

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

export function ProfileForm({ token, profile, onSaved, canEdit }) {
  const [form, setForm] = useState({
    businessName: profile?.businessName || "",
    username: profile?.username || "",
  });
  const [profileLinks, setProfileLinks] = useState(normalizeLinks(profile));
  const [appearance, setAppearance] = useState(normalizeAppearance(profile?.settings || APPEARANCE_DEFAULTS));
  const [photo, setPhoto] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState("whatsapp");

  useEffect(() => {
    setForm({
      businessName: profile?.businessName || "",
      username: profile?.username || "",
    });
    setProfileLinks(normalizeLinks(profile));
    setAppearance(normalizeAppearance(profile?.settings || APPEARANCE_DEFAULTS));
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

  const previewUser = useMemo(() => ({
    businessName: form.businessName || "Tu negocio",
    username: form.username || "tu-usuario",
    photo: photoPreviewUrl || profile?.photo || "",
    settings: appearance,
    profileLinks: profileLinks
      .filter((item) => item.value?.trim())
      .map((item) => ({
        ...item,
        url: normalizeLinkUrl(item),
      })),
  }), [appearance, form.businessName, form.username, photoPreviewUrl, profile?.photo, profileLinks]);

  const appearanceWarnings = useMemo(() => getAppearanceWarnings(appearance), [appearance]);
  const selectedTypeLimit = getLinkTypeLimit(selectedType);
  const selectedTypeCount = getLinkTypeCount(profileLinks, selectedType);
  const selectedTypeAvailable = canAddLinkType(profileLinks, selectedType);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canEdit) {
      setMessage("Tu cuenta no permite edición en este momento.");
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

      const data = await apiFetch("/api/profile", {
        method: "POST",
        token,
        body,
        isFormData: true,
      });
      onSaved(data.user);
      setMessage("Perfil y diseño actualizados correctamente.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleQrDownload() {
    try {
      const response = await fetch("/api/qr/download", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo descargar el QR");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${profile?.username || "linka"}-qr.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setMessage(error.message || "No se pudo descargar el QR");
    }
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
  const usernameChanged = Boolean(profile?.username) && form.username.trim() && form.username.trim() !== profile.username;

  return (
    <div className="editor-layout">
      <form className="section-stack" onSubmit={handleSubmit}>
        <section className="dashboard-section panel">
          <div className="dashboard-section-head">
            <div>
              <h2 className="section-title">Perfil</h2>
              <p className="section-copy">Actualiza nombre, username e imagen principal del negocio.</p>
            </div>
          </div>

          <div className="profile-grid">
            <div>
              <label className="label">Nombre del negocio</label>
              <input className="input" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} disabled={!canEdit} required />
            </div>
            <div>
              <label className="label">Username</label>
              <input className="input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} disabled={!canEdit} required />
              <p className="muted" style={{ marginTop: ".45rem" }}>Este valor crea tu URL pública y tu código QR.</p>
            </div>
          </div>

          {usernameChanged ? (
            <div className="notice notice-danger">
              <span>Si cambias el username, tu link actual y tu QR actual dejan de funcionar y se reemplazan por la nueva versión.</span>
            </div>
          ) : null}

          <div className="upload-inline">
            <label className="label">Imagen del negocio</label>
            <label className={`upload-card ${!canEdit ? "upload-card-disabled" : ""}`}>
              <input className="upload-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setPhoto(e.target.files?.[0] || null)} disabled={!canEdit} />
              <span className="upload-icon">{photo || profile?.photo ? <ImagePlus size={20} /> : <UploadCloud size={20} />}</span>
              <span className="upload-copy">
                <strong>{photo ? "Cambiar imagen" : "Subir imagen"}</strong>
                <span>{selectedPhotoLabel}</span>
                <small>PNG, JPG o WEBP hasta 2 MB</small>
              </span>
            </label>
          </div>
        </section>

        <section className="dashboard-section panel">
          <div className="dashboard-section-head">
            <div>
              <h2 className="section-title">Enlaces</h2>
              <p className="section-copy">Lista editable de enlaces con etiquetas limpias y mensaje personalizado para WhatsApp.</p>
            </div>
          </div>

          <div className="link-toolbar">
            <select className="select" value={selectedType} onChange={(e) => setSelectedType(e.target.value)} disabled={!canEdit}>
              {LINK_CATALOG.map((item) => (
                <option key={item.type} value={item.type}>
                  {item.label}
                  {getLinkTypeCount(profileLinks, item.type) >= getLinkTypeLimit(item.type) ? " · límite alcanzado" : ""}
                </option>
              ))}
            </select>
            <button className="btn btn-secondary" type="button" onClick={addLink} disabled={!canEdit || !selectedTypeAvailable}>
              <Plus size={16} /> Agregar enlace
            </button>
          </div>

          <p className="muted">
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
                    <label className="label">{meta.kind === "phone" ? "Número" : "URL"}</label>
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
                </div>
              );
            }) : (
              <div className="kpi">
                <strong>Sin enlaces todavía</strong>
                <p className="muted" style={{ marginTop: ".5rem" }}>Agrega tu primer canal para empezar a construir tu página pública.</p>
              </div>
            )}
          </div>
        </section>

        <section className="dashboard-section panel">
          <div className="dashboard-section-head">
            <div>
              <h2 className="section-title">Apariencia</h2>
              <p className="section-copy">Usa un preset para avanzar rápido o activa el modo avanzado para personalizar sin romper la legibilidad.</p>
            </div>
            <button
              className={`btn ${appearance.advancedEnabled ? "btn-primary" : "btn-secondary"}`}
              type="button"
              onClick={() => setAppearance((current) => ({ ...current, advancedEnabled: !current.advancedEnabled }))}
            >
              <Paintbrush size={16} /> Personalizar diseño
            </button>
          </div>

          <div className="appearance-presets">
            {APPEARANCE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                className={`appearance-preset ${appearance.presetId === preset.id ? "is-active" : ""}`}
                type="button"
                onClick={() => applyPreset(preset.id)}
              >
                <span className="preset-swatches">
                  <i style={{ background: preset.appearance.primaryColor }} />
                  <i style={{ background: preset.appearance.backgroundColor }} />
                  <i style={{ background: preset.appearance.surfaceColor }} />
                </span>
                <strong>{preset.name}</strong>
              </button>
            ))}
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
                <SegmentedControl label="Fondo" value={appearance.backgroundStyle} options={[{ label: "Sólido", value: "solid" }, { label: "Degradado", value: "gradient" }]} onChange={(value) => updateAppearance("backgroundStyle", value)} />
                <SegmentedControl label="Botón" value={appearance.buttonStyle} options={[{ label: "Sólido", value: "solid" }, { label: "Outline", value: "outline" }, { label: "Suave", value: "soft" }]} onChange={(value) => updateAppearance("buttonStyle", value)} />
                <SegmentedControl label="Borde de botón" value={appearance.buttonRadius} options={[{ label: "Redondeado", value: "rounded" }, { label: "Más recto", value: "square" }]} onChange={(value) => updateAppearance("buttonRadius", value)} />
                <SegmentedControl label="Tarjeta" value={appearance.cardTransparency} options={[{ label: "Sólida", value: "solid" }, { label: "Transparencia leve", value: "soft" }]} onChange={(value) => updateAppearance("cardTransparency", value)} />
                <SegmentedControl label="Sombra" value={appearance.cardShadow} options={[{ label: "Ninguna", value: "none" }, { label: "Soft", value: "soft" }, { label: "Medium", value: "medium" }]} onChange={(value) => updateAppearance("cardShadow", value)} />
                <SegmentedControl label="Forma de imagen" value={appearance.avatarShape} options={[{ label: "Circular", value: "circle" }, { label: "Rounded", value: "rounded" }, { label: "Cuadrado suave", value: "soft-square" }]} onChange={(value) => updateAppearance("avatarShape", value)} />
                <SegmentedControl label="Tamaño del nombre" value={appearance.nameSize} options={[{ label: "S", value: "s" }, { label: "M", value: "m" }, { label: "L", value: "l" }]} onChange={(value) => updateAppearance("nameSize", value)} />
                <SegmentedControl label="Peso del nombre" value={appearance.nameWeight} options={[{ label: "Regular", value: "regular" }, { label: "Bold", value: "bold" }]} onChange={(value) => updateAppearance("nameWeight", value)} />
              </div>
            </div>
          ) : null}

          {appearanceWarnings.length ? (
            <div className="notice notice-danger">
              <span>{appearanceWarnings[0].message}</span>
            </div>
          ) : null}

          <div className="actions">
            <button className="btn btn-secondary" type="button" onClick={resetAppearance}>
              <RotateCcw size={16} /> Restablecer
            </button>
            <button className="btn btn-primary" type="submit" disabled={loading || !canEdit || appearanceWarnings.length > 0}>
              {loading ? <RefreshCw size={16} /> : null}
              Guardar diseño
            </button>
          </div>
        </section>

        <section className="dashboard-section panel">
          <div className="dashboard-section-head">
            <div>
              <h2 className="section-title">QR</h2>
              <p className="section-copy">Mantén visible tu enlace y descarga tu QR cuando lo necesites.</p>
            </div>
          </div>

          <div className="actions">
            {profile?.qrUrl ? (
              <button className="btn btn-secondary" type="button" onClick={handleQrDownload}>
                <Download size={16} /> Descargar QR
              </button>
            ) : null}
            {profile?.username ? (
              <a className="btn btn-secondary" href={`/${profile.username}`} target="_blank" rel="noreferrer">
                <ExternalLink size={16} /> Abrir página
              </a>
            ) : null}
            <button className="btn btn-primary" disabled={loading || !canEdit || appearanceWarnings.length > 0} type="submit">
              {loading ? <RefreshCw size={16} /> : null}
              Guardar cambios
            </button>
          </div>
          {message ? <p className="notice">{message}</p> : null}
        </section>
      </form>

      <aside className="preview-shell">
        <div className="preview-header">
          <span className="pill"><MonitorSmartphone size={16} /> Preview real</span>
          <p className="section-copy">Refleja el diseño final de la landing pública.</p>
        </div>
        <div className="preview-frame">
          <LandingView user={previewUser} preview />
        </div>
      </aside>
    </div>
  );
}
