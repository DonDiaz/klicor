"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, ExternalLink, Eye, Plus, RefreshCw, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import { LINK_CATALOG, LINK_CATALOG_MAP } from "@/lib/link-catalog";
import { LandingView } from "@/components/landing-view";

function normalizeLinks(profile) {
  if (Array.isArray(profile?.profileLinks) && profile.profileLinks.length) {
    return profile.profileLinks.map((item) => ({
      id: item.id,
      type: item.type,
      label: item.label,
      value: item.value,
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
    }));
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
    profileLinks: profileLinks.map((item) => ({
      ...item,
      url: LINK_CATALOG_MAP[item.type]?.kind === "phone"
        ? `https://wa.me/${String(item.value).replace(/\D/g, "")}`
        : /^https?:\/\//i.test(item.value) ? item.value : `https://${item.value}`,
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
      },
    ]);
  }

  function updateLink(id, field, value) {
    setProfileLinks((current) => current.map((item) => item.id === id ? { ...item, [field]: value } : item));
  }

  function removeLink(id) {
    setProfileLinks((current) => current.filter((item) => item.id !== id));
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
            <label className="label">Modo</label>
            <select className="select" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} disabled={!canEdit}>
              <option value="light">Claro</option>
              <option value="dark">Oscuro</option>
            </select>
          </div>
        </div>
        <div className="form-grid">
          <div><label className="label">Color principal</label><input className="input" type="color" value={form.accent} onChange={(e) => setForm({ ...form, accent: e.target.value })} disabled={!canEdit} /></div>
          <div><label className="label">Color de fondo</label><input className="input" type="color" value={form.surface} onChange={(e) => setForm({ ...form, surface: e.target.value })} disabled={!canEdit} /></div>
        </div>
        <div>
          <label className="label">Color de texto</label>
          <input className="input" type="color" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} disabled={!canEdit} />
        </div>

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
            <button className="btn btn-secondary" type="button" onClick={addLink} disabled={!canEdit}><Plus size={16} /> Agregar link</button>
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
                  <button className="btn btn-secondary link-remove" type="button" onClick={() => removeLink(item.id)} disabled={!canEdit}><Trash2 size={16} /></button>
                </div>
              );
            })}
          </div>
        </section>

        <div className="actions">
          <button className="btn btn-primary" disabled={loading || !canEdit} type="submit">{loading ? <RefreshCw size={16} /> : null} Guardar perfil</button>
          {profile?.qrUrl ? <button className="btn btn-secondary" type="button" onClick={handleQrDownload}><Download size={16} /> Descargar QR</button> : null}
          {publicUrl ? <a className="btn btn-secondary" href={publicUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Abrir landing</a> : null}
        </div>
        {message ? <p className="notice">{message}</p> : null}
      </form>

      <aside className="preview-shell">
        <div className="preview-header">
          <span className="pill"><Eye size={16} /> Vista previa en tiempo real</span>
          <p className="muted">Así verá el usuario su landing en móvil mientras edita.</p>
        </div>
        <div className="phone-frame">
          <LandingView user={previewUser} preview />
        </div>
      </aside>
    </div>
  );
}
