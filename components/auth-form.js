"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { Chrome, MailCheck } from "lucide-react";
import { getClientAuth, getGoogleProvider } from "@/lib/firebase-client";
import { apiFetch } from "@/lib/client-api";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
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
        setMessage("Te enviamos un correo para verificar tu cuenta. Luego podras entrar al dashboard.");
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
    <div className="card" style={{ padding: "1.5rem" }}>
      <div className="topbar">
        <div>
          <h2 style={{ margin: 0 }}>{mode === "login" ? "Ingresa a tu cuenta" : "Crea tu cuenta"}</h2>
          <p className="muted">Prueba gratis por 30 dias y luego cobro anual manual.</p>
        </div>
        <button className="btn btn-secondary" type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "Crear cuenta" : "Ya tengo cuenta"}</button>
      </div>
      <form className="stack" onSubmit={handleSubmit}>
        <div>
          <label className="label">Correo</label>
          <input className="input" type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        </div>
        <div>
          <label className="label">Contrasena</label>
          <input className="input" type="password" required minLength={6} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        </div>
        <button className="btn btn-primary" disabled={loading} type="submit">{loading ? "Procesando..." : mode === "login" ? "Entrar" : "Crear cuenta"}</button>
      </form>
      <div style={{ marginTop: "1rem" }}>
        <button className="btn btn-secondary" type="button" onClick={handleGoogle} disabled={loading}><Chrome size={16} /> Continuar con Google</button>
      </div>
      {message ? <p className="notice" style={{ marginTop: "1rem" }}><MailCheck size={16} style={{ verticalAlign: "middle", marginRight: ".4rem" }} /> {message}</p> : null}
    </div>
  );
}