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
  Wallet,
  Workflow,
  Zap,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { LandingLoginModal } from "@/components/landing-login-modal";
import { MarketingPreview } from "@/components/marketing-preview";

const platformFlow = [
  {
    label: "Configura",
    title: "Arma tu presencia desde un solo panel",
    description: "Nombre, imagen, botones, contacto, cobro y apariencia en el mismo sistema.",
  },
  {
    label: "Publica",
    title: "Comparte una página que sí orienta al cliente",
    description: "Tu negocio deja de repartir enlaces sueltos y pasa a una estructura clara y usable.",
  },
  {
    label: "Escala",
    title: "Usa el mismo perfil en QR, bio, tarjetas y puntos físicos",
    description: "La presencia del negocio se mantiene consistente aunque cambies usuario o ajustes tu operación.",
  },
];

const capabilityBlocks = [
  {
    icon: QrCode,
    title: "Infraestructura para compartir",
    text: "URL pública, QR estable, preview al compartir y un perfil listo para circular en digital y físico.",
  },
  {
    icon: Workflow,
    title: "Ruta más clara para el cliente",
    text: "Contacto, redes, pago y contenido organizados para que el usuario no se pierda antes de actuar.",
  },
  {
    icon: ShieldCheck,
    title: "Base operativa más seria",
    text: "Menos improvisación, mejor percepción de marca y una estructura más firme para crecer.",
  },
];

const businessCategories = [
  {
    title: "Comida y bebidas",
    description: "Restaurantes, cafés, bares, repostería y domicilios que viven de pedidos rápidos y visibilidad clara.",
    icon: UtensilsCrossed,
  },
  {
    title: "Tiendas y ventas",
    description: "Catálogos, ropa, accesorios, belleza o tecnología que venden por WhatsApp, redes y QR.",
    icon: ShoppingBag,
  },
  {
    title: "Servicios",
    description: "Negocios que necesitan cotizar, agendar, responder dudas y centralizar la atención en un solo punto.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Salud y bienestar",
    description: "Estética, peluquería, entrenamiento, odontología y bienestar que dependen de confianza y contacto directo.",
    icon: HeartPulse,
  },
  {
    title: "Turismo y experiencias",
    description: "Hoteles, glamping, tours, fincas y experiencias que deben mostrar ubicación, reserva y contacto rápido.",
    icon: TentTree,
  },
];

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
          <LandingLoginModal />
        </div>
      </header>

      <section className="shell cloud-home-hero">
        <div className="cloud-home-copy">
          <span className="pill cloud-home-kicker">
            <Sparkles size={16} />
            Presencia cloud para negocios que comparten y cobran
          </span>

          <h1 className="cloud-home-title">
            <span className="cloud-home-title-brand">Klicor</span> organiza la presencia pública de tu negocio como un sistema, no como una bio improvisada.
          </h1>

          <p className="cloud-home-lead">
            Une enlaces, contacto, QR, branding y cobro en una estructura simple de operar y clara de entender para el cliente.
          </p>

          <div className="actions">
            <LandingLoginModal
              triggerLabel="Crear mi Klicor"
              triggerClassName="btn btn-primary"
              allowRegister
              title="Crea tu Klicor"
              description="Regístrate con Google, Microsoft o correo y entra directo a tu panel."
            />
          </div>

          <div className="cloud-home-proof">
            <span><Store size={15} /> Diseñado para negocios reales</span>
            <span><Zap size={15} /> Operación simple, presencia más firme</span>
            <span><ShieldCheck size={15} /> QR y enlaces pensados para durar</span>
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
            <h2 className="landing-section-title">Más que una página con botones: una capa pública organizada para tu negocio.</h2>
            <p className="section-copy">
              Klicor toma algo que normalmente está disperso y lo vuelve operable: contacto, enlaces, QR, cobro y branding en un mismo sistema.
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
            <span className="cloud-architecture-label">Arquitectura del producto</span>
            <h2 className="landing-section-title">Klicor se entiende mejor cuando se ve como una operación conectada.</h2>
            <p className="section-copy">
              El cliente ve una página simple. Tú operas un sistema con identidad, enlaces, QR y contacto bien conectados.
            </p>
          </article>

          <div className="cloud-architecture-stack">
            <div className="cloud-architecture-card">
              <strong>Capa pública</strong>
              <p>La página que recibe al cliente, concentra enlaces, contacto y cobro visible.</p>
            </div>
            <div className="cloud-architecture-card">
              <strong>Capa operativa</strong>
              <p>El dashboard donde editas branding, enlaces, VCF, QR y configuración del perfil.</p>
            </div>
            <div className="cloud-architecture-card">
              <strong>Capa de distribución</strong>
              <p>La misma presencia se reutiliza en bio, tarjetas, stickers, vitrinas, empaques y QR.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="flujo" className="landing-section landing-section-soft">
        <div className="shell">
          <div className="section-heading landing-centered-heading">
            <span className="pill">Flujo</span>
            <h2 className="landing-section-title">La experiencia se ordena en tres momentos operativos.</h2>
          </div>

          <div className="cloud-flow-grid">
            {platformFlow.map((item, index) => (
              <article key={item.title} className="cloud-flow-card">
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
            <h2 className="landing-section-title">Klicor encaja mejor en cinco categorías amplias de negocio.</h2>
            <p className="section-copy">
              No está pensado para bios personales. Está pensado para negocios que venden, atienden o convierten desde WhatsApp, redes y QR.
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
                <strong>Una misma lógica, distintos negocios</strong>
                <span>La estructura cambia según la intención del negocio, pero siempre parte de un link, un QR y una página clara para actuar.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="precios" className="landing-section cloud-pricing-section">
        <div className="shell cloud-pricing-card">
          <div className="cloud-pricing-copy">
            <span className="pill">Precios</span>
            <h2 className="landing-section-title">Primero montas tu presencia, luego consolidas tu operación.</h2>
            <p className="section-copy">
              El producto está estructurado para que lo puedas activar sin fricción y validar rápido si resuelve tu forma de compartir.
            </p>
          </div>

          <div className="cloud-pricing-stack">
            <div className="cloud-price-box">
              <strong>Prueba gratis</strong>
              <span>30 días para configurar tu página, tu QR y tu presencia pública.</span>
            </div>
            <div className="cloud-price-box">
              <strong>Plan anual</strong>
              <span>Dashboard, URL pública, QR permanente y configuración centralizada.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="shell cloud-final-card">
          <div className="cloud-final-copy">
            <span className="pill">Empieza ahora</span>
            <h2 className="landing-section-title">Lleva tu negocio a una presencia pública más estructurada, más clara y más útil.</h2>
            <p className="section-copy">
              Crea tu Klicor, organiza tu operación visible y comparte una presencia que sí se siente como producto.
            </p>
          </div>
          <div className="actions">
            <LandingLoginModal
              triggerLabel="Crear mi Klicor"
              triggerClassName="btn btn-primary"
              allowRegister
              title="Crea tu Klicor"
              description="Regístrate con Google, Microsoft o correo y entra directo a tu panel."
            />
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="shell landing-footer-inner">
          <div className="landing-footer-brand">
            <BrandLogo size={36} />
            <p>Klicor, presencia pública, contacto y distribución en un solo sistema.</p>
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
