"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import {
  Building2,
  Clock3,
  ExternalLink,
  KeyRound,
  Loader2,
  MailPlus,
  ShieldCheck,
} from "lucide-react";
import { AuthForm } from "@/components/auth-form";
import { useAuth } from "@/components/providers/auth-provider";
import { apiFetch, getFreshAuthToken } from "@/lib/client-api";
import { getClientAuth } from "@/lib/firebase-client";

const FILTERS = {
  businesses: {
    title: "Negocios vinculados",
    copy: "Negocios que aceptaron el acceso de agencia.",
    empty: "Aún no tienes negocios vinculados.",
  },
  pending: {
    title: "Solicitudes pendientes",
    copy: "Solicitudes esperando respuesta del negocio, incluyendo vencidas para seguimiento.",
    empty: "No hay solicitudes pendientes.",
  },
  renewals: {
    title: "Por renovar",
    copy: "Negocios vencidos, suspendidos o pendientes de pago.",
    empty: "No hay negocios por renovar.",
  },
  activity: {
    title: "Última actividad",
    copy: "Negocios modificados recientemente.",
    empty: "No hay actividad reciente.",
  },
};

function formatShortDate(value = "") {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("es-CO", { month: "short", day: "numeric" });
}

function getLatestActivityLabel(businesses = []) {
  const latest = businesses
    .map((business) => new Date(business.updatedAt || "").getTime())
    .filter((time) => Number.isFinite(time))
    .sort((left, right) => right - left)[0];
  if (!latest) return "-";

  const today = new Date();
  const latestDate = new Date(latest);
  if (latestDate.toDateString() === today.toDateString()) return "Hoy";
  return latestDate.toLocaleDateString("es-CO", { month: "short", day: "numeric" });
}

function AgencyMetricCard({ label, value, active, onClick }) {
  return (
    <button className={`agency-metric-card ${active ? "is-active" : ""}`.trim()} type="button" onClick={onClick}>
      <span>{label}</span>
      <strong>{value}</strong>
    </button>
  );
}

function AgencyBusinessCard({ business }) {
  const initials = String(business.businessName || "N").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const modules = [
    business.moduleAccess?.commerce ? "Comercio" : "",
    business.moduleAccess?.booking ? "Agenda" : "",
  ].filter(Boolean).join(" · ") || "Enlaces";
  const updatedAt = formatShortDate(business.updatedAt);
  return (
    <article className="agency-business-card">
      <div className="agency-business-avatar">
        {business.photo ? <img src={business.photo} alt={business.businessName} /> : initials}
      </div>
      <div className="agency-business-copy">
        <strong>{business.businessName}</strong>
        <span>{business.publicUrl || business.email}</span>
        <small>{modules}</small>
      </div>
      <span className={`status-badge ${business.status === "active" ? "success" : ""}`}>{business.status}</span>
      <span className="agency-business-updated">{updatedAt}</span>
      <div className="agency-business-actions">
        <Link className="btn btn-secondary" href={`/agencia/negocios/${business.uid}`}>
          <ExternalLink size={16} /> Administrar
        </Link>
      </div>
    </article>
  );
}

function getRequestStatusLabel(request = {}) {
  if (request.expired) return "Vencida";
  if (request.status === "pending") return "Pendiente";
  if (request.status === "accepted") return "Aceptada";
  if (request.status === "rejected") return "Rechazada";
  if (request.status === "revoked") return "Revocada";
  return request.status || "Sin estado";
}

function AgencyRequestCard({ request }) {
  return (
    <article className="agency-request-card">
      <Clock3 size={17} />
      <div>
        <strong>{request.businessName || request.businessEmail}</strong>
        <span>{request.businessEmail}</span>
        <span>{getRequestStatusLabel(request)} · vence: {request.expiresAt ? new Date(request.expiresAt).toLocaleDateString("es-CO") : "Sin fecha"}</span>
        {request.expired ? <small>Si ya pasaron 24 horas desde el vencimiento, puedes enviar una nueva solicitud.</small> : null}
      </div>
    </article>
  );
}

