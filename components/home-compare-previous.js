import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
  LayoutTemplate,
  Link2,
  MessageCircleMore,
  QrCode,
  ShieldCheck,
  Store,
  Wallet,
  Zap,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { LandingLoginModal } from "@/components/landing-login-modal";
import { MarketingPreview } from "@/components/marketing-preview";

const workflow = [
  {
    icon: LayoutTemplate,
    title: "Configura tu página",
    description: "Define el nombre de tu negocio, tu imagen, tus enlaces y la apariencia en un solo panel.",
  },
  {
    icon: QrCode,
    title: "Comparte tu presencia",
    description: "Publica tu URL, descarga tu QR permanente y úsalo en tarjetas, vitrinas, etiquetas o bio.",
  },
  {
    icon: MessageCircleMore,
    title: "Convierte mejor",
    description: "Lleva a tus clientes a WhatsApp, redes, contacto o cobro sin perderlos entre enlaces sueltos.",
  },
];

const platformBlocks = [
  {
    icon: Link2,
    title: "Perfil público claro",
    description: "Una sola página con tus enlaces clave, branding consistente y botones listos para compartir.",
    bullets: ["URL única", "Preview al compartir", "Botones ordenados por prioridad"],
  },
  {
    icon: Wallet,
    title: "Cobro visible en la landing",
    description: "Muestra tu llave Bre-B, permite copiarla y, si quieres, exhibe tu QR oficial del banco o billetera.",
    bullets: ["Llave visible", "Copiar en un toque", "QR oficial opcional"],
  },
  {
    icon: LayoutDashboard,
    title: "Panel operativo",
    description: "Edita tu página, cambia nombre, QR, enlaces, contacto y personalización sin depender de soporte.",
    bullets: ["Edición rápida", "QR estable", "Configuración centralizada"],
  },
];

const useCases = [
  {
    title: "Emprendedores",
    description: "Para organizar WhatsApp, Instagram, pagos y contacto profesional en un solo punto.",
  },
  {
    title: "Negocios físicos",
    description: "Ideal para vitrinas, empaques, mesas, stickers, tarjetas y cualquier superficie con QR.",
  },
  {
    title: "Marcas personales",
    description: "Útil para freelancers, asesores y creadores que necesitan una presencia simple pero seria.",
  },
];

const productHighlights = [
  "URL pública fácil de compartir",
  "QR permanente aunque cambies tu usuario",
  "Botones para contacto, redes y pago",
  "Panel simple para editar sin soporte técnico",
];

