"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { Chrome, LockKeyhole, Mail, MailCheck } from "lucide-react";
import { getClientAuth, getGoogleProvider } from "@/lib/firebase-client";
import { apiFetch } from "@/lib/client-api";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState("register");
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function bootstrapSession(user, { welcome = false } = {}) {
    const token = await user.getIdToken();
    await apiFetch("/api/auth/bootstrap", {
      method: "POST",
      token,
      body: { welcome },
    });
    router.push("/dashboard");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const auth = getClientAuth();
    if (!auth) return;
    setLoading(true);
    setMessage("");
    try {
      if (mode === "register") {
        const credential = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await sendEmailVerification(credential.user);
        setMessage("Te enviamos un correo para verificar tu cuenta. Después podrás entrar al dashboard.");
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

  async function handleGoogle() {
    const auth = getClientAuth();
    if (!auth) return;
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

  return (
    <section className="card auth-card">
      <div className="stack" style={{ gap: "0.75rem" }}>
        <div className="auth-switch" role="tablist" aria-label="Modo de acceso">
          <button className={`auth-switch-btn ${mode === "register" ? "is-active" : ""}`} type="button" onClick={() => setMode("register")}>
            Crear cuenta
          </button>
          <button className={`auth-switch-btn ${mode === "login" ? "is-active" : ""}`} type="button" onClick={() => setMode("login")}>
            Ingresar
          </button>
        </div>

        <div className="stack" style={{ gap: "0.35rem" }}>
          <h2 className="section-title" style={{ fontSize: "2rem" }}>
            {mode === "register" ? "Crea tu cuenta" : "Ingresa a Linka"}
          </h2>
          <p className="section-copy">
            {mode === "register"
              ? "Activa tu perfil con correo o Google y empieza con una prueba gratis."
              : "Entra a tu panel para editar enlaces, descargar tu QR y abrir tu página."}
          </p>
        </div>
      </div>

      <form className="auth-form-grid" onSubmit={handleSubmit}>
        <div>
          <label className="label">Correo electrónico</label>
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
          <label className="label">Contraseña</label>
          <div className="input-with-icon">
            <LockKeyhole size={18} />
            <input
              className="input input-embedded"
              type="password"
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
          </div>
          {mode === "register" ? <p className="auth-hint">Tu cuenta se crea al instante y requiere verificación por correo.</p> : null}
        </div>

        <button className="btn btn-primary" disabled={loading} type="submit">
          {loading ? "Procesando..." : mode === "login" ? "Entrar al dashboard" : "Crear mi Linka"}
        </button>
      </form>

      <div className="auth-divider">
        <span>o continúa con</span>
      </div>

      <button className="btn btn-secondary" type="button" onClick={handleGoogle} disabled={loading}>
        <Chrome size={16} /> Google
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
