"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { sendEmailVerification, signOut } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase-client";
import { apiFetch } from "@/lib/client-api";
import { useAuth } from "@/components/providers/auth-provider";
import { ProfileForm } from "@/components/profile-form";

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
    return <main className="shell" style={{ padding: "4rem 0" }}><div className="panel">Cargando...</div></main>;
  }

  if (!user) {
    return (
      <main className="shell" style={{ padding: "4rem 0" }}>
        <div className="panel stack">
          <p>Necesitas iniciar sesión para ver tu dashboard.</p>
          <Link className="btn btn-primary" href="/login">Ir a login</Link>
        </div>
      </main>
    );
  }

  if (!data) {
    return <main className="shell" style={{ padding: "4rem 0" }}><div className="panel">Preparando tu panel...</div></main>;
  }

  const isAdmin = data.user.role === "admin";

  return (
    <main className="shell" style={{ padding: "2rem 0 4rem" }}>
      <div className="topbar">
        <div>
          <span className="pill">Dashboard</span>
          <h1 style={{ marginBottom: ".3rem" }}>{data.user.businessName || "Tu negocio"}</h1>
          <p className="muted">Plan {data.user.plan} · Estado {data.user.status}</p>
        </div>
        <div className="actions">
          {isAdmin ? <Link className="btn btn-secondary" href="/admin">Panel admin</Link> : null}
          <button className="btn btn-secondary" type="button" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </div>
      {!user.emailVerified ? (
        <div className="notice notice-danger" style={{ marginBottom: "1rem" }}>
          Debes verificar tu correo para completar el flujo comercial. <button className="btn btn-secondary" type="button" onClick={handleSendVerification}>Reenviar verificación</button>
        </div>
      ) : null}
      {data.user.status === "grace_period" ? <div className="notice" style={{ marginBottom: "1rem" }}>Tu suscripción venció. Tienes 15 días sin edición antes de suspender la landing.</div> : null}
      {data.user.status === "suspended" ? <div className="notice notice-danger" style={{ marginBottom: "1rem" }}>Tu landing está suspendida hasta registrar el pago anual.</div> : null}
      <div className="grid-3" style={{ marginBottom: "1rem" }}>
        <div className="kpi"><strong>URL pública</strong><p className="muted">{data.publicUrl || "Aún no definida"}</p></div>
        <div className="kpi"><strong>QR</strong><p className="muted">{data.user.qrUrl ? "Listo para descargar" : "Se genera al guardar username"}</p></div>
        <div className="kpi"><strong>Precio actual</strong><p className="muted">${Intl.NumberFormat("es-CO").format(data.settings.annualPrice)} COP / año</p></div>
      </div>
      <section className="card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
        <div className="topbar">
          <div>
            <h2 style={{ marginBottom: ".25rem" }}>Perfil y landing</h2>
            <p className="muted">Puedes cambiar el username solo una vez cada 30 días. Si cambia, regeneramos el QR automáticamente.</p>
          </div>
        </div>
        <ProfileForm token={token} profile={data.user} canEdit={canEdit} onSaved={(userData) => setData({ ...data, user: userData, publicUrl: userData.username ? `${window.location.origin}/${userData.username}` : "" })} />
      </section>
      <section className="card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
        <div className="topbar">
          <div>
            <h2 style={{ marginBottom: ".25rem" }}>Suscripción anual</h2>
            <p className="muted">Renovación manual cada año por Mercado Pago.</p>
          </div>
          <button className="btn btn-primary" type="button" onClick={handleCheckout} disabled={paying || !user.emailVerified}>{paying ? "Abriendo checkout..." : data.user.status === "active" ? "Renovar" : "Activar plan"}</button>
        </div>
        <p className="muted">Prueba hasta: {data.user.trialEndsAtLabel || "-"} · Expira: {data.user.expiresAtLabel || "-"}</p>
      </section>
      {error ? <p className="notice" style={{ marginTop: "1rem" }}>{error}</p> : null}
    </main>
  );
}
