"use client";

import { useEffect, useState } from "react";
import { CalendarClock, CreditCard, ExternalLink, History, Mail, Phone, Shield, X } from "lucide-react";
import { ADMIN_ACCOUNT_STATUS_OPTIONS, ADMIN_ORIGIN_OPTIONS, ADMIN_PLAN_OPTIONS } from "@/lib/admin-config";
import { BUSINESS_CATEGORY_OPTIONS } from "@/lib/business-categories";
import { apiFetch } from "@/lib/client-api";

function getSettingsDefaults(settings = {}) {
  return {
    annualPrice: Number(settings.annualPrice || 0),
    convenioDefaultDays: Number(settings.convenioDefaultDays || 365),
  };
}

export function AdminUserDrawer({ token, detail, settings, onClose, onUpdated }) {
  const user = detail?.user;
  const [detailsForm, setDetailsForm] = useState(null);
  const [accessForm, setAccessForm] = useState(null);
  const [paymentForm, setPaymentForm] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyAction, setBusyAction] = useState("");

  useEffect(() => {
    if (!user) return;

    const defaults = getSettingsDefaults(settings);

    setDetailsForm({
      businessName: user.businessName || "",
      ownerName: user.ownerName || "",
      phone: user.phone || "",
      city: user.city || "",
      businessCategory: user.businessCategory || "services",
      origin: user.origin || "organico",
      partnerId: user.partnerId || "",
      plan: user.plan || "trial",
      adminNotes: user.notes || "",
    });

    setAccessForm({
      plan: user.plan || "trial",
      accountStatus: user.accountStatus || "trial",
      startsAt: user.startsAtIso || "",
      expiresAt: user.expiresAtIso || "",
    });

    setPaymentForm({
      amount: user.amountPaid || defaults.annualPrice || 0,
      plan: user.plan === "trial" ? "annual" : (user.plan || "annual"),
      durationDays: user.plan === "institutional" ? defaults.convenioDefaultDays : 365,
      method: "manual",
      notes: "",
    });

    setMessage("");
    setError("");
    setBusyAction("");
  }, [settings, user]);

  async function runPatch(body, successMessage) {
    if (!user?.uid) return;

    try {
      setBusyAction(body.action);
      setError("");
      setMessage("");
      const updated = await apiFetch(`/api/admin/users/${user.uid}`, {
        method: "PATCH",
        token,
        body,
      });
      setMessage(successMessage);
      onUpdated(updated);
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setBusyAction("");
    }
  }

  if (!user || !detailsForm || !accessForm || !paymentForm) {
    return null;
  }

  return (
    <aside className="admin-drawer">
      <div className="admin-drawer-header">
        <div className="admin-drawer-heading">
          <span className={`status-badge ${user.accountStatusTone || ""}`}>{user.accountStatusLabel}</span>
          <h3>{user.businessName}</h3>
          <p>{user.publicUrl || user.email}</p>
        </div>
        <button className="btn btn-secondary admin-icon-btn" type="button" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className="admin-drawer-scroll">
        <section className="panel admin-user-hero">
          <div className="admin-user-hero-main">
            <div className="admin-user-avatar">
              {user.photo ? <img src={user.photo} alt={user.businessName} /> : <span>{user.businessName?.slice(0, 1) || "K"}</span>}
            </div>
            <div className="stack" style={{ gap: ".35rem" }}>
              <h4>{user.businessName}</h4>
              <p className="muted">{user.ownerName || "Sin responsable"}</p>
              <div className="admin-inline-list">
                <span><Mail size={14} /> {user.email}</span>
                <span><Phone size={14} /> {user.phone || "Sin teléfono"}</span>
              </div>
            </div>
          </div>
          <div className="admin-hero-actions">
            {user.publicUrl ? (
              <a className="btn btn-secondary" href={user.publicUrl} target="_blank" rel="noreferrer">
                <ExternalLink size={16} /> Abrir perfil
              </a>
            ) : null}
            <button
              className="btn btn-primary"
              type="button"
              disabled={busyAction === "set_access"}
              onClick={() => runPatch({
                action: "set_access",
                ...accessForm,
                accountStatus: "active",
              }, "Cuenta activada.")}
            >
              <Shield size={16} /> Activar
            </button>
          </div>
        </section>

        <section className="panel admin-drawer-section">
          <div className="admin-section-heading">
            <h4>Datos del negocio</h4>
            <p className="muted">Edita identidad, origen y notas internas.</p>
          </div>

          <div className="form-grid">
            <div>
              <label className="label">Nombre del negocio</label>
              <input className="input" value={detailsForm.businessName} onChange={(event) => setDetailsForm((current) => ({ ...current, businessName: event.target.value }))} />
            </div>
            <div>
              <label className="label">Responsable</label>
              <input className="input" value={detailsForm.ownerName} onChange={(event) => setDetailsForm((current) => ({ ...current, ownerName: event.target.value }))} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" value={user.email || ""} disabled />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input className="input" value={detailsForm.phone} onChange={(event) => setDetailsForm((current) => ({ ...current, phone: event.target.value }))} />
            </div>
            <div>
              <label className="label">Ciudad</label>
              <input className="input" value={detailsForm.city} onChange={(event) => setDetailsForm((current) => ({ ...current, city: event.target.value }))} />
            </div>
            <div>
              <label className="label">Tipo de negocio</label>
              <select className="select" value={detailsForm.businessCategory} onChange={(event) => setDetailsForm((current) => ({ ...current, businessCategory: event.target.value }))}>
                {BUSINESS_CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Origen</label>
              <select className="select" value={detailsForm.origin} onChange={(event) => setDetailsForm((current) => ({ ...current, origin: event.target.value }))}>
                {ADMIN_ORIGIN_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Convenio o aliado</label>
              <input className="input" placeholder="partner_001" value={detailsForm.partnerId} onChange={(event) => setDetailsForm((current) => ({ ...current, partnerId: event.target.value }))} />
            </div>
            <div>
              <label className="label">Plan base</label>
              <select className="select" value={detailsForm.plan} onChange={(event) => setDetailsForm((current) => ({ ...current, plan: event.target.value }))}>
                {ADMIN_PLAN_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: "1rem" }}>
            <label className="label">Notas internas</label>
            <textarea className="textarea" rows={4} value={detailsForm.adminNotes} onChange={(event) => setDetailsForm((current) => ({ ...current, adminNotes: event.target.value }))} />
          </div>

          <div className="actions" style={{ marginTop: "1rem" }}>
            <button
              className="btn btn-primary"
              type="button"
              disabled={busyAction === "save_details"}
              onClick={() => runPatch({
                action: "save_details",
                ...detailsForm,
              }, "Datos del negocio actualizados.")}
            >
              Guardar datos
            </button>
          </div>
        </section>

        <section className="panel admin-drawer-section">
          <div className="admin-section-heading">
            <h4>Acceso y vencimientos</h4>
            <p className="muted">Controla estado, plan y fechas de servicio.</p>
          </div>

          <div className="form-grid">
            <div>
              <label className="label">Estado de cuenta</label>
              <select className="select" value={accessForm.accountStatus} onChange={(event) => setAccessForm((current) => ({ ...current, accountStatus: event.target.value }))}>
                {ADMIN_ACCOUNT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Plan</label>
              <select className="select" value={accessForm.plan} onChange={(event) => setAccessForm((current) => ({ ...current, plan: event.target.value }))}>
                {ADMIN_PLAN_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Inicio del servicio</label>
              <input className="input" type="date" value={accessForm.startsAt} onChange={(event) => setAccessForm((current) => ({ ...current, startsAt: event.target.value }))} />
            </div>
            <div>
              <label className="label">Fecha de vencimiento</label>
              <input className="input" type="date" value={accessForm.expiresAt} onChange={(event) => setAccessForm((current) => ({ ...current, expiresAt: event.target.value }))} />
            </div>
          </div>

          <div className="actions" style={{ marginTop: "1rem" }}>
            <button
              className="btn btn-primary"
              type="button"
              disabled={busyAction === "set_access"}
              onClick={() => runPatch({
                action: "set_access",
                ...accessForm,
              }, "Acceso actualizado.")}
            >
              <CalendarClock size={16} /> Guardar acceso
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              disabled={busyAction === "extend_access"}
              onClick={() => runPatch({
                action: "extend_access",
                days: 30,
              }, "Se extendió 30 días el acceso.")}
            >
              Extender 30 días
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              disabled={busyAction === "set_access"}
              onClick={() => runPatch({
                action: "set_access",
                ...accessForm,
                accountStatus: "suspended",
              }, "Cuenta suspendida.")}
            >
              Suspender
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              disabled={busyAction === "set_access"}
              onClick={() => runPatch({
                action: "set_access",
                ...accessForm,
                accountStatus: "expired",
              }, "Cuenta marcada como vencida.")}
            >
              Marcar vencida
            </button>
          </div>
        </section>

        <section className="panel admin-drawer-section">
          <div className="admin-section-heading">
            <h4>Pago manual</h4>
            <p className="muted">Registra pagos fuera de Mercado Pago y renueva acceso.</p>
          </div>

          <div className="form-grid">
            <div>
              <label className="label">Monto</label>
              <input className="input" type="number" min={0} value={paymentForm.amount} onChange={(event) => setPaymentForm((current) => ({ ...current, amount: Number(event.target.value) }))} />
            </div>
            <div>
              <label className="label">Plan</label>
              <select className="select" value={paymentForm.plan} onChange={(event) => setPaymentForm((current) => ({ ...current, plan: event.target.value }))}>
                {ADMIN_PLAN_OPTIONS.filter((option) => option.value !== "trial").map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Duración (días)</label>
              <input className="input" type="number" min={1} value={paymentForm.durationDays} onChange={(event) => setPaymentForm((current) => ({ ...current, durationDays: Number(event.target.value) }))} />
            </div>
            <div>
              <label className="label">Método</label>
              <input className="input" value={paymentForm.method} onChange={(event) => setPaymentForm((current) => ({ ...current, method: event.target.value }))} />
            </div>
          </div>

          <div style={{ marginTop: "1rem" }}>
            <label className="label">Notas del pago</label>
            <textarea className="textarea" rows={3} value={paymentForm.notes} onChange={(event) => setPaymentForm((current) => ({ ...current, notes: event.target.value }))} />
          </div>

          <div className="actions" style={{ marginTop: "1rem" }}>
            <button
              className="btn btn-primary"
              type="button"
              disabled={busyAction === "register_payment"}
              onClick={() => runPatch({
                action: "register_payment",
                ...paymentForm,
              }, "Pago manual registrado.")}
            >
              <CreditCard size={16} /> Registrar pago
            </button>
          </div>
        </section>

        <section className="panel admin-drawer-section">
          <div className="admin-section-heading">
            <h4>Historial de pagos</h4>
            <p className="muted">Últimos pagos asociados a esta cuenta.</p>
          </div>

          <div className="admin-history-list">
            {detail.payments?.length ? detail.payments.map((payment) => (
              <article key={payment.id} className="admin-history-item">
                <div>
                  <strong>{payment.amountLabel}</strong>
                  <p className="muted">{payment.notes || payment.method}</p>
                </div>
                <div className="admin-history-meta">
                  <span className="status-badge">{payment.status}</span>
                  <small>{payment.createdAtLabel}</small>
                </div>
              </article>
            )) : <p className="muted">Todavía no hay pagos registrados.</p>}
          </div>
        </section>

        <section className="panel admin-drawer-section">
          <div className="admin-section-heading">
            <h4>Bitácora administrativa</h4>
            <p className="muted">Acciones recientes aplicadas a este usuario.</p>
          </div>

          <div className="admin-history-list">
            {detail.logs?.length ? detail.logs.map((item) => (
              <article key={item.id} className="admin-history-item">
                <div>
                  <strong>{item.summary}</strong>
                  <p className="muted">{item.actorEmail || item.actorUid || "Sistema"}</p>
                </div>
                <div className="admin-history-meta">
                  <History size={16} />
                  <small>{item.createdAtLabel}</small>
                </div>
              </article>
            )) : <p className="muted">Todavía no hay eventos registrados.</p>}
          </div>
        </section>

        {message ? <p className="notice">{message}</p> : null}
        {error ? <p className="notice notice-danger">{error}</p> : null}
      </div>
    </aside>
  );
}
