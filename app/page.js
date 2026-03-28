import Link from "next/link";
import { ArrowRight, CheckCircle2, LayoutTemplate, MessageCircleMore, QrCode, ShieldCheck, Store, Zap } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { LandingLoginModal } from "@/components/landing-login-modal";
import { MarketingPreview } from "@/components/marketing-preview";

const howItWorks = [
  {
    icon: LayoutTemplate,
    title: "Crea tu perfil",
    description: "Define el nombre de tu negocio, tu imagen y tu enlace público en minutos.",
  },
  {
    icon: MessageCircleMore,
    title: "Agrega tus enlaces",
    description: "Conecta WhatsApp, redes y tus canales principales en una sola página.",
  },
  {
    icon: QrCode,
    title: "Comparte tu QR",
    description: "Descarga el código QR y úsalo en empaques, etiquetas, tarjetas o vitrina.",
  },
];

const benefits = [
  "URL única para compartir tu negocio",
  "QR automático listo para imprimir",
  "WhatsApp integrado para contacto directo",
  "Panel simple para editar sin soporte técnico",
];

export default function HomePage() {
  return (
    <main className="landing-root">
      <header className="landing-header">
        <div className="shell landing-nav">
          <BrandLogo />
          <nav className="landing-nav-links" aria-label="Principal">
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#precios">Precios</a>
          </nav>
          <LandingLoginModal />
        </div>
      </header>

      <section className="shell landing-hero">
        <div className="landing-hero-copy">
          <span className="pill">
            <Zap size={16} />
            Klicor - todos tus enlaces en un solo lugar
          </span>
          <h1 className="landing-hero-title">Tu página para vender con un solo enlace</h1>
          <p className="landing-hero-lead">
            Centraliza WhatsApp, redes y tu negocio en una sola página lista para compartir.
          </p>
          <div className="actions">
            <Link className="btn btn-primary" href="/login">
              Crear mi Klicor <ArrowRight size={16} />
            </Link>
            <a className="btn btn-secondary mobile-demo-link" href="#ejemplo">
              Ver ejemplo
            </a>
          </div>
          <div className="landing-mini-proof">
            <span><Store size={15} /> Ideal para emprendedores y negocios</span>
            <span><ShieldCheck size={15} /> Software claro, simple y profesional</span>
          </div>
        </div>

        <div id="ejemplo" className="landing-hero-visual">
          <div className="landing-visual-caption">
            <span className="pill landing-soft-pill">Vista pública</span>
            <p className="section-copy">Así se ve un Klicor listo para compartir con clientes.</p>
          </div>
          <MarketingPreview />
        </div>
      </section>

      <section className="landing-strip">
        <div className="shell landing-strip-grid">
          <div className="landing-strip-item">
            <strong>Ideal para emprendedores y negocios</strong>
            <p>Una forma simple de ordenar tus canales sin conocimientos técnicos.</p>
          </div>
          <div className="landing-strip-item">
            <strong>Listo para cobrar confianza</strong>
            <p>Tu negocio se ve serio, claro y fácil de compartir desde el primer día.</p>
          </div>
          <div className="landing-strip-item">
            <strong>Hecho para compartir</strong>
            <p>Funciona bien en bio, tarjetas, empaques, etiquetas y puntos físicos.</p>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="shell">
          <div className="section-heading landing-centered-heading">
            <span className="pill landing-soft-pill">Problema y solución</span>
            <h2 className="landing-section-title">Tus clientes no deberían perderse entre enlaces.</h2>
          </div>
          <div className="problem-solution-grid">
            <article className="problem-card">
              <span className="problem-label">Antes</span>
              <ul className="problem-list">
                <li>Tus clientes no encuentran tus enlaces.</li>
                <li>Pierdes ventas por desorden.</li>
                <li>Compartes varios enlaces y ninguno guía bien la acción.</li>
              </ul>
            </article>
            <article className="solution-card">
              <span className="solution-label">Después</span>
              <h3>Un solo enlace para todo tu negocio</h3>
              <p>
                Klicor organiza tus canales en una página clara, lista para compartir y pensada para convertir mejor.
              </p>
              <div className="solution-points">
                <span><CheckCircle2 size={16} /> Más claridad para el cliente</span>
                <span><CheckCircle2 size={16} /> Mejor percepción de marca</span>
                <span><CheckCircle2 size={16} /> Un CTA directo a WhatsApp y redes</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="landing-section landing-section-soft">
        <div className="shell">
          <div className="section-heading landing-centered-heading">
            <span className="pill">Cómo funciona</span>
            <h2 className="landing-section-title">Tres pasos para publicar tu Klicor</h2>
            <p className="section-copy">Sin configuraciones técnicas. Solo completas tu perfil y empiezas a compartir.</p>
          </div>
          <div className="steps-grid landing-steps-grid">
            {howItWorks.map((step, index) => {
              const Icon = step.icon;
              return (
                <article key={step.title} className="landing-step-card">
                  <div className="landing-step-top">
                    <div className="landing-step-icon">
                      <Icon size={18} />
                    </div>
                    <span className="landing-step-count">0{index + 1}</span>
                  </div>
                  <h3 className="section-title">{step.title}</h3>
                  <p className="section-copy">{step.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="shell benefits-layout">
          <div className="section-heading" style={{ marginBottom: 0 }}>
            <span className="pill landing-soft-pill">Beneficios</span>
            <h2 className="landing-section-title">Todo lo necesario para compartir mejor tu negocio</h2>
            <p className="section-copy">Una experiencia simple para ti y clara para tus clientes.</p>
          </div>

          <div className="benefits-panel">
            {benefits.map((benefit) => (
              <div key={benefit} className="benefit-bullet">
                <CheckCircle2 size={18} />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="precios" className="landing-section landing-section-soft">
        <div className="shell">
          <div className="pricing-card">
            <div className="pricing-copy">
              <span className="pill">Precios</span>
              <h2 className="landing-section-title">Empieza gratis y activa tu plan anual cuando estés listo</h2>
              <p className="section-copy">
                Crea tu página, organiza tus enlaces y valida tu Klicor antes de pasar al cobro anual.
              </p>
            </div>
            <div className="pricing-points">
              <div className="pricing-point">
                <strong>Prueba gratis</strong>
                <span>30 días para configurar y compartir</span>
              </div>
              <div className="pricing-point">
                <strong>Plan anual</strong>
                <span>URL única, QR automático y panel de administración</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="shell final-cta-card">
          <div>
            <span className="pill">Empieza gratis hoy</span>
            <h2 className="landing-section-title">Ordena tus enlaces y comparte una presencia más profesional.</h2>
            <p className="section-copy">Crea tu Klicor y deja listo tu negocio para compartir con un solo enlace.</p>
          </div>
          <div className="actions">
            <Link className="btn btn-primary" href="/login">
              Crear mi Klicor <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="shell landing-footer-inner">
          <div className="landing-footer-brand">
            <BrandLogo size={36} />
            <p>Klicor - todos tus enlaces en un solo lugar</p>
          </div>
          <div className="landing-footer-links">
            <Link href="/terminos">Términos y condiciones</Link>
            <Link href="/privacidad">Política de privacidad</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
