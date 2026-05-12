import { LegalDocument } from "@/components/legal-document";

export const metadata = {
  title: "Política de pagos | Klicor",
  description: "Reglas de pagos, renovaciones, precios de lanzamiento, vencimientos y no reembolsos de Klicor.",
};

const sections = [
  {
    title: "1. Alcance",
    body: [
      "Esta Política de pagos regula la contratación, activación, renovación, vencimiento, suspensión y condiciones comerciales de los planes de Klicor.",
      "Al pagar o activar un plan, el usuario acepta esta política junto con los Términos y condiciones, la Política de privacidad y la Política de uso permitido.",
    ],
  },
  {
    title: "2. Precios de lanzamiento y cambios futuros",
    body: [
      "Los precios actuales de Klicor pueden ser precios de lanzamiento, validación comercial o promoción temporal.",
      "Klicor podrá modificar precios, límites, funcionalidades, características, planes y condiciones comerciales en cualquier momento. Los cambios aplicarán para nuevas contrataciones o desde la siguiente renovación del usuario.",
      "Un precio publicado, promocional o de lanzamiento no garantiza que se mantenga indefinidamente para renovaciones futuras.",
    ],
  },
  {
    title: "3. Planes y activación",
    body: [
      "El acceso a funcionalidades depende del plan activo, del estado de la cuenta y de los límites vigentes. Algunos planes pueden incluir solo link público y QR, mientras otros pueden habilitar comercio, agenda, tienda, menú, catálogo o módulos adicionales.",
      "La activación del plan ocurre cuando el pago es confirmado por la pasarela correspondiente o validado administrativamente por Klicor.",
    ],
  },
  {
    title: "4. Renovaciones",
    body: [
      "Los planes de Klicor son principalmente anuales. La renovación puede ser manual o automática según el método de pago, la pasarela disponible y la configuración vigente.",
      "Si el usuario no renueva a tiempo, Klicor puede limitar edición, pausar módulos, ocultar el comercio o la agenda, suspender la página pública o restringir el acceso hasta que el pago sea regularizado.",
    ],
  },
  {
    title: "5. Cambios de plan",
    body: [
      "Cuando un usuario cambia de plan, Klicor puede aplicar reglas proporcionales, créditos comerciales o cobros desde la fecha del cambio según la política vigente.",
      "Para pasar de Comercial a Plus, Klicor puede cobrar el año de Plus desde la fecha del cambio y descontar el valor proporcional no usado del plan Comercial, si esa regla está disponible al momento de la actualización.",
    ],
  },
  {
    title: "6. No reembolsos",
    body: [
      "Klicor es un servicio digital con activación inmediata. Salvo obligación legal aplicable o decisión expresa de Klicor, los pagos realizados no son reembolsables.",
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
      "Si un pago vence, es rechazado, revertido, desconocido, no confirmado o presenta señales de fraude, Klicor puede suspender, limitar o cancelar el acceso.",
      "La suspensión puede afectar el link público, QR, tienda, menú, catálogo, agenda, Dorika, métodos de pago visibles o cualquier módulo asociado.",
    ],
  },
  {
    title: "9. Promociones",
    body: [
      "Klicor puede ofrecer descuentos, cortesías, extensiones, pruebas o promociones temporales. Estas condiciones pueden terminar, cambiar o no renovarse a discreción de Klicor.",
      "Las promociones no son acumulables salvo que se indique expresamente.",
    ],
  },
  {
    title: "10. Contacto",
    body: [
      "Para preguntas sobre pagos, renovaciones o activaciones, puedes escribir a donjhonnathan@gmail.com. Última actualización: 12 de mayo de 2026.",
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
        { href: "/uso-permitido", label: "Uso permitido" },
      ]}
    />
  );
}
