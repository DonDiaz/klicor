"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { AuthForm } from "@/components/auth-form";

const LANDING_MODAL_OPEN_EVENT = "klicor:landing-modal-open";

export function LandingLoginModal({
  triggerLabel = "Iniciar sesión",
  triggerClassName = "landing-login-trigger",
  allowRegister = false,
  title,
  description,
  googleLabel,
  align = "end",
}) {
  const router = useRouter();
  const titleId = useId();
  const modalId = useId();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return undefined;

    function handleAnotherModalOpen(event) {
      if (event.detail !== modalId) {
        setOpen(false);
      }
    }

    window.addEventListener(LANDING_MODAL_OPEN_EVENT, handleAnotherModalOpen);

    return () => {
      window.removeEventListener(LANDING_MODAL_OPEN_EVENT, handleAnotherModalOpen);
    };
  }, [modalId, mounted]);

  useEffect(() => {
    if (!open || !mounted) return undefined;

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [mounted, open]);

  function openModal() {
    if (!mounted) return;
    window.dispatchEvent(new CustomEvent(LANDING_MODAL_OPEN_EVENT, { detail: modalId }));
    setOpen(true);
  }

  function handleSuccess() {
    setOpen(false);
    router.push("/dashboard");
  }

  const modalContent = open && mounted ? createPortal(
    <>
      <div className="landing-modal-backdrop" onMouseDown={() => setOpen(false)} />
      <div
        className={`landing-modal-shell landing-modal-shell-${align}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="landing-modal-head">
          <div id={titleId} />
          <button className="landing-modal-close" type="button" onClick={() => setOpen(false)} aria-label="Cerrar modal">
            <X size={18} />
          </button>
        </div>

        <AuthForm
          allowRegister={allowRegister}
          compact
          title={title || (allowRegister ? "Crea tu Klicor" : "Entra a tu panel")}
          description={description || (
            allowRegister
              ? "Regístrate con Google o correo y entra directo a tu panel."
              : "Usa Google o un enlace a tu correo para entrar sin fricción."
          )}
          googleLabel={googleLabel || (allowRegister ? "Crear con Google" : "Continuar con Google")}
          onSuccess={handleSuccess}
        />
      </div>
    </>,
    document.body,
  ) : null;

  return (
    <div className="landing-login-popover">
      <button className={triggerClassName} type="button" onClick={openModal}>
        {triggerLabel}
      </button>
      {modalContent}
    </div>
  );
}
