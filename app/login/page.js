import Link from "next/link";
import { ArrowLeft, CheckCircle2, LayoutDashboard, MailCheck, QrCode, ShieldCheck } from "lucide-react";
import { AuthForm } from "@/components/auth-form";
import { BrandLogo } from "@/components/brand-logo";

export default function LoginPage() {
  return (
    <main className="auth-shell">
      <div className="shell auth-layout">
        <section className="auth-brand-panel auth-system-panel">
          <BrandLogo lightText />

          <div className="stack auth-system-copy">
            <span className="pill auth-system-pill">Entrada unificada</span>
            <h1 className="title auth-system-title">
              Entra a Klicor sin pelear con un formulario largo.
            </h1>
            <p className="lead auth-system-lead">
              Google y Microsoft arriba, correo con enlace como camino principal y una entrada mucho más simple para activar tu cuenta.
            </p>
          </div>

          <div className="auth-system-steps">
            <article className="auth-system-step">
              <div className="auth-system-step-index">01</div>
              <div>
                <strong>Elige una entrada simple</strong>
                <p>Continúa con Google, Microsoft o pide un enlace a tu correo para entrar sin contraseña.</p>
              </div>
            </article>
            <article className="auth-system-step">
              <div className="auth-system-step-index">02</div>
              <div>
                <strong>Verifica y entra</strong>
                <p>El enlace del correo ya valida la identidad y te lleva directo al panel cuando lo abras.</p>
              </div>
            </article>
            <article className="auth-system-step">
              <div className="auth-system-step-index">03</div>
              <div>
                <strong>Activa tu presencia</strong>
                <p>Configura enlaces, QR, cobros y contacto desde un mismo lugar apenas entres.</p>
              </div>
            </article>
          </div>

          <div className="auth-brand-points auth-system-points">
            <div className="auth-brand-point"><CheckCircle2 size={18} /> Prueba gratis durante 30 días</div>
            <div className="auth-brand-point"><MailCheck size={18} /> Correo con acceso directo</div>
            <div className="auth-brand-point"><LayoutDashboard size={18} /> Dashboard listo para editar y publicar</div>
            <div className="auth-brand-point"><QrCode size={18} /> QR estable y descargable desde tu panel</div>
          </div>

          <div className="auth-system-note">
            <ShieldCheck size={18} />
            <span>Diseñamos esta entrada para reducir fricción sin perder claridad ni control sobre tu cuenta.</span>
          </div>

          <div className="actions">
            <Link className="btn btn-secondary auth-system-back" href="/">
              <ArrowLeft size={16} /> Volver al inicio
            </Link>
          </div>
        </section>

        <AuthForm />
      </div>
    </main>
  );
}
