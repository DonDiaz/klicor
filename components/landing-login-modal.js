"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { AuthForm } from "@/components/auth-form";

export function LandingLoginModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function handleSuccess() {
    setOpen(false);
    router.push("/dashboard");
  }

  return (
    <>
      <button className="btn btn-secondary" type="button" onClick={() => setOpen(true)}>
        Iniciar sesion
      </button>

      {open ? (
        <div className="landing-modal-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <div
            className="landing-modal-shell"
            role="dialog"
            aria-modal="true"
            aria-labelledby="landing-login-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="landing-modal-head">
              <div className="stack" style={{ gap: "0.35rem" }}>
                <span className="pill landing-soft-pill">Acceso</span>
                <h2 id="landing-login-title" className="section-title" style={{ fontSize: "1.8rem" }}>
                  Inicia sesion en Linka
                </h2>
                <p className="section-copy">Entra con tu correo o con Google para volver a tu panel.</p>
              </div>
              <button className="landing-modal-close" type="button" onClick={() => setOpen(false)} aria-label="Cerrar modal">
                <X size={18} />
              </button>
            </div>

            <AuthForm
              initialMode="login"
              allowRegister={false}
              hideSwitcher
              title="Bienvenido de nuevo"
              description="Accede a tu panel para editar enlaces, descargar tu QR y administrar tu Linka."
              submitLabel="Entrar al dashboard"
              googleLabel="Iniciar con Google"
              onSuccess={handleSuccess}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
