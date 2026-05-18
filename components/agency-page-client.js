"use client";

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
import { getClientAuth } from "@/lib/firebase-client";

const MOCK_BUSINESSES = [
  {
    id: "demo-1",
    name: "Café Aurora",
    url: "klicor.com/cafe-aurora",
    status: "Activo",
    modules: "Enlaces · Comercio",
    updatedAt: "Hoy",
    initials: "CA",
  },
  {
    id: "demo-2",
    name: "Barbería Norte",
    url: "klicor.com/barberia-norte",
    status: "Trial",
    modules: "Enlaces · Agenda",
    updatedAt: "Ayer",
    initials: "BN",
  },
];

const MOCK_REQUESTS = [
  {
    id: "request-1",
    businessEmail: "cliente@negocio.com",
    status: "Pendiente",
    expiresAt: "Vence en 7 días",
  },
];

function AgencyMetricCard({ label, value }) {
  return (
    <article className="agency-metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function AgencyBusinessCard({ business }) {
  return (
    <article className="agency-business-card">
      <div className="agency-business-avatar">{business.initials}</div>
      <div className="agency-business-copy">
        <strong>{business.name}</strong>
        <span>{business.url}</span>
        <small>{business.modules}</small>
      </div>
      <span className="status-badge success">{business.status}</span>
      <span className="agency-business-updated">{business.updatedAt}</span>
      <div className="agency-business-actions">
        <button className="btn btn-secondary" type="button" disabled>
          <ExternalLink size={16} /> Administrar
        </button>
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
              <h1>Dashboard de agencia</h1>
              <p>Desde aquí una agencia autorizada solicitará acceso y administrará negocios vinculados sin pedir contraseñas.</p>
            </div>
            <div className="agency-hero-actions">
              <Link className="btn btn-secondary" href="/dashboard">Mi dashboard</Link>
              <button className="btn btn-secondary" type="button" onClick={handleLogout}>Cerrar sesión</button>
            </div>
          </header>

          <section className="agency-access-warning">
            <ShieldCheck size={18} />
            <div>
              <strong>Falta conectar autorización real</strong>
              <span>Esta pantalla es la base visual. La siguiente fase bloquea el acceso si el correo no está habilitado por admin.</span>
            </div>
          </section>

          <section className="agency-metric-grid" aria-label="Resumen de agencia">
            <AgencyMetricCard label="Negocios vinculados" value={MOCK_BUSINESSES.length} />
            <AgencyMetricCard label="Solicitudes pendientes" value={MOCK_REQUESTS.length} />
            <AgencyMetricCard label="Por renovar" value="0" />
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
                {MOCK_BUSINESSES.map((business) => (
                  <AgencyBusinessCard key={business.id} business={business} />
                ))}
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
                <div className="agency-request-form">
                  <label className="label" htmlFor="agency-demo-email">Correo del negocio</label>
                  <input id="agency-demo-email" className="input" value="cliente@negocio.com" readOnly />
                  <textarea className="textarea" rows={4} value="Hola, queremos ayudarte a configurar tu Klicor." readOnly />
                  <button className="btn btn-primary" type="button" disabled>Enviar solicitud</button>
                </div>
              </section>

              <section className="agency-panel">
                <div className="agency-section-heading">
                  <div>
                    <h2>Solicitudes</h2>
                    <p>Vencen a los 7 días.</p>
                  </div>
                </div>
                <div className="agency-request-list">
                  {MOCK_REQUESTS.map((request) => (
                    <article key={request.id} className="agency-request-card">
                      <Clock3 size={17} />
                      <div>
                        <strong>{request.businessEmail}</strong>
                        <span>{request.status} · {request.expiresAt}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </aside>
          </section>
        </section>
      </section>
    </main>
  );
}