export function HomeComparePrevious() {
  return (
    <main className="landing-root home-root">
      <header className="landing-header">
        <div className="shell landing-nav">
          <BrandLogo />
          <nav className="landing-nav-links" aria-label="Principal">
            <a href="#producto">Producto</a>
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#casos">Casos de uso</a>
            <a href="#precios">Precios</a>
          </nav>
          <LandingLoginModal />
        </div>
      </header>

      <section className="shell home-hero">
        <div className="home-hero-copy">
          <span className="pill home-kicker">
            <Zap size={16} />
            Klicor para negocios que necesitan compartir mejor
          </span>

          <div className="home-hero-title-wrap">
            <h1 className="home-hero-title">Una presencia clara para compartir, cobrar y convertir desde un solo enlace.</h1>
            <p className="home-hero-lead">
              Klicor organiza la página pública de tu negocio para que tus clientes encuentren contacto, redes y cobro sin fricción.
            </p>
          </div>

          <div className="actions">
            <Link className="btn btn-primary" href="/login">
              Crear mi Klicor <ArrowRight size={16} />
            </Link>
            <a className="btn btn-secondary mobile-demo-link" href="#producto">
              Ver producto
            </a>
          </div>

          <div className="home-hero-metrics">
            <article className="home-metric-card">
              <strong>1 página</strong>
              <span>para reunir tus canales clave</span>
            </article>
            <article className="home-metric-card">
              <strong>1 QR estable</strong>
              <span>listo para imprimir y reutilizar</span>
            </article>
            <article className="home-metric-card">
              <strong>Más claridad</strong>
              <span>para que el cliente actúe más fácil</span>
            </article>
          </div>
        </div>

        <div className="home-hero-stage">
          <div className="home-stage-head">
            <span className="pill landing-soft-pill">Vista pública del cliente</span>
            <p className="section-copy">Así se ve una página lista para compartir en bio, QR, tarjeta o empaque.</p>
          </div>
          <div className="home-stage-frame">
            <MarketingPreview />
          </div>
          <div className="home-stage-notes">
            <div className="home-note-card">
              <Store size={18} />
              <div>
                <strong>Hecho para negocio real</strong>
                <span>No para “links bonitos”, sino para orientar acciones.</span>
              </div>
            </div>
            <div className="home-note-card">
              <ShieldCheck size={18} />
              <div>
                <strong>Base técnica estable</strong>
                <span>URL pública, QR permanente y edición desde dashboard.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section home-logic-band">
        <div className="shell home-logic-grid">
          <div className="home-logic-copy">
            <span className="pill home-soft-pill">Qué resuelve</span>
            <h2 className="landing-section-title">Tu negocio no debería depender de enlaces sueltos ni de mensajes dispersos.</h2>
            <p className="section-copy">
              Klicor convierte tu presencia digital en una estructura simple: una página pública clara, una acción directa y una forma ordenada de compartir.
            </p>
          </div>

          <div className="home-logic-points">
            {productHighlights.map((item) => (
              <div key={item} className="home-logic-point">
                <CheckCircle2 size={18} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="producto" className="landing-section">
        <div className="shell">
          <div className="section-heading">
            <span className="pill">Producto</span>
            <h2 className="landing-section-title">Una plataforma pequeña por fuera, pero bien estructurada por dentro.</h2>
            <p className="section-copy">
              Todo está pensado para que el cliente vea una página clara y tú tengas control desde un panel centralizado.
            </p>
          </div>

          <div className="home-product-grid">
            <article className="home-product-lead">
              <div className="home-product-lead-copy">
                <strong className="home-panel-label">Vista del producto</strong>
                <h3>Tu página pública, tu QR y tu configuración viven en el mismo sistema.</h3>
                <p>
                  No es solo una bio con botones. Es una presencia operativa para compartir mejor tu negocio y llevar a tus clientes a la acción correcta.
                </p>
              </div>

              <div className="home-product-mini-grid">
                <div className="home-product-mini-card">
                  <span>Comparte</span>
                  <strong>Bio, QR, stickers, tarjetas y vitrinas</strong>
                </div>
                <div className="home-product-mini-card">
                  <span>Convierte</span>
                  <strong>WhatsApp, redes, contacto y cobro visible</strong>
                </div>
              </div>
            </article>

            <div className="home-product-stack">
              {platformBlocks.map((block) => {
                const Icon = block.icon;
                return (
                  <article key={block.title} className="home-product-card">
                    <div className="home-product-card-top">
                      <div className="home-product-icon">
                        <Icon size={18} />
                      </div>
                      <strong>{block.title}</strong>
                    </div>
                    <p>{block.description}</p>
                    <div className="home-product-bullets">
                      {block.bullets.map((bullet) => (
                        <span key={bullet}>
                          <CheckCircle2 size={15} />
                          {bullet}
                        </span>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="landing-section landing-section-soft">
        <div className="shell">
          <div className="section-heading landing-centered-heading">
            <span className="pill">Cómo funciona</span>
            <h2 className="landing-section-title">La operación está pensada para ser simple desde el día uno.</h2>
            <p className="section-copy">
              Configuras tu perfil, publicas tu página y luego solo ajustas cuando tu negocio lo necesite.
            </p>
          </div>

          <div className="home-workflow-grid">
            {workflow.map((step, index) => {
              const Icon = step.icon;
              return (
                <article key={step.title} className="home-workflow-card">
                  <div className="home-workflow-head">
                    <div className="home-product-icon">
                      <Icon size={18} />
                    </div>
                    <span>0{index + 1}</span>
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="casos" className="landing-section">
        <div className="shell">
          <div className="section-heading">
            <span className="pill home-soft-pill">Casos de uso</span>
            <h2 className="landing-section-title">Pensado para negocios que necesitan verse mejor y responder más rápido.</h2>
          </div>

          <div className="home-use-cases">
            {useCases.map((item) => (
              <article key={item.title} className="home-use-case-card">
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="precios" className="landing-section landing-section-soft">
        <div className="shell">
          <div className="home-pricing-card">
            <div className="home-pricing-copy">
              <span className="pill">Precios</span>
              <h2 className="landing-section-title">Empieza con prueba gratis y luego pasa a un esquema anual simple.</h2>
              <p className="section-copy">
                La idea es que primero montes tu presencia, valides cómo se ve tu negocio y luego consolides tu operación.
              </p>
            </div>

            <div className="home-pricing-rail">
              <div className="home-pricing-point">
                <strong>Prueba gratis</strong>
                <span>30 días para configurar tu página y dejar tu QR listo.</span>
              </div>
              <div className="home-pricing-point">
                <strong>Plan anual</strong>
                <span>URL pública, QR permanente, dashboard y configuración del perfil.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="shell home-final-card">
          <div className="home-final-copy">
            <span className="pill">Empieza ahora</span>
            <h2 className="landing-section-title">Haz que compartir tu negocio se vea más serio, más claro y más útil.</h2>
            <p className="section-copy">
              Crea tu Klicor, organiza tus botones y deja lista una presencia que sí puedas usar en digital y en físico.
            </p>
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
            <p>Klicor, una página operativa para compartir tu negocio desde un solo enlace.</p>
          </div>
          <div className="landing-footer-links">
            <Link href="/terminos-y-condiciones">Términos y condiciones</Link>
            <Link href="/politica-de-privacidad">Política de privacidad</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
