import Link from "next/link";
import {
  BriefcaseBusiness,
  CheckCircle2,
  HeartPulse,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  TentTree,
  UtensilsCrossed,
  Workflow,
  Zap,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { LandingLoginModal } from "@/components/landing-login-modal";
import { MarketingPreview } from "@/components/marketing-preview";
import { getLandingPricingPlans } from "@/lib/plans";

const platformFlow = [
  {
    label: "Configura",
    title: "Configura",
    description: "Crea tu negocio en minutos. Agrega productos, contacto y botones sin conocimientos técnicos.",
  },
  {
    label: "Publica",
    title: "Publica",
    description: "Comparte un link que sí convierte. Tu cliente entra y entiende qué hacer.",
  },
  {
    label: "Escala",
    title: "Escala",
    description: "Usa el mismo link en todo. QR, redes, tarjetas, empaques… todo conectado.",
  },
];

const capabilityBlocks = [
  {
    icon: QrCode,
    title: "Todo en un solo lugar",
    text: "Tu negocio, productos, contacto y pagos organizados en un solo link.",
  },
  {
    icon: Workflow,
    title: "Más ventas, menos preguntas",
    text: "El cliente encuentra todo sin escribirte mil veces.",
  },
  {
    icon: ShieldCheck,
    title: "Imagen más profesional",
    text: "Dejas de parecer informal y empiezas a vender como negocio serio.",
  },
];

const businessCategories = [
  {
    title: "Comida y bebidas",
    description: "Restaurantes, cafés, bares, repostería y domicilios que necesitan mostrar menú, recibir pedidos y responder rápido.",
    icon: UtensilsCrossed,
  },
  {
    title: "Tiendas y ventas",
    description: "Ropa, accesorios, belleza o tecnología que venden por WhatsApp, QR y redes sin perder orden.",
    icon: ShoppingBag,
  },
  {
    title: "Servicios",
    description: "Negocios que cotizan, agendan y convierten mejor cuando el cliente encuentra todo claro.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Salud y bienestar",
    description: "Estética, peluquería, entrenamiento, odontología y bienestar que viven de confianza y atención rápida.",
    icon: HeartPulse,
  },
  {
    title: "Turismo y experiencias",
    description: "Hoteles, glamping, tours, fincas y experiencias que necesitan mostrar, atender y cerrar desde un solo link.",
    icon: TentTree,
  },
];

const pricingPlans = getLandingPricingPlans();

const registerModalProps = {
  allowRegister: true,
  align: "start",
  title: "Crear mi Klicor",
  description: "Regístrate con Google o correo y entra directo a tu panel.",
};

export default function HomePage() {
  return (
    <main className="landing-root cloud-home-root">
      <header className="landing-header cloud-home-header">
        <div className="shell landing-nav">
          <BrandLogo />
          <nav className="landing-nav-links" aria-label="Principal">
            <a href="#plataforma">Plataforma</a>
            <a href="#flujo">Flujo</a>
            <a href="#casos">Casos</a>
            <a href="#precios">Precios</a>
          </nav>
          <div className="actions">
            <LandingLoginModal
              triggerLabel="Iniciar sesión"
              title="Iniciar sesión"
              description="Entra con Google o un enlace a tu correo para administrar tu Klicor."
            />
            <LandingLoginModal
              triggerLabel="Crear mi Klicor"
              triggerClassName="btn btn-primary"
              {...registerModalProps}
            />
          </div>
        </div>
      </header>

      <section className="shell cloud-home-hero">
        <div className="cloud-home-copy">
          <span className="pill cloud-home-kicker">
            <Sparkles size={16} />
            Diseñado para negocios reales
          </span>

          <h1 className="cloud-home-title">
            Tu negocio más organizado.
            <span className="cloud-home-title-brand">
              Tus clientes compran más fácil.
            </span>
          </h1>

          <p className="cloud-home-lead">
            Vende por WhatsApp, muestra tus productos y recibe pedidos desde un solo link claro, sin enredos.
          </p>

          <div className="actions">
            <LandingLoginModal
              triggerLabel="Crear mi Klicor"
              triggerClassName="btn btn-primary"
              {...registerModalProps}
            />
          </div>

          <div className="cloud-home-proof">
            <span><Store size={15} /> Productos, contacto y pedidos en un solo lugar</span>
            <span><Zap size={15} /> Menos preguntas repetidas, más pedidos claros</span>
            <span><ShieldCheck size={15} /> QR listo para tu local, redes y empaques</span>
          </div>
        </div>

        <div className="cloud-home-console cloud-home-console-media">
          <div className="cloud-console-preview">
            <MarketingPreview />
          </div>
        </div>
      </section>

      <section className="landing-section cloud-home-band" id="plataforma">
        <div className="shell cloud-platform-shell">
          <div className="cloud-platform-copy">
            <span className="pill cloud-home-soft-pill">Plataforma</span>
            <h2 className="landing-section-title">No es solo un link. Es tu punto de venta digital.</h2>
            <p className="section-copy">
              Tus clientes llegan, ven, entienden y compran. Sin enlaces sueltos, sin confusión.
            </p>
          </div>

          <div className="cloud-capability-grid">
            {capabilityBlocks.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="cloud-capability-card">
                  <div className="cloud-capability-top">
                    <div className="cloud-console-icon">
                      <Icon size={18} />
                    </div>
                    <strong>{item.title}</strong>
                  </div>
                  <p>{item.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="landing-section cloud-architecture-section">
        <div className="shell cloud-architecture-grid">
          <article className="cloud-architecture-lead">
            <span className="cloud-architecture-label">No es falta de clientes</span>
            <h2 className="landing-section-title">Tu negocio no necesita más mensajes. Necesita más claridad.</h2>
            <p className="section-copy">
              Cuando todo está ordenado, el cliente entiende qué vendes, cómo pedir y cómo pagarte sin escribirte mil veces.
            </p>
          </article>

          <div className="cloud-architecture-stack">
            <div className="cloud-architecture-card">
              <strong>Clientes preguntando lo mismo</strong>
              <p>Tu WhatsApp deja de llenarse solo de dudas y empieza a recibir pedidos más claros.</p>
            </div>
            <div className="cloud-architecture-card">
              <strong>Productos desordenados</strong>
              <p>Categorías, fotos, precios y estados quedan listos para que el cliente decida rápido.</p>
            </div>
            <div className="cloud-architecture-card">
              <strong>Links por todos lados</strong>
              <p>Un solo Klicor reúne menú, catálogo, agenda, pagos, redes, contacto y QR.</p>
            </div>
            <div className="cloud-architecture-card">
              <strong>Ventas que se pierden</strong>
              <p>Si el cliente encuentra todo fácil, tiene menos motivos para irse sin escribirte.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="flujo" className="landing-section landing-section-soft">
        <div className="shell">
          <div className="section-heading landing-centered-heading">
            <span className="pill">Flujo</span>
            <h2 className="landing-section-title">Así funciona Klicor</h2>
          </div>

          <div className="cloud-flow-grid">
            {platformFlow.map((item, index) => (
              <article key={`${item.label}-${index}`} className="cloud-flow-card">
                <div className="cloud-flow-index">0{index + 1}</div>
                <span className="cloud-flow-label">{item.label}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="casos" className="landing-section">
        <div className="shell cloud-cases-grid">
          <div className="cloud-cases-copy">
            <span className="pill cloud-home-soft-pill">Categorías</span>
            <h2 className="landing-section-title">Perfecto para negocios que venden y atienden por WhatsApp</h2>
            <p className="section-copy">
              Funciona para negocios que necesitan mostrar mejor lo que venden, responder más rápido y cerrar sin desorden.
            </p>
          </div>

          <div className="cloud-cases-list">
            {businessCategories.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="cloud-case-item">
                  <Icon size={18} />
                  <div className="cloud-case-copy">
                    <strong>{item.title}</strong>
                    <span>{item.description}</span>
                  </div>
                </div>
              );
            })}
            <div className="cloud-case-item cloud-case-item-summary">
              <CheckCircle2 size={18} />
              <div className="cloud-case-copy">
                <strong>Un solo link para vender mejor</strong>
                <span>Si tu negocio vende o atiende por WhatsApp, Klicor te ayuda a ordenar lo importante y hacer más fácil cada contacto.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="precios" className="landing-section cloud-pricing-section">
        <div className="shell cloud-pricing-card">
          <div className="cloud-pricing-copy">
            <span className="pill">Precios</span>
            <h2 className="landing-section-title">Planes simples para vender mejor</h2>
            <p className="section-copy">
              Planes anuales para uso normal del negocio. Si tu operación maneja alto flujo, lo revisamos contigo antes de proponer un plan empresarial.
            </p>
          </div>

          <div className="cloud-pricing-stack">
            {pricingPlans.map((plan) => (
              <div key={plan.name} className={`cloud-price-box ${plan.name === "Emprendedor" ? "is-featured" : ""}`.trim()}>
                <div className="cloud-price-content">
                  {plan.badge ? <div className="pill cloud-price-badge">{plan.badge}</div> : null}
                  <strong>{plan.name}</strong>
                  <div className="cloud-price-value">{plan.price}</div>
                  <small>{plan.period} · {plan.note}</small>
                  <ul className="cloud-price-features">
                    {plan.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </div>
                {plan.name === "Business" ? <p className="cloud-price-support">¿Manejas alto flujo? Te cotizamos un plan empresarial.</p> : null}
                <div className="actions">
                  <LandingLoginModal
                    triggerLabel={plan.buttonLabel}
                    triggerClassName="btn btn-primary"
                    {...registerModalProps}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="shell cloud-final-card">
          <div className="cloud-final-copy">
            <span className="pill">Empieza ahora</span>
            <h2 className="landing-section-title">Empieza hoy y vende como un negocio organizado</h2>
            <p className="section-copy">
              Organiza tu atención, comparte mejor tus productos y haz que comprar sea más fácil para tus clientes.
            </p>
          </div>
          <div className="actions">
            <LandingLoginModal
              triggerLabel="Crear mi Klicor ahora"
              triggerClassName="btn btn-primary"
              {...registerModalProps}
            />
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="shell landing-footer-inner">
          <div className="landing-footer-brand">
            <BrandLogo size={36} />
            <p>Klicor, tu punto de venta digital en un solo link.</p>
          </div>
          <div className="landing-footer-links">
            <Link href="/terminos-y-condiciones">Términos y condiciones</Link>
            <Link href="/politica-de-privacidad">Política de privacidad</Link>
            <Link href="/politica-de-pagos">Política de pagos</Link>
            <Link href="/uso-permitido">Uso permitido</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