export function AgencyPageClient() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [token, setToken] = useState("");
  const [agencyData, setAgencyData] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [activeFilter, setActiveFilter] = useState("businesses");
  const [requestForm, setRequestForm] = useState({
    businessEmail: "",
    message: "Hola, queremos ayudarte a configurar tu Klicor.",
  });
  const [sendingRequest, setSendingRequest] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      if (!user) return;
      const nextToken = await getFreshAuthToken();
      setToken(nextToken);
      const data = await apiFetch("/api/agency/me", { token: nextToken });
      setAgencyData(data);
    }

    bootstrap().catch((nextError) => setError(nextError.message));
  }, [user]);

  async function refreshAgencyData(nextToken = token) {
    const data = await apiFetch("/api/agency/me", { token: nextToken });
    setAgencyData(data);
  }

  async function submitAccessRequest(event) {
    event.preventDefault();
    setSendingRequest(true);
    setError("");
    setMessage("");
    try {
      await apiFetch("/api/agency/request-access", {
        method: "POST",
        token,
        body: requestForm,
      });
      setMessage("Solicitud enviada al negocio.");
      setActiveFilter("pending");
      setRequestForm((current) => ({ ...current, businessEmail: "" }));
      await refreshAgencyData();
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setSendingRequest(false);
    }
  }

  async function handleLogout() {
    const auth = getClientAuth();
    if (!auth) return;
    await signOut(auth);
    router.replace("/");
  }

  const businesses = agencyData?.businesses || [];
  const requests = agencyData?.requests || [];
  const pendingRequests = requests.filter((request) => request.status === "pending" && !request.expired);
  const pendingAndExpiredRequests = requests.filter((request) => request.status === "pending");
  const renewalBusinesses = businesses.filter((business) => ["expired", "pending_payment", "suspended", "grace_period"].includes(business.status));
  const recentBusinesses = useMemo(() => (
    [...businesses].sort((left, right) => new Date(right.updatedAt || 0).getTime() - new Date(left.updatedAt || 0).getTime())
  ), [businesses]);
  const activeMeta = FILTERS[activeFilter] || FILTERS.businesses;
  const visibleBusinesses = activeFilter === "renewals"
    ? renewalBusinesses
    : activeFilter === "activity"
      ? recentBusinesses
      : businesses;
  const visibleRequests = activeFilter === "pending" ? pendingAndExpiredRequests : [];
  const latestActivityLabel = getLatestActivityLabel(businesses);

  if (loading) {
    return (
      <main className="agency-page-shell">
        <div className="agency-loading">
          <Loader2 size={20} className="spin" /> Preparando acceso de agencia...
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="agency-page-shell is-auth">
        <AuthForm
          allowRegister={false}
          title="Acceso para agencias"
          description="Inicia sesión con el correo autorizado por Klicor para administrar negocios vinculados."
          googleLabel="Entrar con Google"
          submitLabel="Entrar con correo"
          onSuccess={() => window.location.assign("/agencia")}
        />
      </main>
    );
  }

  if (error && !agencyData) {
    return (
      <main className="agency-page-shell is-auth">
        <section className="panel stack" style={{ maxWidth: 620 }}>
          <span className="pill"><ShieldCheck size={15} /> Acceso de agencia</span>
          <h1>Acceso restringido</h1>
          <p className="muted">{error}</p>
          <div className="actions">
            <Link className="btn btn-secondary" href="/dashboard">Volver al dashboard</Link>
            <button className="btn btn-secondary" type="button" onClick={handleLogout}>Cerrar sesión</button>
          </div>
        </section>
      </main>
    );
  }

  if (!agencyData) {
    return (
      <main className="agency-page-shell">
        <div className="agency-loading">
          <Loader2 size={20} className="spin" /> Validando agencia autorizada...
        </div>
      </main>
    );
  }

  return (
    <main className="agency-page-shell">
      <section className="agency-layout">
        <aside className="agency-sidebar">
          <div className="agency-sidebar-brand">
            <div className="agency-sidebar-mark">
              <Building2 size={20} />
            </div>
            <div>
              <strong>Agencias Klicor</strong>
              <small>Acceso autorizado</small>
            </div>
          </div>

          <div className="agency-sidebar-note">
            <ShieldCheck size={18} />
            <div>
              <strong>Control del negocio</strong>
              <span>El dueño puede revocar el acceso cuando quiera.</span>
            </div>
          </div>
        </aside>

        <section className="agency-main">
          <header className="agency-hero">
            <div>
              <span className="pill"><KeyRound size={15} /> MVP operativo</span>
              <h1>{agencyData.agency?.agencyName || "Dashboard de agencia"}</h1>
              <p>Solicita acceso a negocios existentes y administra los Klicor que aceptaron tu solicitud.</p>
            </div>
            <div className="agency-hero-actions">
              <Link className="btn btn-secondary" href="/dashboard">Mi dashboard</Link>
              <button className="btn btn-secondary" type="button" onClick={handleLogout}>Cerrar sesión</button>
            </div>
          </header>

          <section className="agency-access-warning">
            <ShieldCheck size={18} />
            <div>
              <strong>Agencia autorizada</strong>
              <span>Tu correo está habilitado por Klicor. Los negocios pueden revocar el acceso cuando quieran.</span>
            </div>
          </section>

          {message ? <p className="notice notice-success">{message}</p> : null}
          {error ? <p className="notice notice-danger">{error}</p> : null}

          <section className="agency-metric-grid" aria-label="Filtros de agencia">
            <AgencyMetricCard label="Negocios vinculados" value={businesses.length} active={activeFilter === "businesses"} onClick={() => setActiveFilter("businesses")} />
            <AgencyMetricCard label="Solicitudes pendientes" value={pendingRequests.length} active={activeFilter === "pending"} onClick={() => setActiveFilter("pending")} />
            <AgencyMetricCard label="Por renovar" value={renewalBusinesses.length} active={activeFilter === "renewals"} onClick={() => setActiveFilter("renewals")} />
            <AgencyMetricCard label="Última actividad" value={latestActivityLabel} active={activeFilter === "activity"} onClick={() => setActiveFilter("activity")} />
          </section>

          <section className="agency-grid">
            <section className="agency-panel">
              <div className="agency-section-heading">
                <div>
                  <h2>{activeMeta.title}</h2>
                  <p>{activeMeta.copy}</p>
                </div>
              </div>

              {activeFilter === "pending" ? (
                <div className="agency-request-list is-wide">
                  {visibleRequests.length ? visibleRequests.map((request) => (
                    <AgencyRequestCard key={request.id} request={request} />
                  )) : <p className="muted">{activeMeta.empty}</p>}
                </div>
              ) : (
                <div className="agency-business-list">
                  {visibleBusinesses.length ? visibleBusinesses.map((business) => (
                    <AgencyBusinessCard key={business.uid} business={business} />
                  )) : <p className="muted">{activeMeta.empty}</p>}
                </div>
              )}
            </section>

            <aside className="agency-side-stack">
              <section className="agency-panel">
                <div className="agency-section-heading">
                  <div>
                    <h2>Solicitud rápida</h2>
                    <p>Se solicitará por correo exacto del negocio.</p>
                  </div>
                </div>
                <form className="agency-request-form" onSubmit={submitAccessRequest}>
                  <label className="label" htmlFor="agency-request-email">Correo del negocio</label>
                  <input
                    id="agency-request-email"
                    className="input"
                    type="email"
                    value={requestForm.businessEmail}
                    onChange={(event) => setRequestForm((current) => ({ ...current, businessEmail: event.target.value }))}
                    placeholder="cliente@negocio.com"
                    required
                  />
                  <textarea
                    className="textarea"
                    rows={4}
                    value={requestForm.message}
                    onChange={(event) => setRequestForm((current) => ({ ...current, message: event.target.value }))}
                  />
                  <button className="btn btn-primary" type="submit" disabled={sendingRequest}>
                    {sendingRequest ? "Enviando..." : "Enviar solicitud"}
                  </button>
                </form>
              </section>

              {activeFilter !== "pending" ? (
                <section className="agency-panel">
                  <div className="agency-section-heading">
                    <div>
                      <h2>Solicitudes pendientes</h2>
                      <p>Vencen a los 7 días.</p>
                    </div>
                  </div>
                  <div className="agency-request-list">
                    {pendingRequests.length ? pendingRequests.slice(0, 4).map((request) => (
                      <AgencyRequestCard key={request.id} request={request} />
                    )) : <p className="muted">No hay solicitudes pendientes.</p>}
                  </div>
                </section>
              ) : null}
            </aside>
          </section>
        </section>
      </section>
    </main>
  );
}
