import Link from "next/link";
import { ArrowRight, BadgeCheck, QrCode, Store } from "lucide-react";
import { MarketingPreview } from "@/components/marketing-preview";

export default function HomePage() {
  return (
    <main className="shell hero">
      <section className="stack">
        <span className="pill"><BadgeCheck size={16} /> Link in bio para negocios con QR y cobro anual</span>
        <h1 className="title">BioImpulso convierte tus redes en una vitrina lista para vender.</h1>
        <p className="lead">Crea una landing publica, recibe un enlace unico, comparte tu QR y administra tu suscripcion sin depender de nadie.</p>
        <div className="actions">
          <Link className="btn btn-primary" href="/login">Empezar gratis <ArrowRight size={16} /></Link>
          <a className="btn btn-secondary" href="#como-funciona">Ver flujo</a>
        </div>
        <div id="como-funciona" className="grid-3">
          <div className="panel"><Store size={18} /><h3>1. Crea tu perfil</h3><p className="muted">Registra tu negocio, sube foto y define tu usuario publico.</p></div>
          <div className="panel"><QrCode size={18} /><h3>2. Descarga tu QR</h3><p className="muted">Se genera automaticamente cuando guardas o cambias tu username.</p></div>
          <div className="panel"><BadgeCheck size={18} /><h3>3. Activa el plan</h3><p className="muted">Tienes un mes de prueba y luego renuevas una vez al ano.</p></div>
        </div>
      </section>
      <MarketingPreview />
    </main>
  );
}
