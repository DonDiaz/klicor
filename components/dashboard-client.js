"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Script from "next/script";
import { AlertTriangle, Send, ShieldAlert } from "lucide-react";
import { sendEmailVerification, signOut } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase-client";
import { apiFetch, getFreshAuthToken } from "@/lib/client-api";
import { useAuth } from "@/components/providers/auth-provider";
import { needsDashboardOnboarding } from "@/lib/dashboard-onboarding";

const ProfileForm = dynamic(
  () => import("@/components/profile-form").then((mod) => mod.ProfileForm),
  {
    loading: () => (
      <section className="card dashboard-section">
        <strong>Preparando editor</strong>
        <p className="section-copy">Estamos cargando tu panel de edición y la vista previa.</p>
      </section>
    ),
  },
);

const DashboardOnboarding = dynamic(
  () => import("@/components/dashboard-onboarding").then((mod) => mod.DashboardOnboarding),
  {
    loading: () => (
      <section className="card dashboard-section">
        <strong>Preparando configuración inicial</strong>
        <p className="section-copy">Estamos cargando el asistente para crear tu primer Klicor.</p>
      </section>
    ),
  },
);

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
  const [shouldLoadCheckoutSdk, setShouldLoadCheckoutSdk] = useState(false);
  const [recovery, setRecovery] = useState({
    backupEmail: "",
    backupEmailVerified: false,
    recoveryPhone: "",
    recoveryPhoneVerified: false,
    backupEmailVerificationExpiresAt: null,
  });
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [dismissOnboarding, setDismissOnboarding] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      if (!user) return;
      const nextToken = await getFreshAuthToken();
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

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [loading, router, user]);

  const canEdit = useMemo(() => {
    const status = data?.user?.status;
    return status === "trial" || status === "active";
  }, [data]);

  const shouldShowOnboarding = useMemo(() => {
    if (!data?.user) return false;
    return needsDashboardOnboarding(data.user) && !dismissOnboarding;
  }, [data?.user, dismissOnboarding]);

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
      setError("No pudimos iniciar el proceso oficial de pago de Mercado Pago.");
    } finally {
      setPaying(false);
    }
  }, [checkoutConfig, sdkReady, data?.user?.status]);

  async function handleCheckout() {
    setPaying(true);
    setError("");
    setShouldLoadCheckoutSdk(true);
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
    setError("Te reenviamos el correo de verificación.");
  }

  async function handleLogout() {
    const auth = getClientAuth();
    if (!auth) return;
    setLoggingOut(true);
    await signOut(auth);
    router.replace("/");
  }

  async function handleCopyPublicUrl() {
    const nextUrl = data?.shareUrl || data?.publicUrl;
    if (!nextUrl) return;
    try {
      await navigator.clipboard.writeText(nextUrl);
      setError("Enlace copiado y listo para compartir.");
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
      link.download = `${data?.user?.username || "klicor"}-qr.png`;
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
          ? "Guardamos tus datos y enviamos la verificación al correo de respaldo."
          : "Datos de recuperación actualizados.",
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
      setRecoveryMessage("Reenviamos la verificación al correo de respaldo.");
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
    return <main className="shell page-shell"><div className="kpi">Redirigiendo al inicio...</div></main>;
  }

  if (!data) {
    return <main className="shell page-shell"><div className="kpi">Preparando tu panel...</div></main>;
  }

  const isAdmin = data.user.role === "admin";

  function handleRecoveryFieldChange(field, value) {
    setRecovery((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleUserSaved(userData) {
    setData((current) => ({
      ...current,
      user: {
        ...current.user,
        ...userData,
        billingProfile: userData.billingProfile || current.user?.billingProfile || {},
      },
      publicUrl: userData.username ? `${window.location.origin}/${userData.username}` : "",
      shareUrl: userData.shareUrl || current.shareUrl,
      stablePublicUrl: userData.stablePublicUrl || current.stablePublicUrl,
    }));
  }

  return (
    <main className="shell dashboard-shell">
      {shouldLoadCheckoutSdk ? (
        <Script src="https://sdk.mercadopago.com/js/v2" strategy="afterInteractive" onLoad={() => setSdkReady(true)} />
      ) : null}

      <div className="dashboard-body">
        {!user.emailVerified ? (
          <div className="notice notice-danger">
            <ShieldAlert size={16} />
            <span>Debes verificar tu correo para completar el flujo comercial.</span>
            <button className="btn btn-secondary" type="button" onClick={handleSendVerification}>
              <Send size={16} /> Reenviar verificación
            </button>
          </div>
        ) : null}

        {data.user.status === "grace_period" ? (
          <div className="notice">
            <AlertTriangle size={16} />
            <span>Tu suscripción venció. Tienes 15 días sin edición antes de suspender la página.</span>
          </div>
        ) : null}

        {data.user.status === "suspended" ? (
          <div className="notice notice-danger">
            <ShieldAlert size={16} />
            <span>Tu página está suspendida hasta registrar el pago anual.</span>
          </div>
        ) : null}

        {shouldShowOnboarding ? (
          <DashboardOnboarding
            token={token}
            profile={data.user}
            onCompleted={async (userData) => {
              handleUserSaved({
                ...userData,
                onboardingCompleted: true,
              });
              setDismissOnboarding(true);
              router.replace("/dashboard");
              router.refresh();
            }}
            onSkip={() => setDismissOnboarding(true)}
          />
        ) : (
          <ProfileForm
            token={token}
            profile={data.user}
            canEdit={canEdit}
            isAdmin={isAdmin}
            subscriptionSettings={data.settings}
            userEmailVerified={user.emailVerified}
            paying={paying}
            checkoutConfig={checkoutConfig}
            recovery={recovery}
            recoveryLoading={recoveryLoading}
            recoveryMessage={recoveryMessage}
            onRecoveryFieldChange={handleRecoveryFieldChange}
            onSaveRecovery={saveRecoverySettings}
            onResendRecoveryVerification={resendRecoveryVerification}
            onCheckout={handleCheckout}
            publicUrl={data.publicUrl}
            onCopyPublicUrl={handleCopyPublicUrl}
            onDownloadQr={handleQrDownload}
            onLogout={handleLogout}
            onSaved={handleUserSaved}
          />
        )}

        {error ? <p className="notice">{error}</p> : null}
      </div>
    </main>
  );
}
