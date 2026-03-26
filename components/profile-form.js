"use client";

import { useEffect, useState } from "react";
import { Download, ExternalLink, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/client-api";

export function ProfileForm({ token, profile, onSaved, canEdit }) {
  const [form, setForm] = useState({
    businessName: profile?.businessName || "",
    username: profile?.username || "",
    whatsapp: profile?.links?.whatsapp || "",
    instagram: profile?.links?.instagram || "",
    facebook: profile?.links?.facebook || "",
    tiktok: profile?.links?.tiktok || "",
    website: profile?.links?.website || "",
    accent: profile?.settings?.accent || "#f97316",
    surface: profile?.settings?.surface || "#fff7ed",
    text: profile?.settings?.text || "#1c1917",
    mode: profile?.settings?.mode || "light",
  });
  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    setForm({
      businessName: profile?.businessName || "",
      username: profile?.username || "",
      whatsapp: profile?.links?.whatsapp || "",
      instagram: profile?.links?.instagram || "",
      facebook: profile?.links?.facebook || "",
      tiktok: profile?.links?.tiktok || "",
      website: profile?.links?.website || "",
      accent: profile?.settings?.accent || "#f97316",
      surface: profile?.settings?.surface || "#fff7ed",
      text: profile?.settings?.text || "#1c1917",
      mode: profile?.settings?.mode || "light",
    });
  }, [profile]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canEdit) {
      setMessage("Tu cuenta no permite edicion en este momento.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, value));
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

  const publicUrl = form.username ? `${origin}/${form.username}` : "";

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <div className="form-grid">
        <div>
          <label className="label">Nombre del negocio</label>
          <input className="input" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} disabled={!canEdit} required />
        </div>
        <div>
          <label className="label">Usuario publico</label>
          <input className="input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} disabled={!canEdit} required />
        </div>
      </div>
      <div className="form-grid">
        <div>
          <label className="label">WhatsApp</label>
          <input className="input" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} disabled={!canEdit} />
        </div>
        <div>
          <label className="label">Sitio web</label>
          <input className="input" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} disabled={!canEdit} />
        </div>
      </div>
      <div className="form-grid">
        <div><label className="label">Instagram</label><input className="input" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} disabled={!canEdit} /></div>
        <div><label className="label">Facebook</label><input className="input" value={form.facebook} onChange={(e) => setForm({ ...form, facebook: e.target.value })} disabled={!canEdit} /></div>
      </div>
      <div className="form-grid">
        <div><label className="label">TikTok</label><input className="input" value={form.tiktok} onChange={(e) => setForm({ ...form, tiktok: e.target.value })} disabled={!canEdit} /></div>
        <div><label className="label">Imagen del negocio</label><input className="input" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setPhoto(e.target.files?.[0] || null)} disabled={!canEdit} /></div>
      </div>
      <div className="form-grid">
        <div><label className="label">Color principal</label><input className="input" type="color" value={form.accent} onChange={(e) => setForm({ ...form, accent: e.target.value })} disabled={!canEdit} /></div>
        <div><label className="label">Modo</label><select className="select" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} disabled={!canEdit}><option value="light">Claro</option><option value="dark">Oscuro</option></select></div>
      </div>
      <div className="form-grid">
        <div><label className="label">Color de fondo</label><input className="input" type="color" value={form.surface} onChange={(e) => setForm({ ...form, surface: e.target.value })} disabled={!canEdit} /></div>
        <div><label className="label">Color de texto</label><input className="input" type="color" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} disabled={!canEdit} /></div>
      </div>
      <div className="actions">
        <button className="btn btn-primary" disabled={loading || !canEdit} type="submit">{loading ? <RefreshCw size={16} /> : null} Guardar perfil</button>
        {profile?.qrUrl ? <a className="btn btn-secondary" href={profile.qrUrl} target="_blank" rel="noreferrer"><Download size={16} /> Descargar QR</a> : null}
        {publicUrl ? <a className="btn btn-secondary" href={publicUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Ver landing</a> : null}
      </div>
      {message ? <p className="notice">{message}</p> : null}
    </form>
  );
}
