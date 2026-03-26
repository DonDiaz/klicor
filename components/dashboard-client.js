"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, CreditCard, LogOut, Send, ShieldAlert } from "lucide-react";
import { sendEmailVerification, signOut } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase-client";
import { apiFetch } from "@/lib/client-api";
import { useAuth } from "@/components/providers/auth-provider";
import { ProfileForm } from "@/components/profile-form";

function getStatusTone(status) {
  if (status === "active" || status === "trial") return "success";
  if (status === "grace_period") return "warning";
  if (status === "suspended") return "danger";
  return "";
}

export function DashboardClient() {
  const { user, loading } = useAuth();
  const [token, setToken] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      if (!user) return;
      const nextToken = await user.getIdToken(true);
      setToken(nextToken);
      const payload = await apiFetch("/api/me", { token: nextToken });
      setData(payload);
    }

    bootstrap().catch((err) => setError(err.message));
  }, [user]);

  const canEdit = useMemo(() => {
    const status = data?.user?.status;
    return status === "trial" || status === "active";
  }, [data]);

  async function handleCheckout() {
    setPaying(true);
    try {
      const response = await apiFetch("/api/billing/create-preference", {
        method: "POST",
        token,
      });
      window.location.href = response.initPoint;
    } catch (nextError) {
      setError(nextError.message);
      setPaying(false);
    }
  }

  async function handleSendVerification() {
    const auth = getClientAuth();
    if (!auth?.currentUser) return;
    await sendEmailVerification(auth.currentUser);
    setError("Te reenviamos el correo de verificación.");
  }

  async function handleLogout() {
    const auth = getClientAuth();
    if (!auth) return;
    await signOut(auth);
  }

  if (loading) {
    return <main className="shell page-shell"><div className="kpi">Cargando panel...</div></main>;
  }

  if (!user) {
    return (
      <main className="shell page-shell">
        <div className="card dashboard-section">
          <p>Necesitas iniciar sesión para ver tu dashboard.</p>
          <Link className="btn btn-primary" href="/login">Ir a login</Link>
        </div>
      </main>
    );
  }

  if (!data) {
    return <main className="shell page-shell"><div className="kpi">Preparando tu panel...</div></main>;
  }

  const isAdmin = data.user.role === "admin";
  const statusTone = getStatusTone(data.user.status);

  return (
    <main className="shell dashboard-shell">
      <header className="dashboard-header">
        <div className="stack" style={{ gap: ".65rem" }}>
          <div className="logo-mark">
            <span className="logo-badge">L</span>
            <span>Linka</span>
          </div>
          <div className="stack" style={{ gap: ".45rem" }}>
            <h1 className="section-title" style={{ fontSize: "2.1rem" }}>{data.user.businessName || "Tu negocio"}</h1>
            <p className="section-copy">Gestiona tu perfil, tus enlaces, la apariencia y tu QR en un solo lugar.</p>
          </div>
          <div className={`status-badge ${statusTone}`}>
            {statusTone === "success" ? <CheckCircle2 size={14} /> : statusTone === "warning" ? <AlertTriangle size={14} /> : <ShieldAlert size={14} />}
            <span>{data.user.plan} · {data.user.status}</span>
          </div>
        </div>

        <div className="actions">
          {isAdmin ? <Link className="btn btn-secondary" href="/admin">Panel admin</Link> : null}
          <button className="btn btn-secondary" type="button" onClick={handleLogout}><LogOut size={16} /> Cerrar sesión</button>
        </div>
      </header>

      <div className="grid-3">
        <div className="kpi">
          <strong>URL pública</strong>
          <p className="muted" style={{ marginTop: ".5rem" }}>{data.publicUrl || "Aún no definida"}</p>
        </div>
        <div className="kpi">
          <strong>QR</strong>
          <p className="muted" style={{ marginTop: ".5rem" }}>{data.user.qrUrl ? "Listo para descargar" : "Se genera al guardar el username"}</p>
        </div>
        <div className="kpi">
          <strong>Plan actual</strong>
          <p className="muted" style={{ marginTop: ".5rem" }}>{Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(data.settings.annualPrice)}</p>
        </div>
      </div>

      {!user.emailVerified ? (
        <div className="notice notice-danger">
          <ShieldAlert size={16} />
          <span>Debes verificar tu correo para completar el flujo comercial.</span>
          <button className="btn btn-secondary" type="button" onClick={handleSendVerification}><Send size={16} /> Reenviar verificación</button>
        </div>
      ) : null}

      {data.user.status === "grace_period" ? (
        <div className="notice">
          <AlertTriangle size={16} />
          <span>Tu suscripción venció. Tienes 15 días sin edición antes de suspender la landing.</span>
        </div>
      ) : null}

      {data.user.status === "suspended" ? (
        <div className="notice notice-danger">
          <ShieldAlert size={16} />
          <span>Tu página está suspendida hasta registrar el pago anual.</span>
        </div>
      ) : null}

      <ProfileForm
        token={token}
        profile={data.user}
        canEdit={canEdit}
        onSaved={(userData) => setData({
          ...data,
          user: userData,
          publicUrl: userData.username ? `${window.location.origin}/${userData.username}` : "",
        })}
      />

      <section className="card qr-card">
        <div className="dashboard-section-head">
          <div>
            <h2 className="section-title">Suscripción</h2>
            <p className="section-copy">Renovación manual anual mediante Mercado Pago.</p>
          </div>
          <span className="status-badge">{Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(data.settings.annualPrice)}</span>
        </div>

        <div className="grid-3">
          <div className="kpi">
            <strong>Prueba hasta</strong>
            <p className="muted" style={{ marginTop: ".5rem" }}>{data.user.trialEndsAtLabel || "-"}</p>
          </div>
          <div className="kpi">
            <strong>Expira</strong>
            <p className="muted" style={{ marginTop: ".5rem" }}>{data.user.expiresAtLabel || "-"}</p>
          </div>
          <div className="kpi">
            <strong>Renovación</strong>
            <p className="muted" style={{ marginTop: ".5rem" }}>Manual por Mercado Pago</p>
          </div>
        </div>

        <div className="actions">
          <button className="btn btn-primary" type="button" onClick={handleCheckout} disabled={paying || !user.emailVerified}>
            <CreditCard size={16} /> {paying ? "Abriendo checkout..." : data.user.status === "active" ? "Renovar plan" : "Activar plan"}
          </button>
        </div>
      </section>

      {error ? <p className="notice">{error}</p> : null}
    </main>
  );
}
