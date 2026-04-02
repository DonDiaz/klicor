"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
  signInWithEmailLink,
  signInWithPopup,
} from "firebase/auth";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Chrome,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  MailCheck,
  ShieldCheck,
} from "lucide-react";
import { getClientAuth, getGoogleProvider } from "@/lib/firebase-client";
import { apiFetch } from "@/lib/client-api";

const EMAIL_LINK_STORAGE_KEY = "klicor-email-link";

function getAuthErrorMessage(error) {
  const code = error?.code || "";

  if (code === "auth/invalid-email") return "Ingresa un correo válido.";
  if (code === "auth/missing-email") return "Escribe tu correo para continuar.";
  if (code === "auth/user-not-found" || code === "auth/invalid-credential" || code === "auth/wrong-password") {
    return "Ese correo o contraseña no coinciden.";
  }
  if (code === "auth/too-many-requests") return "Has intentado demasiadas veces. Espera un momento e intenta de nuevo.";
  if (code === "auth/popup-closed-by-user") return "Cerraste la ventana antes de terminar el acceso con Google.";
  if (code === "auth/popup-blocked") return "Tu navegador bloqueó la ventana de Google. Intenta de nuevo.";
  if (code === "auth/network-request-failed") return "No pudimos conectarnos. Revisa tu internet e intenta otra vez.";
  if (code === "auth/operation-not-allowed") return "Este método de acceso no está habilitado todavía en Firebase.";
  if (code === "auth/unauthorized-domain") return "Este dominio todavía no está autorizado en Firebase para el acceso por correo.";
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
  initialMode = "register",
  allowRegister = true,
  hideSwitcher = false,
  compact = false,
  title,
  description,
  submitLabel,
  googleLabel = "Continuar con Google",
  onSuccess,
}) {
  const router = useRouter();
  const showPasswordDefault = !allowRegister && initialMode === "login";
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("neutral");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordLogin, setShowPasswordLogin] = useState(showPasswordDefault);
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
    setFeedback("Debes aceptar los términos y condiciones para continuar.", "danger");
    return false;
  }

  async function completeEmailLink(auth, email, href) {
    setLoading(true);
    setFeedback("Estamos completando tu acceso...", "neutral");
    try {
      const credential = await signInWithEmailLink(auth, email, href);
      window.localStorage.removeItem(EMAIL_LINK_STORAGE_KEY);
      await bootstrapSession(credential.user);
    } catch (error) {
      setFeedback(getAuthErrorMessage(error), "danger");
    } finally {
      setLoading(false);
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
    setFeedback("", "neutral");
    try {
      await sendSignInLinkToEmail(auth, email, {
        url: new URL("/login", window.location.origin).toString(),
        handleCodeInApp: true,
      });
      window.localStorage.setItem(EMAIL_LINK_STORAGE_KEY, email);
      setFeedback(`Te enviamos un enlace de acceso a ${email}. Ábrelo desde tu correo para entrar.`, "success");
    } catch (error) {
      setFeedback(getAuthErrorMessage(error), "danger");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    const auth = getClientAuth();
    if (!auth) return;

    if (!ensureTermsAccepted()) {
      return;
    }

    setLoading(true);
    setFeedback("", "neutral");
    try {
      const credential = await signInWithPopup(auth, getGoogleProvider());
      await bootstrapSession(credential.user, { welcome: true });
    } catch (error) {
      setFeedback(getAuthErrorMessage(error), "danger");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordLogin(event) {
    event.preventDefault();
    const auth = getClientAuth();
    if (!auth) return;

    if (!form.email.trim() || !form.password.trim()) {
      setFeedback("Escribe tu correo y tu contraseña para continuar.", "danger");
      return;
    }

    setLoading(true);
    setFeedback("", "neutral");
    try {
      const credential = await signInWithEmailAndPassword(auth, form.email.trim().toLowerCase(), form.password);
      await bootstrapSession(credential.user);
    } catch (error) {
      setFeedback(getAuthErrorMessage(error), "danger");
    } finally {
      setLoading(false);
    }
  }

  const resolvedTitle = title || (allowRegister ? "Entra o crea tu cuenta" : "Entra a tu panel");
  const resolvedDescription = description || (
    allowRegister
      ? "Accede con Google o recibe un enlace en tu correo. Así activas tu Klicor con menos fricción y sin depender de una contraseña."
      : "Accede con Google, con un enlace a tu correo o, si ya la usas, con tu contraseña."
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
          <h2 className="section-title auth-entry-title">
            {resolvedTitle}
          </h2>
          <p className="section-copy auth-entry-description">{resolvedDescription}</p>
        </div>

        {!compact ? (
          <div className="auth-entry-badges">
            <span><CheckCircle2 size={16} /> Google arriba</span>
            <span><MailCheck size={16} /> Correo sin contraseña</span>
            <span><KeyRound size={16} /> Contraseña solo si la necesitas</span>
          </div>
        ) : null}
      </div>

      <div className="auth-method-stack">
        <button className="btn btn-secondary auth-google-button" type="button" onClick={handleGoogle} disabled={loading}>
          <Chrome size={18} /> {googleLabel}
        </button>

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
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
          </div>
          <button className="btn btn-primary auth-email-button" type="button" onClick={handleEmailLink} disabled={loading}>
            {loading && pendingEmailLink ? "Entrando..." : loading ? "Enviando..." : resolvedEmailButtonLabel}
            {!loading ? <ArrowRight size={16} /> : null}
          </button>
          <p className="auth-hint">
            {pendingEmailLink
              ? "Usa el mismo correo con el que pediste el enlace para terminar el acceso."
              : "Te enviaremos un enlace directo para entrar o crear tu cuenta sin contraseña."}
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
                Términos y condiciones
              </Link>{" "}
              y la{" "}
              <Link className="terms-link" href="/privacidad" target="_blank" rel="noreferrer">
                Política de privacidad
              </Link>.
            </span>
          </label>
        ) : (
          <p className="auth-inline-note">Usa tu correo o Google para entrar sin fricción.</p>
        )}
      </div>

      <div className={`auth-password-card ${showPasswordLogin ? "is-open" : ""}`}>
        <button
          className="auth-password-toggle"
          type="button"
          onClick={() => setShowPasswordLogin((current) => !current)}
          aria-expanded={showPasswordLogin}
        >
          <span>
            <KeyRound size={16} />
            ¿Ya usas contraseña?
          </span>
          {showPasswordLogin ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {showPasswordLogin ? (
          <form className="auth-password-form" onSubmit={handlePasswordLogin}>
            <div>
              <label className="label">Contraseña</label>
              <div className="input-with-icon">
                <LockKeyhole size={18} />
                <input
                  className="input input-embedded"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="Tu contraseña actual"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                />
                <button
                  className="input-icon-button"
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button className="btn btn-secondary" disabled={loading} type="submit">
              Entrar con contraseña
            </button>
          </form>
        ) : null}
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
