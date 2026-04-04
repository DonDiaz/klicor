"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { ShieldAlert } from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import { getClientAuth } from "@/lib/firebase-client";
import { AdminPanel } from "@/components/admin-panel";
import { useAuth } from "@/components/providers/auth-provider";

export function AdminPageClient() {
  const { user, loading } = useAuth();
  const [token, setToken] = useState("");
  const [accountData, setAccountData] = useState(null);
  const [panelData, setPanelData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function bootstrap() {
      if (!user) return;

      const nextToken = await user.getIdToken(true);
      setToken(nextToken);

      const me = await apiFetch("/api/me", { token: nextToken });
      setAccountData(me);

      if (me.user?.role === "admin") {
        const nextPanel = await apiFetch("/api/admin/panel", { token: nextToken });
        setPanelData(nextPanel);
      }
    }

    bootstrap().catch((nextError) => setError(nextError.message));
  }, [user]);

  async function handleLogout() {
    const auth = getClientAuth();
    if (!auth) return;
    await signOut(auth);
  }

  if (loading) {
    return <main className="shell admin-shell" style={{ padding: "4rem 0" }}><div className="panel">Cargando panel administrativo…</div></main>;
  }

  if (!user) {
    return (
      <main className="shell admin-shell" style={{ padding: "4rem 0" }}>
        <div className="panel stack">
          <p>Necesitas iniciar sesión para ver el panel administrativo.</p>
          <Link className="btn btn-primary" href="/login">Ir al inicio de sesión</Link>
        </div>
      </main>
    );
  }

  if (!accountData) {
    return <main className="shell admin-shell" style={{ padding: "4rem 0" }}><div className="panel">Preparando panel administrativo…</div></main>;
  }

  if (accountData.user?.role !== "admin") {
    return (
      <main className="shell admin-shell" style={{ padding: "4rem 0" }}>
        <div className="panel stack">
          <div className="actions" style={{ alignItems: "center" }}>
            <span className="pill"><ShieldAlert size={16} /> Acceso restringido</span>
          </div>
          <h1>Este panel es solo para administradores</h1>
          <p className="muted">Tu cuenta no tiene permisos para administrar usuarios, precios y vencimientos.</p>
          <div className="actions">
            <Link className="btn btn-secondary" href="/dashboard">Volver al dashboard</Link>
            <button className="btn btn-secondary" type="button" onClick={handleLogout}>Cerrar sesión</button>
          </div>
        </div>
      </main>
    );
  }

  if (!panelData) {
    return (
      <main className="shell admin-shell" style={{ padding: "4rem 0" }}>
        <div className="panel stack">
          <p>{error || "Cargando datos del panel…"}</p>
          <div className="actions">
            <Link className="btn btn-secondary" href="/dashboard">Volver al dashboard</Link>
            <button className="btn btn-secondary" type="button" onClick={handleLogout}>Cerrar sesión</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="shell admin-shell" style={{ padding: "2rem 0 3rem" }}>
      <AdminPanel token={token} initialData={panelData} adminUser={accountData.user} />
      {error ? <p className="notice" style={{ marginTop: "1rem" }}>{error}</p> : null}
    </main>
  );
}
