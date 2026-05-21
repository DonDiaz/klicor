import { LegalDocument } from "@/components/legal-document";

export const metadata = {
  title: "Términos y condiciones | Klicor",
  description: "Condiciones de uso de Klicor, planes, módulos, pagos, responsabilidades y reglas de la plataforma.",
};

const sections = [
  {
    title: "1. Identificación del servicio",
    body: [
      "Klicor es un servicio digital operado en Colombia. Para asuntos relacionados con soporte, cuenta, pagos o estos documentos, puedes escribir a donjhonnathan@gmail.com.",
      "Al crear una cuenta, iniciar sesión, pagar un plan o usar Klicor, aceptas estos términos, la Política de privacidad, la Política de pagos y la Política de uso permitido.",
    ],
  },
  {
    title: "2. Qué es Klicor",
    body: [
      "Klicor es una plataforma tecnológica SaaS para presencia y operación digital de negocios. Permite crear páginas públicas, organizar enlaces, mostrar productos o servicios, publicar QR, recibir pedidos por WhatsApp y gestionar funciones de agenda o comercio según el plan activo.",
      "Klicor no es un marketplace, banco, pasarela de pagos, operador turístico, proveedor médico, transportador, restaurante, comercio, representante comercial ni intermediario responsable de las ventas, reservas o servicios ofrecidos por cada negocio.",
    ],
  },
  {
    title: "3. Servicios incluidos",
    body: [
      "Según el plan y la configuración del usuario, Klicor puede incluir link público, QR, tienda, menú, catálogo, agenda, enlaces externos, métodos de pago visibles, datos de contacto, personalización visual, página pública de negocio y funcionalidades relacionadas.",
      "Klicor también puede integrar o mostrar información pública en Dorika u otros espacios de descubrimiento, directorio o promoción que formen parte de la evolución del producto.",
    ],
  },
  {
    title: "4. Registro y cuentas",
    body: [
      "El usuario debe suministrar información veraz, actualizada y suficiente para operar su cuenta y su negocio. También debe mantener control sobre su correo, proveedores de autenticación, sesiones, dispositivos y credenciales.",
      "Klicor puede suspender, limitar o bloquear cuentas cuando detecte fraude, abuso, suplantación, riesgo de seguridad, uso indebido, falta de pago, información falsa o incumplimiento de estos documentos.",
    ],
  },
  {
    title: "5. Planes, precios y etapa de lanzamiento",
    body: [
      "Los precios, límites y funcionalidades actuales pueden corresponder a una etapa de lanzamiento, validación o evolución del producto.",
      "Klicor podrá modificar precios, límites, funcionalidades, características, planes y condiciones comerciales en cualquier momento. Los cambios aplicarán para nuevas contrataciones o desde la siguiente renovación del usuario.",
      "Los precios de lanzamiento, promociones o condiciones especiales pueden ser temporales y no obligan a Klicor a mantenerlos indefinidamente.",
      "Los planes públicos incluyen uso normal y razonable de la plataforma. Si una cuenta presenta alto volumen de visitas, productos, consultas, clics a WhatsApp, carga operativa, automatizaciones, consumo técnico o uso intensivo superior al promedio, Klicor podrá solicitar migración a un plan empresarial o de alto flujo con aviso previo.",
      "Klicor no cobra comisión automática por pedido. Los planes de alto flujo, cuando apliquen, corresponden al uso intensivo de infraestructura, disponibilidad, soporte y capacidad operativa, no a la confirmación de ventas entregadas por el negocio.",
    ],
  },
  {
    title: "6. Renovaciones y vencimiento",
    body: [
      "Los planes de Klicor se manejan principalmente de forma anual. La renovación puede ser manual o automática según el método de pago, la pasarela disponible y la configuración vigente.",
      "Si el plan vence, el pago no se confirma o la cuenta queda en mora, Klicor puede limitar la edición, ocultar parcial o totalmente módulos, suspender el link público, desactivar agenda/comercio o restringir funciones hasta que se regularice el acceso.",
    ],
  },
  {
    title: "7. No reembolsos",
    body: [
      "Klicor es un servicio digital con activación inmediata. Salvo obligación legal aplicable o decisión expresa de Klicor, los pagos realizados no son reembolsables.",
      "El usuario acepta que el acceso al servicio, la activación de módulos, la generación de QR, la publicación de páginas y el uso de herramientas digitales pueden iniciar inmediatamente después del pago o registro.",
    ],
  },
  {
    title: "8. Responsabilidad del negocio",
    body: [
      "Cada negocio es responsable por sus productos, servicios, precios, imágenes, disponibilidad, promociones, entregas, reservas, garantías, impuestos, facturación, permisos, atención al cliente y cumplimiento comercial frente a sus compradores o usuarios finales.",
      "Klicor no responde por errores del negocio, incumplimientos, cancelaciones, reclamos de consumidores, entregas, calidad de productos o servicios, ni por decisiones comerciales tomadas por el usuario.",
    ],
  },
  {
    title: "9. Links externos, WhatsApp y pagos visibles",
    body: [
      "Klicor puede permitir mostrar enlaces externos, WhatsApp, redes sociales, bancos, Nequi, Daviplata, llaves Bre-B, Mercado Pago u otros métodos de pago visibles. Klicor no controla ni responde por esas plataformas externas.",
      "Klicor no procesa pagos directamente dentro del link público salvo que una integración específica lo indique. Las transacciones, confirmaciones, errores, reversos o disputas de terceros se rigen por las condiciones de cada proveedor externo.",
    ],
  },
  {
    title: "10. Disponibilidad y evolución del producto",
    body: [
      "Klicor busca mantener el servicio disponible, pero puede presentar interrupciones por mantenimiento, actualizaciones, fallas técnicas, proveedores externos, cambios de infraestructura, fuerza mayor o eventos fuera de control razonable.",
      "Klicor puede agregar, eliminar, reorganizar o cambiar funcionalidades, módulos, límites, diseño, flujos, estructura comercial y experiencia de usuario para mejorar seguridad, rendimiento, cumplimiento legal o viabilidad del producto.",
    ],
  },
  {
    title: "11. Dorika",
    body: [
      "Dorika puede mostrar información pública de negocios, perfiles, productos, ubicaciones aproximadas, imágenes o enlaces configurados por el usuario. Publicar o habilitar información en Klicor puede permitir su uso en experiencias de descubrimiento o directorio.",
      "Dorika no garantiza visibilidad, ranking, tráfico, ventas, reservas ni resultados comerciales. Klicor puede ocultar, moderar, pausar o limitar perfiles cuando exista riesgo legal, técnico, reputacional, de privacidad o de calidad.",
    ],
  },
  {
    title: "12. Propiedad intelectual",
    body: [
      "Klicor, su marca, interfaz, código, diseño, estructura, textos del producto y elementos propios de la plataforma pertenecen a sus titulares o licenciantes.",
      "El contenido del negocio sigue siendo del negocio o de quien tenga sus derechos, pero el usuario autoriza a Klicor a alojarlo, procesarlo, publicarlo y mostrarlo en la medida necesaria para prestar el servicio.",
    ],
  },
  {
    title: "13. Limitación de responsabilidad",
    body: [
      "En la medida permitida por la ley, Klicor no será responsable por daños indirectos, lucro cesante, pérdida de ventas, pérdida de oportunidades, fallos de terceros, interrupciones de internet, decisiones de consumidores, pérdida de datos por causas externas o uso indebido de la cuenta.",
      "La responsabilidad máxima de Klicor frente al usuario se limita al valor efectivamente pagado por el período vigente del servicio afectado, salvo que la ley aplicable disponga algo distinto.",
    ],
  },
  {
    title: "14. Agenda y reservas",
    body: [
      "La funcionalidad de agenda y reservas permite a los usuarios finales solicitar citas, reservas o espacios con negocios registrados en Klicor.",
      "Klicor actúa exclusivamente como proveedor tecnológico de la plataforma. Klicor no presta directamente servicios médicos, estéticos, turísticos, profesionales, comerciales ni de atención al cliente ofrecidos por los negocios registrados.",
      "Cada negocio es independiente y responsable de la información publicada, la atención al cliente, la prestación de sus servicios, el cumplimiento de citas o reservas, sus horarios, precios, promociones, cancelaciones y cualquier relación comercial o contractual con el usuario final.",
    ],
  },
  {
    title: "15. Datos recopilados en agenda y reservas",
    body: [
      "Cuando un usuario realiza una solicitud, cita o reserva mediante Klicor, la plataforma podrá recopilar datos como nombre, número telefónico, correo electrónico, fecha y hora de reserva, observaciones o mensajes enviados por el usuario.",
      "Estos datos son almacenados técnicamente por Klicor para permitir el funcionamiento de la plataforma y la gestión de solicitudes.",
      "El usuario entiende y acepta que los datos enviados mediante formularios de agenda, reservas o contacto serán compartidos con el negocio correspondiente para gestionar la solicitud realizada.",
    ],
  },
  {
    title: "16. Responsabilidad del negocio sobre datos de agenda",
    body: [
      "El negocio que recibe información de agenda o reservas actúa bajo su propia responsabilidad respecto al uso, almacenamiento, tratamiento y protección de los datos personales recibidos.",
      "Klicor no controla ni supervisa el uso interno que cada negocio haga de la información recibida fuera de la plataforma.",
      "Cada negocio registrado es responsable de utilizar la información únicamente para fines relacionados con la atención del usuario, no compartir datos con terceros no autorizados, no usar la información para fines ilícitos, spam o actividades no autorizadas, y cumplir las normas de protección de datos aplicables en su país o jurisdicción.",
      "El mal uso de datos personales por parte de un negocio registrado será responsabilidad exclusiva de dicho negocio.",
    ],
  },
  {
    title: "17. Consentimiento del usuario final en agenda",
    body: [
      "Al enviar una solicitud, cita o reserva mediante Klicor, el usuario autoriza el tratamiento de sus datos personales para gestionar solicitudes, coordinar reservas o citas, permitir contacto entre el negocio y el usuario, y enviar confirmaciones o información relacionada con la solicitud realizada.",
      "Klicor podrá conservar evidencia técnica de la aceptación de estos términos y de la política de privacidad, incluyendo versión aceptada, fecha, origen, usuario autenticado y datos técnicos razonables para defensa legal, seguridad y auditoría.",
    ],
  },
  {
    title: "18. Limitación específica en agenda y reservas",
    body: [
      "Klicor no garantiza disponibilidad permanente de agendas, confirmación automática de reservas, cumplimiento de citas, calidad del servicio prestado por el negocio ni exactitud total de la información publicada por terceros.",
      "Klicor no será responsable por cancelaciones, incumplimientos, pérdidas económicas, conflictos comerciales o daños derivados de la relación entre el usuario y el negocio.",
    ],
  },
  {
    title: "19. Suspensión o bloqueo",
    body: [
      "Klicor podrá suspender o eliminar cuentas de negocios que hagan uso indebido de datos personales, incumplan estas condiciones, utilicen la plataforma para fraude, spam o actividades ilegales, o afecten la seguridad o integridad de la plataforma.",
    ],
  },
  {
    title: "20. Modificaciones y legislación aplicable",
    body: [
      "Klicor podrá modificar estas condiciones en cualquier momento para adaptarlas a cambios legales, técnicos o comerciales. El uso continuado de la plataforma implica aceptación de las modificaciones realizadas.",
      "Estos términos se rigen por las leyes de Colombia. Última actualización: 18 de mayo de 2026.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalDocument
      badge="Legal"
      title="Términos y condiciones"
      intro="Reglas principales para usar Klicor como plataforma SaaS de presencia, comercio, agenda, QR y operación digital para pequeños negocios."
      sections={sections}
      actions={[
        { href: "/politica-de-privacidad", label: "Política de privacidad" },
        { href: "/politica-de-pagos", label: "Política de pagos" },
        { href: "/uso-permitido", label: "Uso permitido" },
      ]}
    />
  );
}
