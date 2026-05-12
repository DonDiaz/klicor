import { LegalDocument } from "@/components/legal-document";

export const metadata = {
  title: "Política de uso permitido | Klicor",
  description: "Reglas de uso permitido y prohibido para cuentas, QR, links, comercio, agenda y Dorika.",
};

const sections = [
  {
    title: "1. Alcance",
    body: [
      "Esta Política de uso permitido define conductas permitidas y prohibidas dentro de Klicor, sus páginas públicas, QR, links, módulos de comercio, agenda, catálogos, métodos de pago visibles y Dorika.",
      "El usuario debe usar Klicor de forma lícita, segura, honesta y compatible con la confianza de clientes finales, consumidores y otros negocios.",
    ],
  },
  {
    title: "2. Fraude, estafas y suplantación",
    body: [
      "Está prohibido usar Klicor para fraude, estafas, captación engañosa, pirámides, falsas promociones, suplantación de personas o negocios, simulación de marcas, engaño sobre precios, disponibilidad o identidad del proveedor.",
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
    title: "7. Dorika y visibilidad pública",
    body: [
      "Dorika puede requerir estándares adicionales de calidad, claridad, ubicación, imágenes, categorías o confiabilidad. Klicor puede ocultar, moderar o pausar perfiles que no cumplan esos estándares o que representen riesgo.",
      "La inclusión en Dorika no garantiza tráfico, ranking, ventas, reservas ni permanencia indefinida.",
    ],
  },
  {
    title: "8. Medidas frente a incumplimientos",
    body: [
      "Klicor puede advertir, ocultar contenido, desactivar links, pausar QR, suspender módulos, limitar el panel, bloquear cuentas, eliminar perfiles o reportar conductas cuando exista incumplimiento o riesgo razonable.",
      "Estas medidas pueden aplicarse sin aviso previo cuando sea necesario para proteger usuarios, clientes finales, infraestructura, terceros o cumplimiento legal.",
    ],
  },
  {
    title: "9. Reportes",
    body: [
      "Para reportar abuso, fraude, suplantación, links maliciosos o contenido ilegal en Klicor, escribe a donjhonnathan@gmail.com incluyendo el enlace, evidencia y descripción del caso.",
      "Última actualización: 12 de mayo de 2026.",
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
        { href: "/politica-de-pagos", label: "Política de pagos" },
      ]}
    />
  );
}
