"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { apiFetch, getFreshAuthToken } from "@/lib/client-api";
import { useAuth } from "@/components/providers/auth-provider";

const ProfileForm = dynamic(
  () => import("@/components/profile-form").then((mod) => mod.ProfileForm),
  {
    loading: () => (
      <section className="card dashboard-section">
        <strong>Preparando editor</strong>
        <p className="section-copy">Estamos cargando el negocio vinculado.</p>
      </section>
    ),
  },
);

export function AgencyBusinessDashboardClient({ businessUid }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [token, setToken] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [checkoutConfig, setCheckoutConfig] = useState(null);

  useEffect(() => {
    async function bootstrap() {
      if (!user || !businessUid) return;
      const nextToken = await getFreshAuthToken();
      setToken(nextToken);
      const payload = await apiFetch(`/api/agency/businesses/${businessUid}`, { token: nextToken });
      setData(payload);
    }

    bootstrap().catch((nextError) => setError(nextError.message));
  }, [businessUid, user]);

  useEffect(() => {
    if (!loading && !user) router.replace("/agencia");
  }, [loading, router, user]);

  const canEdit = useMemo(() => Boolean(data?.canEdit), [data?.canEdit]);

  function handleUserSaved(userData) {
    setData((current) => ({
      ...current,
      user: {
        ...current.user,
        ...userData,
        billingProfile: userData.billingProfile || current.user?.billingProfile || {},
      },
      publicUrl: userData.publicUrl || current.publicUrl,
      shareUrl: userData.shareUrl || current.shareUrl,
      stablePublicUrl: userData.stablePublicUrl || current.stablePublicUrl,
    }));
  }

  async function handleCheckout(options = {}) {
    setPaying(true);
    setError("");
    setCheckoutConfig(null);
    const paymentWindow = typeof window !== "undefined" ? window.open("", "_blank") : null;
    if (paymentWindow) {
      paymentWindow.opener = null;
      paymentWindow.document.title = "Mercado Pago";
      paymentWindow.document.body.innerHTML = "<p style=\"font-family:system-ui,sans-serif;padding:24px\">Preparando pago seguro...</p>";
    }

    try {
      const response = await apiFetch("/api/billing/create-preference", {
        method: "POST",
        token,
        body: { ...options, targetUid: businessUid },
      });
      if (!response?.initPoint) {
        throw new Error("Mercado Pago no entreg\u00f3 un enlace de pago v\u00e1lido.");
      }
      if (paymentWindow && !paymentWindow.closed) {
        paymentWindow.location.href = response.initPoint;
      }
      setCheckoutConfig({ ...response, openedExternally: Boolean(paymentWindow && !paymentWindow.closed) });
    } catch (nextError) {
      if (paymentWindow && !paymentWindow.closed) paymentWindow.close();
      setError(nextError.message);
    } finally {
      setPaying(false);
    }
  }

  async function handleQrDownload() {
    try {
      const response = await fetch(`/api/qr/download?targetUid=${encodeURIComponent(businessUid)}`, {
        headers: { Authorization: `Bearer ${token}` },
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

  if (loading) {
    return <main className="shell page-shell"><div className="kpi">Validando agencia...</div></main>;
  }

  if (!data) {
    return (
      <main className="shell page-shell">
        <section className="panel stack">
          <Link className="btn btn-secondary" href="/agencia"><ArrowLeft size={16} /> Volver a agencia</Link>
          <div className={error ? "notice notice-danger" : "kpi"}>{error || "Cargando negocio vinculado..."}</div>
        </section>
      </main>
    );
  }

  return (
    <main className="shell dashboard-shell">
      <div className="dashboard-body">
        <div className="notice agency-owner-notice">
          <ShieldCheck size={17} />
          <span>
            Est\u00e1s administrando <strong>{data.user?.businessName || "este negocio"}</strong> como {data.agency?.agencyName || "agencia autorizada"}.
          </span>
          <Link className="btn btn-secondary" href="/agencia"><ArrowLeft size={16} /> Volver</Link>
        </div>

        {!canEdit ? (
          <div className="notice notice-danger">
            Este negocio est\u00e1 vencido o suspendido. La agencia puede ayudar a renovar, pero no editar el Klicor hasta que quede activo.
          </div>
        ) : null}

        <ProfileForm
          token={token}
          profile={data.user}
          canEdit={canEdit}
          subscriptionSettings={data.settings}
          userEmailVerified={true}
          paying={paying}
          checkoutConfig={checkoutConfig}
          recovery={{}}
          recoveryLoading={false}
          recoveryMessage=""
          onRecoveryFieldChange={() => {}}
          onSaveRecovery={() => {}}
          onResendRecoveryVerification={() => {}}
          onCheckout={handleCheckout}
          onAgencyRequest={() => {}}
          onAgencyRevoke={() => {}}
          publicUrl={data.publicUrl}
          onCopyPublicUrl={() => navigator.clipboard?.writeText(data.shareUrl || data.publicUrl)}
          onDownloadQr={handleQrDownload}
          onLogout={() => router.push("/agencia")}
          onSaved={handleUserSaved}
          agencyMode
          agencyTargetUid={businessUid}
          agencyPermissions={data.permissions}
        />

        {error ? <p className="notice notice-danger">{error}</p> : null}
      </div>
    </main>
  );
}
