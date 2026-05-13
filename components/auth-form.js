"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  browserSessionPersistence,
  getRedirectResult,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  setPersistence,
  signInWithEmailLink,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import {
  ArrowRight,
  CheckCircle2,
  Chrome,
  Mail,
  MailCheck,
  ShieldCheck,
} from "lucide-react";
import { getClientAuth, getGoogleProvider } from "@/lib/firebase-client";
import { apiFetch } from "@/lib/client-api";
import {
  LEGAL_ACCEPTABLE_USE_VERSION,
  LEGAL_PAYMENTS_VERSION,
  LEGAL_PRIVACY_VERSION,
  LEGAL_TERMS_VERSION,
} from "@/lib/legal-consent";

const EMAIL_LINK_STORAGE_KEY = "klicor-email-link";
const EMAIL_LINK_LEGAL_STORAGE_KEY = "klicor-email-link-legal";
const REDIRECT_LEGAL_STORAGE_KEY = "klicor-redirect-legal";

function getAuthErrorMessage(error) {
  const code = error?.code || "";

  if (code === "auth/invalid-email") return "Ingresa un correo válido.";
  if (code === "auth/missing-email") return "Escribe tu correo para continuar.";
  if (code === "auth/too-many-requests") return "Has intentado demasiadas veces. Espera un momento e intenta de nuevo.";
  if (code === "auth/popup-closed-by-user") return "Cerraste la ventana antes de terminar el acceso.";
  if (code === "auth/popup-blocked") return "Tu navegador bloqueo la ventana del proveedor. Intenta de nuevo.";
  if (code === "auth/network-request-failed") return "No pudimos conectarnos. Revisa tu internet e intenta otra vez.";
  if (code === "auth/operation-not-allowed") return "Este método de acceso no está habilitado todavía en Firebase.";
  if (code === "auth/unauthorized-domain") return "Este dominio todavía no está autorizado en Firebase para este acceso.";
  if (code === "auth/account-exists-with-different-credential") {
    return "Ese correo ya existe con otro método. Prueba con Google o con el enlace al correo.";
  }
  if (code === "auth/unauthorized-continue-uri" || code === "auth/invalid-continue-uri") {
    return "El acceso por correo no está bien configurado todavía.";
  }
  if (code === "auth/expired-action-code" || code === "auth/invalid-action-code") {
    return "El enlace ya no es válido. Pide uno nuevo.";
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
  const [legalGateUser, setLegalGateUser] = useState(null);
  const [legalGateSource, setLegalGateSource] = useState("auth");

  const shouldRequireTerms = allowRegister || Boolean(legalGateUser);

  function buildLegalAcceptance(source = "auth") {
    return {
      accepted: acceptedTerms,
      source,
      termsVersion: LEGAL_TERMS_VERSION,
      privacyVersion: LEGAL_PRIVACY_VERSION,
      paymentsVersion: LEGAL_PAYMENTS_VERSION,
      acceptableUseVersion: LEGAL_ACCEPTABLE_USE_VERSION,
      acceptedAtClient: new Date().toISOString(),
    };
  }

  function readStoredLegalAcceptance(storageKey) {
    if (typeof window === "undefined") return null;
    try {
      return JSON.parse(window.localStorage.getItem(storageKey) || window.sessionStorage.getItem(storageKey) || "null");
    } catch {
      return null;
    }
  }

  async function bootstrapSession(user, { welcome = false, legalAcceptance = null } = {}) {
    const token = await user.getIdToken();
    await apiFetch("/api/auth/bootstrap", {
      method: "POST",
      token,
      body: { welcome, legalAcceptance },
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

  function isLegalAcceptanceError(error) {
    const text = String(error?.message || "").toLowerCase();
    return text.includes("terminos") || text.includes("tÃ©rminos") || text.includes("crear tu cuenta") || text.includes("vigentes");
  }

  function requestLegalAcceptance(user, source = "auth") {
    setLegalGateUser(user || null);
    setLegalGateSource(source);
    setAcceptedTerms(false);
    setFeedback("Para continuar debes aceptar los terminos y condiciones vigentes.", "danger");
  }

  function ensureTermsAccepted() {
    if (!shouldRequireTerms || acceptedTerms) return true;
      setFeedback("Debes aceptar los términos y condiciones para continuar.", "danger");
    return false;
  }

  async function finishLegalAcceptance() {
    if (!legalGateUser || !ensureTermsAccepted()) return;

    setLoading(true);
    setLoadingAction("legal");
    setFeedback("Estamos guardando tu aceptacion...", "neutral");
    try {
      await bootstrapSession(legalGateUser, {
        welcome: true,
        legalAcceptance: buildLegalAcceptance(legalGateSource),
      });
    } catch (error) {
      setFeedback(getAuthErrorMessage(error), "danger");
    } finally {
      setLoading(false);
      setLoadingAction("");
    }
  }

  async function completeEmailLink(auth, email, href) {
    const storedLegalAcceptance = readStoredLegalAcceptance(EMAIL_LINK_LEGAL_STORAGE_KEY);
    setLoading(true);
    setLoadingAction("email");
    setFeedback("Estamos completando tu acceso...", "neutral");
    try {
      const credential = await signInWithEmailLink(auth, email, href);
      window.localStorage.removeItem(EMAIL_LINK_STORAGE_KEY);
      window.localStorage.removeItem(EMAIL_LINK_LEGAL_STORAGE_KEY);
      await bootstrapSession(credential.user, {
        welcome: true,
        legalAcceptance: storedLegalAcceptance,
      });
    } catch (error) {
      if (isLegalAcceptanceError(error) && auth.currentUser) {
        requestLegalAcceptance(auth.currentUser, "email-link-complete");
        return;
      }
      setFeedback(getAuthErrorMessage(error), "danger");
    } finally {
      setLoading(false);
      setLoadingAction("");
    }
  }

  useEffect(() => {
    const auth = getClientAuth();
    if (!auth || typeof window === "undefined") return undefined;
    void setPersistence(auth, browserSessionPersistence).catch(() => null);

    let cancelled = false;
    getRedirectResult(auth)
      .then(async (credential) => {
        if (!credential?.user || cancelled) return;
        setLoading(true);
        setLoadingAction("google");
        setFeedback("Estamos completando tu acceso...", "neutral");
        const storedLegalAcceptance = readStoredLegalAcceptance(REDIRECT_LEGAL_STORAGE_KEY);
        window.sessionStorage.removeItem(REDIRECT_LEGAL_STORAGE_KEY);
        await bootstrapSession(credential.user, {
          welcome: true,
          legalAcceptance: storedLegalAcceptance,
        });
      })
      .catch((error) => {
        if (!cancelled) {
          if (isLegalAcceptanceError(error) && auth.currentUser) {
            requestLegalAcceptance(auth.currentUser, "google-redirect");
            return;
          }
          setFeedback(getAuthErrorMessage(error), "danger");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setLoadingAction("");
        }
      });

    const href = window.location.href;
    if (!isSignInWithEmailLink(auth, href)) return undefined;

    setPendingEmailLink(true);
    const savedEmail = window.localStorage.getItem(EMAIL_LINK_STORAGE_KEY) || "";

    if (savedEmail) {
      setForm((current) => ({ ...current, email: savedEmail }));
      void completeEmailLink(auth, savedEmail, href);
      return () => {
        cancelled = true;
      };
    }

    setFeedback("Escribe el correo con el que pediste el enlace para completar tu acceso.", "neutral");
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleEmailLink() {
    const auth = getClientAuth();
    if (!auth) return;
    await setPersistence(auth, browserSessionPersistence);

    const email = form.email.trim().toLowerCase();
    if (!email) {
      setFeedback("Escribe tu correo para continuar.", "danger");
      return;
    }

    if (pendingEmailLink && typeof window !== "undefined") {
      await completeEmailLink(auth, email, window.location.href);
      return;
    }

    if (allowRegister && !ensureTermsAccepted()) {
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
      if (allowRegister) {
        window.localStorage.setItem(EMAIL_LINK_LEGAL_STORAGE_KEY, JSON.stringify(buildLegalAcceptance("email-link-request")));
      } else {
        window.localStorage.removeItem(EMAIL_LINK_LEGAL_STORAGE_KEY);
      }
      setFeedback(`Te enviamos un enlace de acceso a ${email}. Abrelo desde tu correo para entrar.`, "success");
    } catch (error) {
      setFeedback(getAuthErrorMessage(error), "danger");
    } finally {
      setLoading(false);
      setLoadingAction("");
    }
  }

  async function handleGoogleSignIn() {
    const auth = getClientAuth();
    if (!auth) return;
    await setPersistence(auth, browserSessionPersistence);

    if (allowRegister && !ensureTermsAccepted()) {
      return;
    }

    const provider = getGoogleProvider();

    setLoading(true);
    setLoadingAction("google");
    setFeedback("", "neutral");
    try {
      const credential = await signInWithPopup(auth, provider);
      await bootstrapSession(credential.user, {
        welcome: true,
        legalAcceptance: allowRegister ? buildLegalAcceptance("google-register") : null,
      });
    } catch (error) {
      if (isLegalAcceptanceError(error) && auth.currentUser) {
        requestLegalAcceptance(auth.currentUser, allowRegister ? "google-register" : "google-login-legal-update");
        return;
      }
      if (["auth/popup-blocked", "auth/popup-closed-by-user", "auth/cancelled-popup-request"].includes(error?.code)) {
        try {
          setFeedback("Abriremos Google en esta misma pestaña para completar el acceso.", "neutral");
          if (allowRegister) {
            window.sessionStorage.setItem(REDIRECT_LEGAL_STORAGE_KEY, JSON.stringify(buildLegalAcceptance("google-redirect")));
          } else {
            window.sessionStorage.removeItem(REDIRECT_LEGAL_STORAGE_KEY);
          }
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectError) {
          setFeedback(getAuthErrorMessage(redirectError), "danger");
          return;
        }
      }
      setFeedback(getAuthErrorMessage(error), "danger");
    } finally {
      setLoading(false);
      setLoadingAction("");
    }
  }

  const resolvedTitle = title || "Entra o crea tu cuenta";
  const resolvedDescription = description || (
    allowRegister
      ? "Accede con Google o recibe un enlace en tu correo. Así activas tu Klicor con menos fricción y sin depender de una contraseña."
      : "Accede con Google o con un enlace a tu correo para entrar sin fricción."
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
            <span><MailCheck size={16} /> Correo con enlace directo</span>
          </div>
        ) : null}
      </div>

      <div className="auth-method-stack">
        <div className="auth-provider-stack">
          <button
            className="btn btn-secondary auth-provider-button"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <Chrome size={18} />
            {loading && loadingAction === "google" ? "Entrando con Google..." : googleLabel}
          </button>
        </div>

        <div className="auth-divider">
          <span>o usa tu correo</span>
        </div>

        <div className="auth-email-block">
          <label className="label">Correo electrónico</label>
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
              : "Te enviaremos un enlace directo para entrar o crear tu cuenta sin contraseña."}
          </p>
        </div>

        {shouldRequireTerms ? (
          <>
            <label className="terms-check auth-inline-terms">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
            />
            <span>
              Al continuar aceptas los{" "}
              <Link className="terms-link" href="/terminos-y-condiciones" target="_blank" rel="noreferrer">
                Términos y condiciones
              </Link>{" "}
              y la{" "}
              <Link className="terms-link" href="/politica-de-privacidad" target="_blank" rel="noreferrer">
                Política de privacidad
              </Link>
              , la{" "}
              <Link className="terms-link" href="/politica-de-pagos" target="_blank" rel="noreferrer">
                Politica de pagos
              </Link>{" "}
              y el{" "}
              <Link className="terms-link" href="/uso-permitido" target="_blank" rel="noreferrer">
                Uso permitido
              </Link>.
            </span>
            </label>
            {legalGateUser ? (
              <button
                className="btn btn-primary auth-email-button"
                type="button"
                onClick={finishLegalAcceptance}
                disabled={loading}
              >
                {loading && loadingAction === "legal" ? "Guardando..." : "Aceptar y continuar"}
                {(!loading || loadingAction !== "legal") ? <ArrowRight size={16} /> : null}
              </button>
            ) : null}
          </>
        ) : (
          <p className="auth-inline-note">Usa Google o tu correo para entrar sin fricción.</p>
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
