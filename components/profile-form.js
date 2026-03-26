"use client";

import { useEffect, useState } from "react";
import { Download, ExternalLink, ImagePlus, Plus, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import { LINK_CATALOG, LINK_CATALOG_MAP } from "@/lib/link-catalog";

const FIXED_THEME = {
  accent: "#5B21B6",
  surface: "#FFFFFF",
  text: "#0B1020",
  titleText: "#0B1020",
  buttonText: "#FFFFFF",
  buttonOpacity: 1,
  mode: "light",
};

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

export function ProfileForm({ token, profile, onSaved, canEdit }) {
  const [form, setForm] = useState({
    businessName: profile?.businessName || "",
    username: profile?.username || "",
  });
  const [profileLinks, setProfileLinks] = useState(normalizeLinks(profile));
  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState("whatsapp");

  useEffect(() => {
    setForm({
      businessName: profile?.businessName || "",
      username: profile?.username || "",
    });
    setProfileLinks(normalizeLinks(profile));
  }, [profile]);

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
      body.append("businessName", form.businessName);
      body.append("username", form.username);
      body.append("profileLinks", JSON.stringify(profileLinks));
      Object.entries(FIXED_THEME).forEach(([key, value]) => body.append(key, String(value)));
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

  const selectedPhotoLabel = photo ? photo.name : profile?.photo ? "Imagen actual cargada" : "Aún no has elegido imagen";
  const usernameChanged = Boolean(profile?.username) && form.username.trim() && form.username.trim() !== profile.username;

  return (
    <form className="section-stack" onSubmit={handleSubmit}>
      <section className="dashboard-section panel">
        <div className="dashboard-section-head">
          <div>
            <h2 className="section-title">Perfil</h2>
            <p className="section-copy">Actualiza el nombre del negocio, tu enlace público y la imagen principal.</p>
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
            <input
              className="upload-input"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              disabled={!canEdit}
            />
            <span className="upload-icon">
              {photo || profile?.photo ? <ImagePlus size={20} /> : <UploadCloud size={20} />}
            </span>
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
            <p className="section-copy">Agrega, edita y ordena la presencia digital de tu negocio en un solo lugar.</p>
          </div>
        </div>

        <div className="link-toolbar">
          <select className="select" value={selectedType} onChange={(e) => setSelectedType(e.target.value)} disabled={!canEdit}>
            {LINK_CATALOG.map((item) => (
              <option key={item.type} value={item.type}>{item.label}</option>
            ))}
          </select>
          <button className="btn btn-secondary" type="button" onClick={addLink} disabled={!canEdit}>
            <Plus size={16} /> Agregar enlace
          </button>
        </div>

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
            <h2 className="section-title">QR y URL pública</h2>
            <p className="section-copy">Mantén a la vista tu enlace único y tu código QR para compartirlos rápido.</p>
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
          <button className="btn btn-primary" disabled={loading || !canEdit} type="submit">
            {loading ? <RefreshCw size={16} /> : null}
            Guardar cambios
          </button>
        </div>
        {message ? <p className="notice">{message}</p> : null}
      </section>
    </form>
  );
}
