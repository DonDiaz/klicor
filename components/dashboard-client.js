"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { AlertTriangle, CheckCircle2, Copy, CreditCard, Download, ExternalLink, LogOut, Send, ShieldAlert } from "lucide-react";
import { sendEmailVerification, signOut } from "firebase/auth";
import { BrandLogo } from "@/components/brand-logo";
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

function getPlanLabel(plan) {
  if (plan === "annual") return "anual";
  return plan || "-";
}

export function DashboardClient() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [token, setToken] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [checkoutConfig, setCheckoutConfig] = useState(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [recovery, setRecovery] = useState({
    backupEmail: "",
    backupEmailVerified: false,
    recoveryPhone: "",
    recoveryPhoneVerified: false,
    backupEmailVerificationExpiresAt: null,
  });
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState("");

  useEffect(() => {
    async function bootstrap() {
      if (!user) return;
      const nextToken = await user.getIdToken(true);
      setToken(nextToken);
      const payload = await apiFetch("/api/me", { token: nextToken });
      setData(payload);
      setRecovery({
        backupEmail: payload.user.backupEmail || "",
        backupEmailVerified: Boolean(payload.user.backupEmailVerified),
        recoveryPhone: payload.user.recoveryPhone || "",
        recoveryPhoneVerified: Boolean(payload.user.recoveryPhoneVerified),
        backupEmailVerificationExpiresAt: payload.user.backupEmailVerificationExpiresAt || null,
      });
    }

    bootstrap().catch((err) => setError(err.message));
  }, [user]);

  const canEdit = useMemo(() => {
    const status = data?.user?.status;
    return status === "trial" || status === "active";
  }, [data]);

  useEffect(() => {
    if (!sdkReady || !checkoutConfig?.preferenceId || !checkoutConfig?.publicKey) return;
    if (!window.MercadoPago) return;

    const container = document.getElementById("mercadopago-checkout");
    if (!container) return;

    container.innerHTML = "";

    try {
      const mp = new window.MercadoPago(checkoutConfig.publicKey, { locale: "es-CO" });
      mp.checkout({
        preference: {
          id: checkoutConfig.preferenceId,
        },
        render: {
          container: "#mercadopago-checkout",
          label: data?.user?.status === "active" ? "Renovar con Mercado Pago" : "Pagar con Mercado Pago",
        },
      });
    } catch {
      setError("No pudimos inicializar el checkout oficial de Mercado Pago.");
    } finally {
      setPaying(false);
    }
  }, [checkoutConfig, sdkReady, data?.user?.status]);

  async function handleCheckout() {
    setPaying(true);
    setError("");
    try {
      const response = await apiFetch("/api/billing/create-preference", {
        method: "POST",
        token,
      });
      setCheckoutConfig(response);
    } catch (nextError) {
      setError(nextError.message);
      setPaying(false);
    }
  }

  async function handleSendVerification() {
    const auth = getClientAuth();
    if (!auth?.currentUser) return;
    await sendEmailVerification(auth.currentUser);
    setError("Te reenviamos el correo de verificacion.");
  }

  async function handleLogout() {
    const auth = getClientAuth();
    if (!auth) return;
    setLoggingOut(true);
    await signOut(auth);
    router.replace("/login");
  }

  async function handleCopyPublicUrl() {
    if (!data?.publicUrl) return;
    try {
      await navigator.clipboard.writeText(data.publicUrl);
      setError("Enlace copiado al portapapeles.");
    } catch {
      setError("No pudimos copiar el enlace.");
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
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "No se pudo descargar el QR");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${data?.user?.username || "linka"}-qr.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (nextError) {
      setError(nextError.message || "No se pudo descargar el QR");
    }
  }

  async function saveRecoverySettings() {
    setRecoveryLoading(true);
    setRecoveryMessage("");
    try {
      const response = await apiFetch("/api/recovery/settings", {
        method: "POST",
        token,
        body: {
          backupEmail: recovery.backupEmail,
          recoveryPhone: recovery.recoveryPhone,
        },
      });
      setRecovery((current) => ({
        ...current,
        ...response.user,
      }));
      setRecoveryMessage(
        response.verificationSent
          ? "Guardamos tus datos y enviamos la verificacion al correo de respaldo."
          : "Datos de recuperacion actualizados.",
      );
    } catch (nextError) {
      setRecoveryMessage(nextError.message);
    } finally {
      setRecoveryLoading(false);
    }
  }

  async function resendRecoveryVerification() {
    setRecoveryLoading(true);
    setRecoveryMessage("");
    try {
      await apiFetch("/api/recovery/settings", {
        method: "PUT",
        token,
      });
      setRecoveryMessage("Reenviamos la verificacion al correo de respaldo.");
    } catch (nextError) {
      setRecoveryMessage(nextError.message);
    } finally {
      setRecoveryLoading(false);
    }
  }

  if (loading || loggingOut) {
    return <main className="shell page-shell"><div className="kpi">Cargando panel...</div></main>;
  }

  if (!user) {
    router.replace("/login");
    return <main className="shell page-shell"><div className="kpi">Redirigiendo a login...</div></main>;
  }

  if (!data) {
    return <main className="shell page-shell"><div className="kpi">Preparando tu panel...</div></main>;
  }

  const isAdmin = data.user.role === "admin";
  const statusTone = getStatusTone(data.user.status);

  function handleRecoveryFieldChange(field, value) {
    setRecovery((current) => ({
      ...current,
      [field]: value,
    }));
  }

  return (
    <main className="shell dashboard-shell">
      <Script src="https://sdk.mercadopago.com/js/v2" strategy="afterInteractive" onLoad={() => setSdkReady(true)} />
      <header className="dashboard-header">
        <div className="stack" style={{ gap: ".65rem" }}>
          <BrandLogo />
          <div className="stack" style={{ gap: ".45rem" }}>
            <h1 className="section-title" style={{ fontSize: "2.1rem" }}>{data.user.businessName || "Tu negocio"}</h1>
            <p className="section-copy">Gestiona tu perfil, tus enlaces, la apariencia y tu QR en un solo lugar.</p>
          </div>
          <div className={`status-badge ${statusTone}`}>
            {statusTone === "success" ? <CheckCircle2 size={14} /> : statusTone === "warning" ? <AlertTriangle size={14} /> : <ShieldAlert size={14} />}
            <span>{getPlanLabel(data.user.plan)} - {data.user.status}</span>
          </div>
        </div>

        <div className="actions">
          {isAdmin ? <Link className="btn btn-secondary" href="/admin">Panel admin</Link> : null}
          <button className="btn btn-secondary" type="button" onClick={handleLogout}><LogOut size={16} /> Cerrar sesion</button>
        </div>
      </header>

      <div className="grid-3">
        <div className="kpi">
          <strong>URL publica</strong>
          <p className="muted" style={{ marginTop: ".5rem" }}>{data.publicUrl || "Aun no definida"}</p>
          {data.publicUrl ? (
            <div className="actions" style={{ marginTop: ".85rem" }}>
              <button className="btn btn-secondary" type="button" onClick={handleCopyPublicUrl}>
                <Copy size={16} /> Copiar link
              </button>
              <a className="btn btn-secondary" href={data.publicUrl} target="_blank" rel="noreferrer">
                <ExternalLink size={16} /> Abrir link
              </a>
            </div>
          ) : null}
        </div>
        <div className="kpi">
          <strong>QR</strong>
          <p className="muted" style={{ marginTop: ".5rem" }}>{data.user.qrUrl ? "Listo para descargar" : "Se genera al guardar el username"}</p>
          {data.user.qrUrl ? (
            <div className="actions" style={{ marginTop: ".85rem" }}>
              <button className="btn btn-secondary" type="button" onClick={handleQrDownload}>
                <Download size={16} /> Descargar QR
              </button>
            </div>
          ) : null}
        </div>
        <div className="kpi">
          <strong>Plan actual</strong>
          <p className="muted" style={{ marginTop: ".5rem" }}>
            {Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(data.settings.annualPrice)}
          </p>
        </div>
      </div>

      {!user.emailVerified ? (
        <div className="notice notice-danger">
          <ShieldAlert size={16} />
          <span>Debes verificar tu correo para completar el flujo comercial.</span>
          <button className="btn btn-secondary" type="button" onClick={handleSendVerification}><Send size={16} /> Reenviar verificacion</button>
        </div>
      ) : null}

      {data.user.status === "grace_period" ? (
        <div className="notice">
          <AlertTriangle size={16} />
          <span>Tu suscripcion vencio. Tienes 15 dias sin edicion antes de suspender la landing.</span>
        </div>
      ) : null}

      {data.user.status === "suspended" ? (
        <div className="notice notice-danger">
          <ShieldAlert size={16} />
          <span>Tu pagina esta suspendida hasta registrar el pago anual.</span>
        </div>
      ) : null}

      <ProfileForm
        token={token}
        profile={data.user}
        canEdit={canEdit}
        recovery={recovery}
        recoveryLoading={recoveryLoading}
        recoveryMessage={recoveryMessage}
        onRecoveryFieldChange={handleRecoveryFieldChange}
        onSaveRecovery={saveRecoverySettings}
        onResendRecoveryVerification={resendRecoveryVerification}
        onSaved={(userData) => setData({
          ...data,
          user: userData,
          publicUrl: userData.username ? `${window.location.origin}/${userData.username}` : "",
        })}
      />

      <section className="card qr-card">
        <div className="dashboard-section-head">
          <div>
            <h2 className="section-title">Suscripcion</h2>
            <p className="section-copy">Renovacion manual anual mediante Mercado Pago.</p>
          </div>
          <span className="status-badge">
            {Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(data.settings.annualPrice)}
          </span>
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
            <strong>Renovacion</strong>
            <p className="muted" style={{ marginTop: ".5rem" }}>Manual por Mercado Pago</p>
          </div>
        </div>

        <div className="actions">
          <button className="btn btn-primary" type="button" onClick={handleCheckout} disabled={paying || !user.emailVerified}>
            <CreditCard size={16} /> {paying ? "Abriendo checkout..." : data.user.status === "active" ? "Renovar plan" : "Activar plan"}
          </button>
        </div>

        {checkoutConfig ? (
          <div className="stack" style={{ gap: ".85rem", marginTop: "1rem" }}>
            <p className="muted">Checkout oficial de Mercado Pago cargado segun documentacion. Si no responde, puedes continuar con el fallback.</p>
            <div id="mercadopago-checkout" />
            <button className="btn btn-secondary" type="button" onClick={() => window.location.href = checkoutConfig.initPoint}>
              Abrir checkout por redireccion
            </button>
          </div>
        ) : null}
      </section>

      {error ? <p className="notice">{error}</p> : null}
    </main>
  );
}
