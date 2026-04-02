import Link from "next/link";
import {
  ArrowLeftRight,
  ArrowUpRight,
  CheckCircle2,
  Download,
  Palette,
  Printer,
  ScanLine,
} from "lucide-react";
import { QR_COMPARISON_URL } from "@/lib/qr-comparison";

const qrVariants = [
  {
    id: "classic",
    label: "QR actual",
    title: "Generación actual con logo centrado",
    description:
      "Mantiene la base cuadrada que ya usamos hoy, con la marca compuesta encima.",
  },
  {
    id: "styled",
    label: "QR estilizado",
    title: "Candidato nuevo con módulos redondeados",
    description:
      "Busca acercarse a un QR de marca, con centro mejor integrado y ojos visualmente más trabajados.",
  },
];

const evaluationChecklist = [
  {
    icon: Palette,
    title: "Estética",
    text: "Revisa cuál se siente más integrado a la marca y menos como logo sobrepuesto.",
  },
  {
    icon: ScanLine,
    title: "Escaneo en celular",
    text: "Prueba con cámara normal, WhatsApp y lector QR para confirmar rapidez y tolerancia.",
  },
  {
    icon: Printer,
    title: "Impresión",
    text: "Descarga ambos PNG y compáralos al tamaño real de tarjeta, sticker o vitrina.",
  },
];

export default function CompareQrPage() {
  return (
    <>
      <div className="compare-banner">
        <div className="shell compare-banner-inner">
          <div className="compare-banner-copy">
            <ArrowLeftRight size={16} />
            <span>Comparación A/B del QR de Klicor antes de reemplazar la generación oficial.</span>
          </div>
          <div className="compare-banner-actions">
            <Link href="/">Volver al home</Link>
            <a href="#comparacion-qr">
              Ir a la comparación <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
      </div>

      <main className="landing-root">
        <section id="comparacion-qr" className="landing-section">
          <div className="shell compare-qr-shell">
            <div className="compare-qr-intro">
              <span className="pill">Prueba de QR</span>
              <h1 className="landing-section-title compare-qr-title">
                Dos versiones del mismo QR para decidir si vale la pena cambiar el generador.
              </h1>
              <p className="section-copy compare-qr-copy">
                Ambos usan el mismo logo y la misma URL de prueba. La diferencia está en el estilo
                visual del QR y en qué tan integrado se siente el centro de marca.
              </p>
            </div>

            <div className="compare-qr-target">
              <strong>Dato usado en ambas versiones</strong>
              <span>{QR_COMPARISON_URL}</span>
            </div>

            <div className="compare-qr-grid">
              {qrVariants.map((variant) => (
                <article key={variant.id} className="compare-qr-card">
                  <div className="compare-qr-card-head">
                    <span className="pill compare-qr-variant-pill">{variant.label}</span>
                    <h2>{variant.title}</h2>
                    <p>{variant.description}</p>
                  </div>

                  <div className="compare-qr-image-frame">
                    <img
                      className="compare-qr-image"
                      src={`/api/qr/compare?style=${variant.id}`}
                      alt={`${variant.title} generado con la misma URL de prueba`}
                    />
                  </div>

                  <div className="compare-qr-actions">
                    <a
                      className="btn btn-primary"
                      href={`/api/qr/compare?style=${variant.id}&download=1`}
                    >
                      Descargar PNG <Download size={16} />
                    </a>
                    <a
                      className="btn btn-secondary"
                      href={`/api/qr/compare?style=${variant.id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ver imagen sola <ArrowUpRight size={16} />
                    </a>
                  </div>
                </article>
              ))}
            </div>

            <div className="compare-qr-checklist">
              {evaluationChecklist.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className="compare-qr-check-card">
                    <div className="compare-qr-check-head">
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

            <div className="compare-qr-notes">
              <div className="compare-qr-note">
                <CheckCircle2 size={18} />
                <div>
                  <strong>Esta prueba no reemplaza aún el QR estable.</strong>
                  <span>
                    La generación oficial del perfil sigue intacta hasta que confirmemos cuál opción
                    se ve mejor y sigue escaneando bien.
                  </span>
                </div>
              </div>
              <div className="compare-qr-note">
                <CheckCircle2 size={18} />
                <div>
                  <strong>Lo ideal es probar ambas versiones en celular y también impresas.</strong>
                  <span>
                    Si el estilizado gana en estética pero pierde velocidad de escaneo, no conviene
                    reemplazar el actual todavía.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
