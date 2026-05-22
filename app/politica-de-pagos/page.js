import { LegalDocument } from "@/components/legal-document";

export const metadata = {
  title: "Política de pagos | Klicor",
  description: "Reglas de pagos, renovaciones, precios de lanzamiento, vencimientos y no reembolsos de Klicor.",
};

const UPDATED_AT = "22 de mayo de 2026";
const CONTACT_EMAIL = "donjhonnathan@gmail.com";

const sections = [
  {
    title: "1. Activación",
    body: [
      "Los servicios se activan tras confirmación del pago correspondiente por la pasarela disponible o validación administrativa de Klicor.",
      "El acceso a funcionalidades depende del plan activo, estado de la cuenta, límites vigentes y configuración comercial definida por Klicor.",
    ],
  },
  {
    title: "2. Renovaciones",
    body: [
      "Las renovaciones podrán realizarse según la modalidad definida por Klicor, incluyendo periodicidad mensual, anual o condiciones comerciales especiales.",
      "Si el usuario no renueva a tiempo, Klicor puede limitar edición, pausar módulos, ocultar el comercio o la agenda, suspender la página pública o restringir el acceso hasta que el pago sea regularizado.",
    ],
  },
  {
    title: "3. Precios de lanzamiento",
    body: [
      "Algunos planes podrán corresponder a etapas promocionales o de lanzamiento.",
      "Klicor podrá modificar precios, límites, funcionalidades, características, planes y condiciones comerciales en futuras renovaciones, nuevas contrataciones o nuevas activaciones.",
      "Un precio publicado, promocional o de lanzamiento no garantiza que se mantenga indefinidamente para renovaciones futuras.",
    ],
  },
  {
    title: "4. Cambios de plan",
    body: [
      "Cuando un usuario cambia de plan, Klicor puede aplicar reglas proporcionales, créditos comerciales o cobros desde la fecha del cambio según la política vigente.",
      "Para subir de un plan activo a uno superior, Klicor puede cobrar el año del nuevo plan desde la fecha del cambio y descontar el valor proporcional no usado del plan anterior, si esa regla está disponible al momento de la actualización.",
    ],
  },
  {
    title: "5. Uso intensivo y planes empresariales",
    body: [
      "Los planes públicos cubren uso normal y razonable. Negocios con alto volumen de visitas, productos, consultas, pedidos por WhatsApp, carga operativa, almacenamiento o consumo técnico pueden requerir un plan empresarial, mensualidad de alto flujo o cotización personalizada.",
      "Klicor no cobra comisión automática por pedido. Los cargos de alto flujo, cuando apliquen, corresponden al uso intensivo de infraestructura, disponibilidad, soporte y capacidad operativa.",
    ],
  },
  {
    title: "6. No reembolsos",
    body: [
      "No se realizan devoluciones una vez activado el servicio, salvo obligación legal aplicable o decisión expresa de Klicor.",
      "No se realizan devoluciones por falta de uso, cambio de opinión, errores de configuración del usuario, resultados comerciales no alcanzados, falta de ventas, falta de reservas, interrupciones razonables del servicio o cancelación anticipada del usuario.",
    ],
  },
  {
    title: "7. Pasarelas y terceros de pago",
    body: [
      "Los pagos pueden procesarse mediante terceros como Mercado Pago u otros proveedores. Klicor no controla rechazos, bloqueos, comisiones, reversos, verificaciones, tiempos bancarios ni decisiones propias de esos terceros.",
      "El usuario debe revisar las condiciones de la pasarela o entidad financiera que utilice para pagar.",
    ],
  },
  {
    title: "8. Suspensión por mora o riesgo",
    body: [
      "La falta de pago podrá generar suspensión, limitación, ocultamiento de perfiles o cancelación del servicio.",
      "Si un pago es rechazado, revertido, desconocido, no confirmado o presenta señales de fraude, Klicor puede suspender, limitar o cancelar el acceso.",
    ],
  },
  {
    title: "9. Contacto",
    body: [
      `Para preguntas sobre pagos, renovaciones o activaciones, puedes escribir a ${CONTACT_EMAIL}. Última actualización: ${UPDATED_AT}.`,
    ],
  },
];

export default function PaymentsPolicyPage() {
  return (
    <LegalDocument
      badge="Pagos"
      title="Política de pagos"
      intro="Condiciones de precios, renovaciones, activación, vencimientos, cambios de plan y no reembolsos aplicables a Klicor."
      sections={sections}
      actions={[
        { href: "/terminos-y-condiciones", label: "Términos y condiciones" },
        { href: "/politica-de-privacidad", label: "Política de privacidad" },
        { href: "/habeas-data", label: "Habeas Data" },
        { href: "/uso-permitido", label: "Uso permitido" },
      ]}
    />
  );
}
