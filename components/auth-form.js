"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { Chrome, Eye, EyeOff, LockKeyhole, Mail, MailCheck } from "lucide-react";
import { getClientAuth, getGoogleProvider } from "@/lib/firebase-client";
import { apiFetch } from "@/lib/client-api";

export function AuthForm({
  initialMode = "register",
  allowRegister = true,
  hideSwitcher = false,
  title,
  description,
  submitLabel,
  googleLabel = "Google",
  onSuccess,
}) {
  const router = useRouter();
  const [mode, setMode] = useState(allowRegister ? initialMode : "login");
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTermsPrompt, setShowTermsPrompt] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  async function bootstrapSession(user, { welcome = false } = {}) {
    const token = await user.getIdToken();
    await apiFetch("/api/auth/bootstrap", {
      method: "POST",
      token,
      body: { welcome },
    });

    if (onSuccess) {
      onSuccess(user);
      return;
    }

    router.push("/dashboard");
  }

  function openTermsPrompt(action) {
    setPendingAction(action);
    setShowTermsPrompt(true);
    setMessage("");
  }

  function closeTermsPrompt() {
    setPendingAction(null);
    setShowTermsPrompt(false);
  }

  async function runEmailFlow(auth) {
    setLoading(true);
    setMessage("");
    try {
      if (mode === "register") {
        const credential = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await sendEmailVerification(credential.user);
        setMessage("Te enviamos un correo para verificar tu cuenta. Despues podras entrar al dashboard.");
        await bootstrapSession(credential.user);
      } else {
        const credential = await signInWithEmailAndPassword(auth, form.email, form.password);
        await bootstrapSession(credential.user);
      }
    } catch (error) {
      setMessage(error.message || "No pudimos procesar tu solicitud");
    } finally {
      setLoading(false);
    }
  }

  async function runGoogleFlow(auth) {
    setLoading(true);
    setMessage("");
    try {
      const credential = await signInWithPopup(auth, getGoogleProvider());
      await bootstrapSession(credential.user, { welcome: true });
    } catch (error) {
      setMessage(error.message || "No pudimos iniciar con Google");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const auth = getClientAuth();
    if (!auth) return;

    if (mode === "register" && form.password !== form.confirmPassword) {
      setMessage("Las contrasenas no coinciden.");
      return;
    }

    if (mode === "register" && !acceptedTerms) {
      openTermsPrompt("email");
      return;
    }

    await runEmailFlow(auth);
  }

  async function handleGoogle() {
    const auth = getClientAuth();
    if (!auth) return;

    if (mode === "register" && !acceptedTerms) {
      openTermsPrompt("google");
      return;
    }

    await runGoogleFlow(auth);
  }

  async function handleAcceptTerms() {
    if (!acceptedTerms) {
      setMessage("Debes aceptar los terminos y condiciones para continuar.");
      return;
    }

    const auth = getClientAuth();
    if (!auth) return;

    const action = pendingAction;
    closeTermsPrompt();

    if (action === "google") {
      await runGoogleFlow(auth);
      return;
    }

    await runEmailFlow(auth);
  }

  const resolvedTitle = title || (mode === "register" ? "Crea tu cuenta" : "Ingresa a Klicor");
  const resolvedDescription = description || (
    mode === "register"
      ? "Activa tu perfil con correo o Google y empieza con una prueba gratis."
      : "Entra a tu panel para editar enlaces, descargar tu QR y abrir tu pagina."
  );
  const resolvedSubmitLabel = submitLabel || (mode === "login" ? "Entrar al dashboard" : "Crear mi Klicor");

  return (
    <section className="card auth-card">
      <div className="stack" style={{ gap: "0.75rem" }}>
        {!hideSwitcher ? (
          <div className="auth-switch" role="tablist" aria-label="Modo de acceso">
            <button
              className={`auth-switch-btn ${mode === "register" ? "is-active" : ""}`}
              type="button"
              onClick={() => {
                setMode("register");
                closeTermsPrompt();
              }}
            >
              Crear cuenta
            </button>
            <button
              className={`auth-switch-btn ${mode === "login" ? "is-active" : ""}`}
              type="button"
              onClick={() => {
                setMode("login");
                closeTermsPrompt();
              }}
            >
              Ingresar
            </button>
          </div>
        ) : null}

        <div className="stack" style={{ gap: "0.35rem" }}>
          <h2 className="section-title" style={{ fontSize: "2rem" }}>
            {resolvedTitle}
          </h2>
          <p className="section-copy">{resolvedDescription}</p>
        </div>
      </div>

      <form className="auth-form-grid" onSubmit={handleSubmit}>
        <div>
          <label className="label">Correo electronico</label>
          <div className="input-with-icon">
            <Mail size={18} />
            <input
              className="input input-embedded"
              type="email"
              required
              placeholder="tucorreo@negocio.com"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="label">Contrasena</label>
          <div className="input-with-icon">
            <LockKeyhole size={18} />
            <input
              className="input input-embedded"
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              placeholder="Minimo 6 caracteres"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
            <button
              className="input-icon-button"
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {mode === "register" ? <p className="auth-hint">Tu cuenta se crea al instante y requiere verificacion por correo.</p> : null}
        </div>

        {mode === "register" ? (
          <div>
            <label className="label">Confirmar contrasena</label>
            <div className="input-with-icon">
              <LockKeyhole size={18} />
              <input
                className="input input-embedded"
                type={showConfirmPassword ? "text" : "password"}
                required
                minLength={6}
                placeholder="Repite tu contrasena"
                value={form.confirmPassword}
                onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
              />
              <button
                className="input-icon-button"
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                aria-label={showConfirmPassword ? "Ocultar confirmacion de contrasena" : "Mostrar confirmacion de contrasena"}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        ) : null}

        <div className="auth-submit-wrap">
          <button className="btn btn-primary" disabled={loading} type="submit">
            {loading ? "Procesando..." : resolvedSubmitLabel}
          </button>

          {mode === "register" && showTermsPrompt ? (
            <div className="terms-popover" role="dialog" aria-live="polite">
              <div className="stack" style={{ gap: "0.75rem" }}>
                <strong>Debes aceptar nuestros terminos para continuar.</strong>
                <p className="section-copy">
                  Para crear tu cuenta en Klicor debes aceptar los{" "}
                  <Link className="terms-link" href="/terminos" target="_blank" rel="noreferrer">
                    Terminos y condiciones
                  </Link>{" "}
                  y la{" "}
                  <Link className="terms-link" href="/privacidad" target="_blank" rel="noreferrer">
                    Politica de privacidad
                  </Link>.
                </p>

                <label className="terms-check">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(event) => setAcceptedTerms(event.target.checked)}
                  />
                  <span>He leido y acepto los terminos y condiciones de Klicor.</span>
                </label>

                <div className="actions">
                  <button className="btn btn-secondary" type="button" onClick={closeTermsPrompt}>
                    Cancelar
                  </button>
                  <button className="btn btn-primary" type="button" onClick={handleAcceptTerms} disabled={loading}>
                    Aceptar y continuar
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </form>

      <div className="auth-divider">
        <span>o continua con</span>
      </div>

      <button className="btn btn-secondary" type="button" onClick={handleGoogle} disabled={loading}>
        <Chrome size={16} /> {googleLabel}
      </button>

      {message ? (
        <p className="notice">
          <MailCheck size={16} />
          <span>{message}</span>
        </p>
      ) : null}
    </section>
  );
}
