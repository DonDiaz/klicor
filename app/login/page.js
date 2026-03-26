import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="shell hero" style={{ minHeight: "auto" }}>
      <section className="stack">
        <span className="pill">Acceso y registro</span>
        <h1 className="title">Activa tu bio comercial en minutos.</h1>
        <p className="lead">Usa correo y contrasena o Google. Enviaremos verificacion por correo y empezaras con una prueba gratuita de un mes.</p>
        <Link className="btn btn-secondary" href="/">Volver al inicio</Link>
      </section>
      <AuthForm />
    </main>
  );
}
