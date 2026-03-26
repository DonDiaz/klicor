import Link from "next/link";
import { ArrowRight, Copy, QrCode, Store, Zap } from "lucide-react";
import { MarketingPreview } from "@/components/marketing-preview";

export default function HomePage() {
  return (
    <main>
      <section className="shell marketing-hero">
        <div className="hero-copy">
          <div className="logo-mark">
            <span className="logo-badge">L</span>
            <span>Linka</span>
          </div>

          <span className="pill"><Zap size={16} /> Linka — todos tus enlaces en un solo lugar</span>
          <h1 className="title">Tu página para vender en un solo link</h1>
          <p className="lead">
            Crea una página pública para tu negocio, comparte una URL única, descarga tu QR y centraliza tus canales en una sola experiencia.
          </p>

          <div className="actions">
            <Link className="btn btn-primary" href="/login">
              Crear mi Linka <ArrowRight size={16} />
            </Link>
            <a className="btn btn-secondary" href="#ejemplo">
              Ver ejemplo
            </a>
          </div>

          <div className="hero-proof">
            <div className="hero-proof-item"><Store size={16} /> Ideal para negocios y emprendedores</div>
            <div className="hero-proof-item"><QrCode size={16} /> QR listo para compartir</div>
            <div className="hero-proof-item"><Copy size={16} /> URL única y fácil de recordar</div>
          </div>
        </div>

        <div id="ejemplo">
          <MarketingPreview />
        </div>
      </section>

      <section className="landing-section">
        <div className="shell">
          <div className="section-heading">
            <span className="pill">3 pasos</span>
            <h2 className="section-title" style={{ fontSize: "2rem", marginTop: "0.9rem" }}>Configura tu Linka en minutos</h2>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3 className="section-title">Crea tu perfil</h3>
              <p className="section-copy">Carga el nombre de tu negocio, tu imagen y define tu enlace público.</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3 className="section-title">Agrega tus enlaces</h3>
              <p className="section-copy">Organiza WhatsApp, Instagram, sitio web y los canales clave de tu negocio.</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3 className="section-title">Comparte tu QR</h3>
              <p className="section-copy">Descarga tu código QR y llévalo a tu vitrina, tarjetas o redes sociales.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section" style={{ paddingTop: 0 }}>
        <div className="shell">
          <div className="section-heading">
            <span className="pill" style={{ background: "var(--accent-soft)", color: "var(--dark-bg)", borderColor: "rgba(34,211,238,.18)" }}>Beneficios</span>
            <h2 className="section-title" style={{ fontSize: "2rem", marginTop: "0.9rem" }}>Una interfaz simple para vender mejor</h2>
          </div>
          <div className="benefits-grid">
            <div className="benefit-card">
              <h3 className="section-title">URL única</h3>
              <p className="section-copy">Comparte un solo enlace para dirigir a tus clientes a todos tus canales.</p>
            </div>
            <div className="benefit-card">
              <h3 className="section-title">QR automático</h3>
              <p className="section-copy">Tu QR se genera al guardar el perfil y queda listo para descargar.</p>
            </div>
            <div className="benefit-card">
              <h3 className="section-title">WhatsApp y redes</h3>
              <p className="section-copy">Lleva tráfico a tus canales principales con botones claros y consistentes.</p>
            </div>
            <div className="benefit-card">
              <h3 className="section-title">Administración simple</h3>
              <p className="section-copy">Gestiona perfil, links, QR y URL pública desde un solo dashboard.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="shell app-footer">
        <div className="topbar">
          <div className="logo-mark">
            <span className="logo-badge" style={{ width: 34, height: 34, borderRadius: 10 }}>L</span>
            <span>Linka</span>
          </div>
          <span>Todos tus enlaces en un solo lugar</span>
        </div>
      </footer>
    </main>
  );
}
