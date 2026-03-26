import Link from "next/link";
import { ArrowLeft, CheckCircle2, QrCode, Sparkles } from "lucide-react";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="shell hero auth-hero" style={{ minHeight: "auto" }}>
      <section className="stack auth-marketing">
        <span className="pill"><Sparkles size={16} /> Acceso y registro</span>
        <h1 className="title">Activa tu bio comercial con una experiencia más clara y rápida.</h1>
        <p className="lead">
          Regístrate con correo o Google, verifica tu cuenta y empieza con una prueba gratuita de un mes.
        </p>

        <div className="auth-feature-list">
          <div className="auth-feature-item"><CheckCircle2 size={18} /> Landing profesional en minutos</div>
          <div className="auth-feature-item"><QrCode size={18} /> QR listo para descargar</div>
          <div className="auth-feature-item"><CheckCircle2 size={18} /> Gestión simple desde tu dashboard</div>
        </div>

        <div className="auth-cta-row">
          <Link className="btn btn-secondary" href="/">
            <ArrowLeft size={16} /> Volver al inicio
          </Link>
        </div>
      </section>

      <AuthForm />
    </main>
  );
}
