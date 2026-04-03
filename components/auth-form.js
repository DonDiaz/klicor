"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
} from "firebase/auth";
import {
  ArrowRight,
  CheckCircle2,
  Chrome,
  Mail,
  MailCheck,
  ShieldCheck,
} from "lucide-react";
import { getClientAuth, getGoogleProvider, getMicrosoftProvider } from "@/lib/firebase-client";
import { apiFetch } from "@/lib/client-api";

const EMAIL_LINK_STORAGE_KEY = "klicor-email-link";

function MicrosoftIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M2 3.5 11 2v9H2V3.5Zm10 8h10V1l-10 1.5v9Zm-10 1h9v9.5L2 20.5v-8Zm10 0h10V23l-10-1.5v-9Z" />
    </svg>
  );
}

function getAuthErrorMessage(error) {
  const code = error?.code || "";

  if (code === "auth/invalid-email") return "Ingresa un correo valido.";
  if (code === "auth/missing-email") return "Escribe tu correo para continuar.";
  if (code === "auth/too-many-requests") return "Has intentado demasiadas veces. Espera un momento e intenta de nuevo.";
  if (code === "auth/popup-closed-by-user") return "Cerraste la ventana antes de terminar el acceso.";
  if (code === "auth/popup-blocked") return "Tu navegador bloqueo la ventana del proveedor. Intenta de nuevo.";
  if (code === "auth/network-request-failed") return "No pudimos conectarnos. Revisa tu internet e intenta otra vez.";
  if (code === "auth/operation-not-allowed") return "Este metodo de acceso no esta habilitado todavia en Firebase.";
  if (code === "auth/unauthorized-domain") return "Este dominio todavia no esta autorizado en Firebase para este acceso.";
  if (code === "auth/account-exists-with-different-credential") {
    return "Ese correo ya existe con otro metodo. Prueba con Google, Microsoft o con el enlace al correo.";
  }
  if (code === "auth/unauthorized-continue-uri" || code === "auth/invalid-continue-uri") {
    return "El acceso por correo no esta bien configurado todavia.";
  }
  if (code === "auth/expired-action-code" || code === "auth/invalid-action-code") {
    return "El enlace ya no es valido. Pide uno nuevo.";
  }
  if (code === "auth/argument-error") return "No pudimos completar el acceso con ese enlace.";

  return error?.message || "No pudimos procesar tu solicitud.";
}

