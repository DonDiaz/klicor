import Link from "next/link";
import { ArrowLeft, CheckCircle2, Link2, QrCode } from "lucide-react";
import { AuthForm } from "@/components/auth-form";
import { BrandLogo } from "@/components/brand-logo";

export default function LoginPage() {
  return (
    <main className="auth-shell">
      <div className="shell auth-layout">
        <section className="auth-brand-panel">
          <BrandLogo />

          <div className="stack">
            <span className="pill">Acceso y registro</span>
            <h1 className="title" style={{ fontSize: "clamp(2.4rem, 6vw, 4.2rem)" }}>
              Empieza con una cuenta clara, simple y lista para vender.
            </h1>
            <p className="lead">
              Regístrate con correo o Google y activa tu página pública, tu URL única y tu QR en una sola plataforma.
            </p>
          </div>

          <div className="auth-brand-points">
            <div className="auth-brand-point"><CheckCircle2 size={18} /> Prueba gratis durante 30 días</div>
            <div className="auth-brand-point"><Link2 size={18} /> Un solo enlace para todos tus canales</div>
            <div className="auth-brand-point"><QrCode size={18} /> QR descargable desde tu panel</div>
          </div>

          <div className="actions">
            <Link className="btn btn-secondary" href="/">
              <ArrowLeft size={16} /> Volver al inicio
            </Link>
          </div>
        </section>

        <AuthForm />
      </div>
    </main>
  );
}
