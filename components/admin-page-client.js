"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase-client";
import { apiFetch } from "@/lib/client-api";
import { useAuth } from "@/components/providers/auth-provider";
import { AdminPanel } from "@/components/admin-panel";

export function AdminPageClient() {
  const { user, loading } = useAuth();
  const [token, setToken] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

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
          <p>Necesitas iniciar sesion para ver el panel administrativo.</p>
          <Link className="btn btn-primary" href="/login">Ir a login</Link>
        </div>
      </main>
    );
  }

  if (!data) {
    return <main className="shell" style={{ padding: "4rem 0" }}><div className="panel">Preparando panel administrativo...</div></main>;
  }

  if (data.user.role !== "admin") {
    return (
      <main className="shell" style={{ padding: "4rem 0" }}>
        <div className="panel stack">
          <h1>Acceso restringido</h1>
          <p className="muted">Este panel solo esta disponible para cuentas administradoras.</p>
          <Link className="btn btn-secondary" href="/dashboard">Volver al dashboard</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="shell" style={{ padding: "2rem 0 4rem" }}>
      <div className="topbar">
        <div>
          <span className="pill">Administracion</span>
          <h1 style={{ marginBottom: ".3rem" }}>Panel administrativo</h1>
          <p className="muted">Gestiona el precio anual y el estado general de las cuentas.</p>
        </div>
        <div className="actions">
          <Link className="btn btn-secondary" href="/dashboard">Volver al dashboard</Link>
          <button className="btn btn-secondary" type="button" onClick={handleLogout}>Cerrar sesion</button>
        </div>
      </div>
      <section className="card" style={{ padding: "1.5rem" }}>
        <AdminPanel token={token} initialSettings={data.settings} initialUsers={data.adminUsers || []} />
      </section>
      {error ? <p className="notice" style={{ marginTop: "1rem" }}>{error}</p> : null}
    </main>
  );
}
