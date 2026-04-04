"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isSignInWithEmailLink } from "firebase/auth";
import { AuthForm } from "@/components/auth-form";
import { BrandLogo } from "@/components/brand-logo";
import { getClientAuth } from "@/lib/firebase-client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("checking");

  useEffect(() => {
    const auth = getClientAuth();
    if (typeof window === "undefined" || !auth) {
      setMode("redirect");
      return;
    }

    const href = window.location.href;
    const isEmailCallback = isSignInWithEmailLink(auth, href);

    if (!isEmailCallback) {
      setMode("redirect");
      router.replace("/");
      return;
    }

    setMode("callback");
  }, [router]);

  if (mode !== "callback") {
    return (
      <main className="auth-shell">
        <div className="card auth-card" style={{ width: "min(420px, 100%)" }}>
          <strong>Redirigiendo...</strong>
          <p className="section-copy">Te estamos llevando al inicio.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-shell">
      <div className="card auth-card auth-entry-card" style={{ width: "min(460px, 100%)" }}>
        <div className="auth-entry-head">
          <BrandLogo />
          <div className="stack" style={{ gap: "0.45rem" }}>
            <span className="pill">Acceso por correo</span>
            <h1 className="title" style={{ fontSize: "clamp(1.6rem, 2vw, 2rem)" }}>Completa tu acceso</h1>
            <p className="section-copy">
              Esta ruta ya no es una pantalla de registro. Solo sirve para terminar el acceso por enlace al correo.
            </p>
          </div>
        </div>

        <AuthForm
          compact
          title="Confirma tu correo"
          description="Si abriste el enlace en otro navegador o dispositivo, escribe tu correo para completar la entrada."
          submitLabel="Completar acceso con correo"
        />
      </div>
    </main>
  );
}
