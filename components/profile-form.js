"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, ExternalLink, Eye, Palette, Plus, RefreshCw, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import { LINK_CATALOG, LINK_CATALOG_MAP } from "@/lib/link-catalog";
import { LandingView } from "@/components/landing-view";

const THEME_PRESETS = [
  {
    id: "sunrise",
    name: "Amanecer",
    accent: "#f97316",
    surface: "#fff7ed",
    text: "#1c1917",
  },
  {
    id: "ocean",
    name: "Océano",
    accent: "#0f766e",
    surface: "#ecfeff",
    text: "#0f172a",
  },
  {
    id: "berry",
    name: "Berry",
    accent: "#be185d",
    surface: "#fff1f2",
    text: "#3f0d22",
  },
  {
    id: "night",
    name: "Noche",
    accent: "#6366f1",
    surface: "#111827",
    text: "#f9fafb",
  },
];

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

function ColorField({ label, value, onChange, presets = [] }) {
  return (
    <div className="color-card">
      <div className="color-card-top">
        <div>
          <label className="label">{label}</label>
          <strong>{value}</strong>
        </div>
        <label className="color-chip" style={{ "--swatch": value }}>
          <input type="color" value={value} onChange={onChange} />
          <span />
        </label>
      </div>
      {presets.length ? (
        <div className="color-swatches">
          {presets.map((preset) => (
            <button
              key={`${label}-${preset}`}
              className="swatch-button"
              style={{ "--swatch": preset }}
              type="button"
              onClick={() => onChange({ target: { value: preset } })}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ProfileForm({ token, profile, onSaved, canEdit }) {
  const [form, setForm] = useState({
    businessName: profile?.businessName || "",
    username: profile?.username || "",
    accent: profile?.settings?.accent || "#f97316",
    surface: profile?.settings?.surface || "#fff7ed",
    text: profile?.settings?.text || "#1c1917",
    mode: profile?.settings?.mode || "light",
  });
  const [profileLinks, setProfileLinks] = useState(normalizeLinks(profile));
  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [origin, setOrigin] = useState("");
  const [selectedType, setSelectedType] = useState("whatsapp");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    setForm({
      businessName: profile?.businessName || "",
      username: profile?.username || "",
      accent: profile?.settings?.accent || "#f97316",
      surface: profile?.settings?.surface || "#fff7ed",
      text: profile?.settings?.text || "#1c1917",
      mode: profile?.settings?.mode || "light",
    });
    setProfileLinks(normalizeLinks(profile));
  }, [profile]);

  const previewUser = useMemo(() => ({
    businessName: form.businessName || "Tu negocio",
    username: form.username || "tu-usuario",
    photo: profile?.photo || "",
    settings: {
      accent: form.accent,
      surface: form.surface,
      text: form.text,
      mode: form.mode,
    },
    profileLinks: profileLinks
      .filter((item) => item.value?.trim())
      .map((item) => ({
        ...item,
        url: normalizeLinkUrl(item),
      })),
  }), [form, profile?.photo, profileLinks]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canEdit) {
      setMessage("Tu cuenta no permite edición en este momento.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, value));
      body.append("profileLinks", JSON.stringify(profileLinks));
      if (photo) body.append("photo", photo);
      const data = await apiFetch("/api/profile", {
        method: "POST",
        token,
        body,
        isFormData: true,
      });
      onSaved(data.user);
      setMessage("Perfil actualizado correctamente.");
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
      link.download = `${profile?.username || "bioimpulso"}-qr.png`;
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
    setProfileLinks((current) => current.map((item) => {
      if (item.id !== id) return item;
      const next = { ...item, [field]: value };
      if (next.type !== "whatsapp") {
        next.message = "";
      }
      return next;
    }));
  }

  function removeLink(id) {
    setProfileLinks((current) => current.filter((item) => item.id !== id));
  }

  function applyPreset(preset) {
    setForm((current) => ({
      ...current,
      accent: preset.accent,
      surface: preset.surface,
      text: preset.text,
      mode: preset.id === "night" ? "dark" : current.mode,
    }));
  }

  const publicUrl = form.username ? `${origin}/${form.username}` : "";

  return (
    <div className="editor-layout">
      <form className="stack" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div>
            <label className="label">Nombre del negocio</label>
            <input className="input" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} disabled={!canEdit} required />
          </div>
          <div>
            <label className="label">Usuario público</label>
            <input className="input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} disabled={!canEdit} required />
          </div>
        </div>

        <div className="form-grid">
          <div>
            <label className="label">Imagen del negocio</label>
            <input className="input" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setPhoto(e.target.files?.[0] || null)} disabled={!canEdit} />
          </div>
          <div>
            <label className="label">Modo base</label>
            <select className="select" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} disabled={!canEdit}>
              <option value="light">Claro</option>
              <option value="dark">Oscuro</option>
            </select>
          </div>
        </div>

        <section className="panel stack">
          <div className="topbar" style={{ marginBottom: 0 }}>
            <div>
              <h3 style={{ marginBottom: ".2rem" }}>Estilo visual</h3>
              <p className="muted">Haz que la landing se sienta más tuya. El color principal ahora domina botones, acentos y detalles clave.</p>
            </div>
            <span className="pill"><Palette size={16} /> Personaliza</span>
          </div>

          <div className="preset-grid">
            {THEME_PRESETS.map((preset) => (
              <button
                key={preset.id}
                className="preset-card"
                type="button"
                onClick={() => applyPreset(preset)}
                disabled={!canEdit}
              >
                <span className="preset-swatches">
                  <i style={{ background: preset.accent }} />
                  <i style={{ background: preset.surface }} />
                  <i style={{ background: preset.text }} />
                </span>
                <strong>{preset.name}</strong>
              </button>
            ))}
          </div>

          <div className="form-grid color-grid">
            <ColorField
              label="Color principal"
              value={form.accent}
              onChange={(e) => setForm({ ...form, accent: e.target.value })}
              presets={["#f97316", "#0f766e", "#2563eb", "#be185d", "#7c3aed"]}
            />
            <ColorField
              label="Color de fondo"
              value={form.surface}
              onChange={(e) => setForm({ ...form, surface: e.target.value })}
              presets={["#fff7ed", "#eff6ff", "#fdf2f8", "#ecfeff", "#111827"]}
            />
          </div>

          <ColorField
            label="Color de texto"
            value={form.text}
            onChange={(e) => setForm({ ...form, text: e.target.value })}
            presets={["#1c1917", "#0f172a", "#3f0d22", "#f9fafb", "#334155"]}
          />
        </section>

        <section className="panel stack">
          <div className="topbar" style={{ marginBottom: 0 }}>
            <div>
              <h3 style={{ marginBottom: ".2rem" }}>Tus links</h3>
              <p className="muted">Agrega todos los enlaces que quieras. Puedes mezclar redes, tienda, web y contacto.</p>
            </div>
          </div>

          <div className="link-toolbar">
            <select className="select" value={selectedType} onChange={(e) => setSelectedType(e.target.value)} disabled={!canEdit}>
              {LINK_CATALOG.map((item) => (
                <option key={item.type} value={item.type}>{item.label}</option>
              ))}
            </select>
            <button className="btn btn-secondary" type="button" onClick={addLink} disabled={!canEdit}>
              <Plus size={16} /> Agregar link
            </button>
          </div>

          <div className="stack">
            {profileLinks.map((item) => {
              const meta = LINK_CATALOG_MAP[item.type] || LINK_CATALOG_MAP.website;
              return (
                <div className="link-row" key={item.id}>
                  <div className="link-row-main">
                    <label className="label">Etiqueta</label>
                    <input className="input" value={item.label} onChange={(e) => updateLink(item.id, "label", e.target.value)} disabled={!canEdit} />
                  </div>
                  <div className="link-row-value">
                    <label className="label">{meta.kind === "phone" ? "Número" : "URL"}</label>
                    <input className="input" value={item.value} placeholder={meta.placeholder} onChange={(e) => updateLink(item.id, "value", e.target.value)} disabled={!canEdit} />
                  </div>
                  <button className="btn btn-secondary link-remove" type="button" onClick={() => removeLink(item.id)} disabled={!canEdit}>
                    <Trash2 size={16} />
                  </button>
                  {item.type === "whatsapp" ? (
                    <div className="link-row-message">
                      <label className="label">Mensaje inicial</label>
                      <input
                        className="input"
                        value={item.message || ""}
                        placeholder="Hola, quiero información"
                        onChange={(e) => updateLink(item.id, "message", e.target.value)}
                        disabled={!canEdit}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <div className="actions">
          <button className="btn btn-primary" disabled={loading || !canEdit} type="submit">
            {loading ? <RefreshCw size={16} /> : null}
            Guardar perfil
          </button>
          {profile?.qrUrl ? (
            <button className="btn btn-secondary" type="button" onClick={handleQrDownload}>
              <Download size={16} /> Descargar QR
            </button>
          ) : null}
          {publicUrl ? (
            <a className="btn btn-secondary" href={publicUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={16} /> Abrir landing
            </a>
          ) : null}
        </div>
        {message ? <p className="notice">{message}</p> : null}
      </form>

      <aside className="preview-shell">
        <div className="preview-header">
          <span className="pill"><Eye size={16} /> Vista previa</span>
          <p className="muted">Así se verá la landing en móvil mientras editas.</p>
        </div>
        <div className="phone-frame">
          <LandingView user={previewUser} preview />
        </div>
      </aside>
    </div>
  );
}