export function AuthForm({
  allowRegister = true,
  compact = false,
  title,
  description,
  submitLabel,
  googleLabel = "Continuar con Google",
  microsoftLabel = "Continuar con Microsoft",
  onSuccess,
}) {
  const router = useRouter();
  const [form, setForm] = useState({ email: "" });
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("neutral");
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [pendingEmailLink, setPendingEmailLink] = useState(false);

  const shouldRequireTerms = allowRegister;

  async function bootstrapSession(user, { welcome = false } = {}) {
    const token = await user.getIdToken();
    await apiFetch("/api/auth/bootstrap", {
      method: "POST",
      token,
      body: { welcome },
    });
    await user.getIdToken(true);

    if (onSuccess) {
      onSuccess(user);
      return;
    }

    router.push("/dashboard");
  }

  function setFeedback(nextMessage, tone = "neutral") {
    setMessage(nextMessage);
    setMessageTone(tone);
  }

  function ensureTermsAccepted() {
    if (!shouldRequireTerms || acceptedTerms) return true;
    setFeedback("Debes aceptar los terminos y condiciones para continuar.", "danger");
    return false;
  }

  async function completeEmailLink(auth, email, href) {
    setLoading(true);
    setLoadingAction("email");
    setFeedback("Estamos completando tu acceso...", "neutral");
    try {
      const credential = await signInWithEmailLink(auth, email, href);
      window.localStorage.removeItem(EMAIL_LINK_STORAGE_KEY);
      await bootstrapSession(credential.user);
    } catch (error) {
      setFeedback(getAuthErrorMessage(error), "danger");
    } finally {
      setLoading(false);
      setLoadingAction("");
    }
  }

  useEffect(() => {
    const auth = getClientAuth();
    if (!auth || typeof window === "undefined") return undefined;

    const href = window.location.href;
    if (!isSignInWithEmailLink(auth, href)) return undefined;

    setPendingEmailLink(true);
    const savedEmail = window.localStorage.getItem(EMAIL_LINK_STORAGE_KEY) || "";

    if (savedEmail) {
      setForm((current) => ({ ...current, email: savedEmail }));
      void completeEmailLink(auth, savedEmail, href);
      return undefined;
    }

    setFeedback("Escribe el correo con el que pediste el enlace para completar tu acceso.", "neutral");
    return undefined;
  }, []);

  async function handleEmailLink() {
    const auth = getClientAuth();
    if (!auth) return;

    const email = form.email.trim().toLowerCase();
    if (!email) {
      setFeedback("Escribe tu correo para continuar.", "danger");
      return;
    }

    if (pendingEmailLink && typeof window !== "undefined") {
      await completeEmailLink(auth, email, window.location.href);
      return;
    }

    if (!ensureTermsAccepted()) {
      return;
    }

    setLoading(true);
    setLoadingAction("email");
    setFeedback("", "neutral");
    try {
      await sendSignInLinkToEmail(auth, email, {
        url: new URL("/login", window.location.origin).toString(),
        handleCodeInApp: true,
      });
      window.localStorage.setItem(EMAIL_LINK_STORAGE_KEY, email);
      setFeedback(`Te enviamos un enlace de acceso a ${email}. Abrelo desde tu correo para entrar.`, "success");
    } catch (error) {
      setFeedback(getAuthErrorMessage(error), "danger");
    } finally {
      setLoading(false);
      setLoadingAction("");
    }
  }

  async function handleProviderSignIn(providerName) {
    const auth = getClientAuth();
    if (!auth) return;

    if (!ensureTermsAccepted()) {
      return;
    }

    const provider = providerName === "microsoft" ? getMicrosoftProvider() : getGoogleProvider();

    setLoading(true);
    setLoadingAction(providerName);
    setFeedback("", "neutral");
    try {
      const credential = await signInWithPopup(auth, provider);
      await bootstrapSession(credential.user, { welcome: true });
    } catch (error) {
      setFeedback(getAuthErrorMessage(error), "danger");
    } finally {
      setLoading(false);
      setLoadingAction("");
    }
  }

  const resolvedTitle = title || "Entra o crea tu cuenta";
  const resolvedDescription = description || (
    allowRegister
      ? "Accede con Google, Microsoft o recibe un enlace en tu correo. Asi activas tu Klicor con menos friccion y sin depender de una contrasena."
      : "Accede con Google, Microsoft o con un enlace a tu correo para entrar sin friccion."
  );
  const resolvedEmailButtonLabel = submitLabel || (pendingEmailLink ? "Completar acceso con correo" : "Continuar con correo");
  const messageClassName = useMemo(() => {
    if (messageTone === "danger") return "notice notice-danger";
    if (messageTone === "success") return "notice auth-notice-success";
    return "notice";
  }, [messageTone]);

  return (
    <section className={`card auth-card auth-entry-card ${compact ? "auth-entry-card-compact" : ""}`}>
      <div className="auth-entry-head">
        <div className="stack" style={{ gap: "0.45rem" }}>
          <span className="pill auth-entry-pill">
            <ShieldCheck size={16} />
            Acceso unificado
          </span>
          <h2 className="section-title auth-entry-title">{resolvedTitle}</h2>
          <p className="section-copy auth-entry-description">{resolvedDescription}</p>
        </div>

        {!compact ? (
          <div className="auth-entry-badges">
            <span><CheckCircle2 size={16} /> Google disponible</span>
            <span><MicrosoftIcon /> Microsoft disponible</span>
            <span><MailCheck size={16} /> Correo con enlace directo</span>
          </div>
        ) : null}
      </div>

      <div className="auth-method-stack">
        <div className="auth-provider-stack">
          <button
            className="btn btn-secondary auth-provider-button"
            type="button"
            onClick={() => handleProviderSignIn("google")}
            disabled={loading}
          >
            <Chrome size={18} />
            {loading && loadingAction === "google" ? "Entrando con Google..." : googleLabel}
          </button>

          <button
            className="btn btn-secondary auth-provider-button"
            type="button"
            onClick={() => handleProviderSignIn("microsoft")}
            disabled={loading}
          >
            <MicrosoftIcon />
            {loading && loadingAction === "microsoft" ? "Entrando con Microsoft..." : microsoftLabel}
          </button>
        </div>

        <div className="auth-divider">
          <span>o usa tu correo</span>
        </div>

        <div className="auth-email-block">
          <label className="label">Correo electronico</label>
          <div className="input-with-icon auth-email-input">
            <Mail size={18} />
            <input
              className="input input-embedded"
              type="email"
              required
              placeholder="tucorreo@negocio.com"
              value={form.email}
              onChange={(event) => setForm({ email: event.target.value })}
            />
          </div>
          <button className="btn btn-primary auth-email-button" type="button" onClick={handleEmailLink} disabled={loading}>
            {loading && loadingAction === "email" ? (pendingEmailLink ? "Entrando..." : "Enviando...") : resolvedEmailButtonLabel}
            {(!loading || loadingAction !== "email") ? <ArrowRight size={16} /> : null}
          </button>
          <p className="auth-hint">
            {pendingEmailLink
              ? "Usa el mismo correo con el que pediste el enlace para terminar el acceso."
              : "Te enviaremos un enlace directo para entrar o crear tu cuenta sin contrasena."}
          </p>
        </div>

        {shouldRequireTerms ? (
          <label className="terms-check auth-inline-terms">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
            />
            <span>
              Al continuar aceptas los{" "}
              <Link className="terms-link" href="/terminos" target="_blank" rel="noreferrer">
                Terminos y condiciones
              </Link>{" "}
              y la{" "}
              <Link className="terms-link" href="/privacidad" target="_blank" rel="noreferrer">
                Politica de privacidad
              </Link>.
            </span>
          </label>
        ) : (
          <p className="auth-inline-note">Usa Google, Microsoft o tu correo para entrar sin friccion.</p>
        )}
      </div>

      {message ? (
        <p className={messageClassName}>
          <MailCheck size={16} />
          <span>{message}</span>
        </p>
      ) : null}
    </section>
  );
}
