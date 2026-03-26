"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { BadgeCheck, Chrome, LockKeyhole, Mail, MailCheck, ShieldCheck } from "lucide-react";
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
      <div className="auth-head">
        <div>
          <span className="auth-kicker">{mode === "login" ? "Acceso seguro" : "Empieza hoy"}</span>
          <h2 className="auth-title">{mode === "login" ? "Entra a tu cuenta" : "Crea tu cuenta"}</h2>
          <p className="auth-copy">
            {mode === "login"
              ? "Gestiona tu landing, QR y suscripción desde un solo panel."
              : "Prueba gratis por 30 días. Luego decides si activas tu plan anual."}
          </p>
        </div>

        <div className="auth-switch" role="tablist" aria-label="Modo de acceso">
          <button className={`auth-switch-btn ${mode === "register" ? "is-active" : ""}`} type="button" onClick={() => setMode("register")}>
            Crear cuenta
          </button>
          <button className={`auth-switch-btn ${mode === "login" ? "is-active" : ""}`} type="button" onClick={() => setMode("login")}>
            Ingresar
          </button>
        </div>
      </div>

      <div className="auth-benefits">
        <div className="auth-benefit"><BadgeCheck size={16} /> Activación en minutos</div>
        <div className="auth-benefit"><ShieldCheck size={16} /> Verificación por correo</div>
        <div className="auth-benefit"><MailCheck size={16} /> Prueba gratis 30 días</div>
      </div>

      <form className="stack" onSubmit={handleSubmit}>
        <div>
          <label className="label">Correo electrónico</label>
          <div className="input-with-icon">
            <Mail size={18} />
            <input
              className="input input-embedded"
              type="email"
              placeholder="tucorreo@negocio.com"
              required
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
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
          </div>
          {mode === "register" ? <p className="auth-hint">Usa una contraseña fácil de recordar, pero difícil de adivinar.</p> : null}
        </div>

        <button className="btn btn-primary auth-submit" disabled={loading} type="submit">
          {loading ? "Procesando..." : mode === "login" ? "Entrar al dashboard" : "Crear cuenta gratis"}
        </button>
      </form>

      <div className="auth-divider">
        <span>o si prefieres</span>
      </div>

      <button className="btn btn-secondary auth-google" type="button" onClick={handleGoogle} disabled={loading}>
        <Chrome size={16} /> Continuar con Google
      </button>

      {message ? (
        <p className="notice auth-notice">
          <MailCheck size={16} style={{ verticalAlign: "middle", marginRight: ".4rem" }} />
          {message}
        </p>
      ) : null}
    </section>
  );
}
