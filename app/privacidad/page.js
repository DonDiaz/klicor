import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export const metadata = {
  title: "Politica de privacidad | Linka",
};

export default function PrivacyPage() {
  return (
    <main className="shell page-shell">
      <div className="stack" style={{ gap: "1.5rem" }}>
        <BrandLogo />
        <div className="card" style={{ padding: "1.5rem", display: "grid", gap: "1rem" }}>
          <h1 className="section-title" style={{ fontSize: "2rem" }}>Politica de privacidad</h1>
          <p className="section-copy">
            Linka recopila los datos necesarios para crear tu perfil, administrar tu suscripcion y operar tu pagina publica de enlaces.
          </p>
          <p className="section-copy">
            La informacion del usuario se utiliza para autenticacion, funcionamiento del producto, soporte y comunicaciones esenciales del servicio.
          </p>
          <p className="section-copy">
            Esta politica es una base inicial y puede actualizarse cuando se publique la version legal definitiva del producto.
          </p>
          <div className="actions">
            <Link className="btn btn-secondary" href="/">Volver al inicio</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
