import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export const metadata = {
  title: "Terminos y condiciones | Linka",
};

export default function TermsPage() {
  return (
    <main className="shell page-shell">
      <div className="stack" style={{ gap: "1.5rem" }}>
        <BrandLogo />
        <div className="card" style={{ padding: "1.5rem", display: "grid", gap: "1rem" }}>
          <h1 className="section-title" style={{ fontSize: "2rem" }}>Terminos y condiciones</h1>
          <p className="section-copy">
            Este documento sirve como base inicial de terminos para Linka mientras se define la version legal final.
          </p>
          <p className="section-copy">
            Al usar la plataforma, el usuario acepta cuidar sus credenciales, usar el servicio de forma licita y respetar las condiciones comerciales activas dentro de su cuenta.
          </p>
          <p className="section-copy">
            Linka puede actualizar estas condiciones para reflejar mejoras del producto, requisitos legales y cambios operativos del servicio.
          </p>
          <div className="actions">
            <Link className="btn btn-secondary" href="/">Volver al inicio</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
