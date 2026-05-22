import { LegalDocument } from "@/components/legal-document";

export const metadata = {
  title: "Política de uso permitido | Klicor",
  description: "Reglas de uso permitido y prohibido para cuentas, QR, links, comercio, agenda y Dorika.",
};

const UPDATED_AT = "22 de mayo de 2026";
const CONTACT_EMAIL = "donjhonnathan@gmail.com";

const sections = [
  {
    title: "1. Alcance",
    body: [
      "Esta Política de uso permitido define conductas permitidas y prohibidas dentro de Klicor, sus páginas públicas, QR, links, módulos de comercio, agenda, catálogos, métodos de pago visibles y Dorika.",
      "El usuario debe usar Klicor de forma lícita, segura, honesta y compatible con la confianza de clientes finales, consumidores y otros negocios.",
    ],
  },
  {
    title: "2. Usos prohibidos",
    body: [
      "Está prohibido utilizar Klicor para fraude, phishing, spam, malware, QR maliciosos, contenido ilegal, estafas, suplantación, vulneración de derechos de terceros o actividades que afecten la seguridad o reputación de la plataforma.",
      "También está prohibido publicar datos bancarios, métodos de pago, QR o enlaces con intención de confundir, robar, desviar pagos o inducir a error a clientes finales.",
    ],
  },
  {
    title: "3. Spam, phishing y malware",
    body: [
      "No se permite usar Klicor para spam, phishing, malware, descargas maliciosas, enlaces engañosos, recolección indebida de credenciales, redirecciones abusivas o páginas destinadas a comprometer cuentas, dispositivos o datos.",
      "Klicor puede bloquear links externos, QR, perfiles o cuentas cuando exista sospecha razonable de riesgo técnico, fraude o afectación a terceros.",
    ],
  },
  {
    title: "4. Productos, servicios y contenido ilegal",
    body: [
      "No se permite publicar, vender, promover o facilitar productos, servicios o contenidos ilegales, peligrosos, no autorizados, falsificados, que infrinjan derechos de terceros o que requieran permisos que el negocio no tenga.",
      "Cada negocio debe verificar que puede ofrecer legalmente sus productos o servicios, incluyendo requisitos de salud, turismo, alimentos, medicamentos, servicios profesionales, impuestos, garantías o protección al consumidor cuando aplique.",
    ],
  },
  {
    title: "5. Abuso de plataforma",
    body: [
      "Está prohibido automatizar de forma abusiva, intentar vulnerar seguridad, saturar servicios, crear cuentas falsas, evadir límites, revender acceso sin autorización, interferir con otros usuarios o usar Klicor para actividades que afecten la estabilidad del producto.",
      "Tampoco se permite usar el servicio para copiar su funcionamiento, extraer datos masivamente, descompilar, hacer ingeniería inversa o construir servicios competidores mediante acceso no autorizado.",
    ],
  },
  {
    title: "6. Contenido sensible o dañino",
    body: [
      "Klicor puede limitar o retirar contenido violento, discriminatorio, sexualmente explotador, difamatorio, que promueva odio, acoso, amenazas, daño a terceros o cualquier contenido que genere riesgo legal, reputacional o de seguridad.",
      "Los perfiles públicos deben mantener información clara, verificable y coherente con el negocio que representan.",
    ],
  },
  {
    title: "7. Medidas frente a incumplimientos",
    body: [
      "Klicor podrá limitar, suspender, bloquear o eliminar cuentas sin previo aviso cuando exista riesgo técnico, legal o reputacional.",
      "Estas medidas pueden aplicarse para proteger usuarios, clientes finales, infraestructura, terceros o cumplimiento legal.",
    ],
  },
  {
    title: "8. Reportes",
    body: [
      `Para reportar abuso, fraude, suplantación, links maliciosos o contenido ilegal en Klicor, escribe a ${CONTACT_EMAIL} incluyendo el enlace, evidencia y descripción del caso.`,
      `Última actualización: ${UPDATED_AT}.`,
    ],
  },
];

export default function AcceptableUsePage() {
  return (
    <LegalDocument
      badge="Uso permitido"
      title="Política de uso permitido"
      intro="Reglas para prevenir fraude, spam, phishing, QR maliciosos, contenido ilegal, abuso de plataforma y usos riesgosos en Klicor y Dorika."
      sections={sections}
      actions={[
        { href: "/terminos-y-condiciones", label: "Términos y condiciones" },
        { href: "/politica-de-privacidad", label: "Política de privacidad" },
        { href: "/habeas-data", label: "Habeas Data" },
        { href: "/politica-de-pagos", label: "Política de pagos" },
      ]}
    />
  );
}
