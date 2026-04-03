"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { AuthForm } from "@/components/auth-form";

export function LandingLoginModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    function handlePointerDown(event) {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [open]);

  function handleSuccess() {
    setOpen(false);
    router.push("/dashboard");
  }

  return (
    <div ref={wrapperRef} className="landing-login-popover">
      <button className="landing-login-trigger" type="button" onClick={() => setOpen((current) => !current)}>
        Iniciar sesión
      </button>

      {open ? (
        <div
          className="landing-modal-shell"
          role="dialog"
          aria-modal="true"
          aria-labelledby="landing-login-title"
        >
          <div className="landing-modal-head">
            <div id="landing-login-title" />
            <button className="landing-modal-close" type="button" onClick={() => setOpen(false)} aria-label="Cerrar modal">
              <X size={18} />
            </button>
          </div>

          <AuthForm
            allowRegister={false}
            compact
            title="Entra a tu panel"
            description="Usa Google, Microsoft o un enlace a tu correo para entrar sin fricción."
            googleLabel="Continuar con Google"
            onSuccess={handleSuccess}
          />
        </div>
      ) : null}
    </div>
  );
}
