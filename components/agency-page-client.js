"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import {
  BarChart3,
  Building2,
  Clock3,
  ExternalLink,
  KeyRound,
  Loader2,
  MailPlus,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import { AuthForm } from "@/components/auth-form";
import { useAuth } from "@/components/providers/auth-provider";
import { apiFetch, getFreshAuthToken } from "@/lib/client-api";
import { getClientAuth } from "@/lib/firebase-client";

function AgencyMetricCard({ label, value }) {
  return (
    <article className="agency-metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function AgencyBusinessCard({ business }) {
  const initials = String(business.businessName || "N").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const modules = [
    business.moduleAccess?.commerce ? "Comercio" : "",
    business.moduleAccess?.booking ? "Agenda" : "",
  ].filter(Boolean).join(" · ") || "Enlaces";
  const updatedAt = business.updatedAt ? new Date(business.updatedAt).toLocaleDateString("es-CO", { month: "short", day: "numeric" }) : "-";
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
        <button className="btn btn-secondary" type="button" disabled>
          <QrCode size={16} /> QR
        </button>
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

  const businesses = agencyData.businesses || [];
  const requests = agencyData.requests || [];
  const pendingRequests = requests.filter((request) => request.status === "pending" && !request.expired);
  const renewalCount = businesses.filter((business) => ["expired", "pending_payment", "suspended"].includes(business.status)).length;

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

          <nav className="agency-nav" aria-label="Secciones de agencia">
            <button className="agency-nav-item is-active" type="button">
              <Building2 size={18} />
              <span>Negocios</span>
            </button>
            <button className="agency-nav-item" type="button" disabled>
              <MailPlus size={18} />
              <span>Solicitudes</span>
            </button>
            <button className="agency-nav-item" type="button" disabled>
              <BarChart3 size={18} />
              <span>Analíticas</span>
            </button>
          </nav>

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
              <span className="pill"><KeyRound size={15} /> MVP visual</span>
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

          <section className="agency-metric-grid" aria-label="Resumen de agencia">
            <AgencyMetricCard label="Negocios vinculados" value={businesses.length} />
            <AgencyMetricCard label="Solicitudes pendientes" value={pendingRequests.length} />
            <AgencyMetricCard label="Por renovar" value={renewalCount} />
            <AgencyMetricCard label="Última actividad" value="Hoy" />
          </section>

          <section className="agency-grid">
            <section className="agency-panel">
              <div className="agency-section-heading">
                <div>
                  <h2>Negocios vinculados</h2>
                  <p>La agencia verá aquí solo negocios que aceptaron su solicitud.</p>
                </div>
                <button className="btn btn-primary" type="button" disabled>
                  <MailPlus size={16} /> Solicitar acceso
                </button>
              </div>

              <div className="agency-business-list">
                {businesses.length ? businesses.map((business) => (
                  <AgencyBusinessCard key={business.uid} business={business} />
                )) : <p className="muted">Aún no tienes negocios vinculados.</p>}
              </div>
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
                  <label className="label" htmlFor="agency-demo-email">Correo del negocio</label>
                  <input
                    id="agency-demo-email"
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

              <section className="agency-panel">
                <div className="agency-section-heading">
                  <div>
                    <h2>Solicitudes</h2>
                    <p>Vencen a los 7 días.</p>
                  </div>
                </div>
                <div className="agency-request-list">
                  {requests.length ? requests.map((request) => (
                    <article key={request.id} className="agency-request-card">
                      <Clock3 size={17} />
                      <div>
                        <strong>{request.businessEmail}</strong>
                        <span>{request.status} · {request.expired ? "Vencida" : request.expiresAt ? new Date(request.expiresAt).toLocaleDateString("es-CO") : "Sin fecha"}</span>
                      </div>
                    </article>
                  )) : <p className="muted">No hay solicitudes todavía.</p>}
                </div>
              </section>
            </aside>
          </section>
        </section>
      </section>
    </main>
  );
}
