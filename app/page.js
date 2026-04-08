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

const pricingPlans = [
  {
    name: "Esencial",
    price: "$59.900",
    features: [
      "Link personalizado",
      "Código QR incluido",
      "Botones (WhatsApp, redes)",
      "Información del negocio",
      "Soporte básico",
    ],
    buttonLabel: "Empezar",
  },
  {
    name: "Negocio",
    price: "$109.900",
    badge: "Más vendido",
    features: [
      "Todo lo del plan Esencial",
      "Hasta 50 productos",
      "Catálogo organizado",
      "Personalización mejorada",
    ],
    buttonLabel: "Elegir plan",
  },
  {
    name: "Pro",
    price: "$169.900",
    features: [
      "Todo lo del plan Negocio",
      "Hasta 300 productos",
      "Mayor capacidad de crecimiento",
      "Ideal para negocios con alto volumen",
    ],
    buttonLabel: "Escalar mi negocio",
  },
];

const registerModalProps = {
  allowRegister: true,
  align: "start",
  title: "Crear mi Klicor",
  description: "Regístrate con Google, Microsoft o correo y entra directo a tu panel.",
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
              description="Entra con Google, Microsoft o un enlace a tu correo para administrar tu Klicor."
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
            Vende más fácil.
            <span className="cloud-home-title-brand">
              Organiza tu negocio en un solo link.
            </span>
          </h1>

          <p className="cloud-home-lead">
            Recibe pedidos, muestra tus productos y atiende clientes desde WhatsApp, redes y QR, sin enredos.
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
            <span><Zap size={15} /> Más claridad para vender sin perder tiempo</span>
            <span><ShieldCheck size={15} /> Listo para compartir en QR, redes y WhatsApp</span>
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
            <span className="cloud-architecture-label">Más claridad para vender</span>
            <h2 className="landing-section-title">Tu cliente entiende más rápido. Tu negocio se ve más profesional.</h2>
            <p className="section-copy">
              Lo que por fuera se siente simple, por dentro te ayuda a ordenar atención, productos y contacto sin enredos.
            </p>
          </article>

          <div className="cloud-architecture-stack">
            <div className="cloud-architecture-card">
              <strong>Lo ve el cliente</strong>
              <p>Una página clara para entender qué vendes, cómo pedir y cómo contactarte.</p>
            </div>
            <div className="cloud-architecture-card">
              <strong>Lo manejas fácil</strong>
              <p>Organizas categorías, productos y botones desde un solo punto sin sentir un sistema complicado.</p>
            </div>
            <div className="cloud-architecture-card">
              <strong>Lo compartes en todo</strong>
              <p>El mismo Klicor funciona en QR, redes, vitrinas, empaques y tarjetas sin duplicar esfuerzos.</p>
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
            <h2 className="landing-section-title">Empieza gratis. Escala cuando tu negocio crezca.</h2>
            <p className="section-copy">
              Elige lo que necesitas hoy y sube de nivel cuando necesites más productos, más orden y más capacidad.
            </p>
          </div>

          <div className="cloud-pricing-stack">
            {pricingPlans.map((plan) => (
              <div key={plan.name} className="cloud-price-box">
                {plan.badge ? (
                  <>
                    <div className="pill">{plan.badge}</div>
                    <br />
                  </>
                ) : null}
                <strong>{plan.name}</strong>
                <div>{plan.price}</div>
                <br />
                <span>{plan.features.join(" · ")}</span>
                <br />
                <br />
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
            <Link href="/terminos">Términos y condiciones</Link>
            <Link href="/privacidad">Política de privacidad</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
