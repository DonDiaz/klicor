import { LegalDocument } from "@/components/legal-document";

export const metadata = {
  title: "Términos y condiciones | Klicor",
  description: "Condiciones de uso de Klicor, planes, módulos, pagos, responsabilidades y reglas de la plataforma.",
};

const UPDATED_AT = "22 de mayo de 2026";
const CONTACT_EMAIL = "donjhonnathan@gmail.com";

const sections = [
  {
    title: "1. Identificación de la plataforma",
    body: [
      `Klicor es una plataforma tecnológica operada por BACKFRONT, orientada a facilitar la presencia y operación digital de negocios mediante herramientas en línea. Sitio web: https://klicor.com. Correo de contacto: ${CONTACT_EMAIL}.`,
      "Al registrarse, acceder, utilizar la plataforma o realizar un pago, el usuario declara haber leído, entendido y aceptado estos términos y las políticas relacionadas. La aceptación electrónica constituye un acuerdo válido entre el usuario y Klicor.",
    ],
  },
  {
    title: "2. Naturaleza del servicio",
    body: [
      "Klicor es una plataforma SaaS diseñada para permitir que negocios gestionen presencia digital, enlaces públicos, códigos QR, tiendas, menús, catálogos, agendas, reservas, productos, métodos de contacto y herramientas relacionadas.",
      "Klicor actúa exclusivamente como proveedor tecnológico de infraestructura digital. No es entidad financiera, pasarela de pago, operador logístico, operador turístico, agencia de viajes ni responsable directo de los productos o servicios ofrecidos por los negocios registrados.",
    ],
  },
  {
    title: "3. Registro y cuentas",
    body: [
      "El usuario se compromete a proporcionar información veraz, mantenerla actualizada, proteger sus credenciales y asumir responsabilidad por las actividades realizadas desde su cuenta.",
      "Klicor podrá suspender o cancelar cuentas que incumplan estos términos, representen riesgos técnicos o legales, hagan uso indebido de la plataforma, presenten información falsa o afecten la seguridad del servicio.",
    ],
  },
  {
    title: "4. Planes, precios y condiciones comerciales",
    body: [
      "Klicor podrá ofrecer planes gratuitos, planes promocionales, precios de lanzamiento, suscripciones o condiciones comerciales especiales. Los valores actuales podrán corresponder a una etapa inicial o promocional del producto.",
      "Klicor podrá modificar precios, límites, funcionalidades, almacenamiento, módulos, capacidades o condiciones comerciales en cualquier momento. Salvo disposición diferente, los cambios aplicarán desde nuevas contrataciones, nuevas activaciones o la siguiente renovación del usuario.",
      "La permanencia de un precio, beneficio o funcionalidad no constituye obligación permanente de mantenerlo indefinidamente.",
    ],
  },
  {
    title: "5. Uso intensivo y alto flujo",
    body: [
      "Los planes estándar de Klicor están orientados inicialmente a pequeños y medianos negocios con niveles razonables de operación.",
      "Algunos negocios podrán requerir alto tráfico, almacenamiento elevado, grandes cantidades de productos, sincronización intensiva, reservas masivas, automatizaciones, múltiples sucursales, integraciones especiales o consumo técnico superior al promedio.",
      "En dichos casos, Klicor podrá aplicar límites razonables, solicitar migración a planes especializados, negociar condiciones empresariales o establecer cobros adicionales relacionados con infraestructura, almacenamiento, procesamiento, tráfico o consumo operativo.",
      "El uso intensivo no autorizado podrá requerir ajuste de plan, suspensión preventiva o revisión comercial antes de continuar prestando el servicio.",
    ],
  },
  {
    title: "6. Renovaciones, vencimientos y no reembolsos",
    body: [
      "Las suscripciones podrán tener periodicidad mensual, anual o la definida comercialmente por Klicor.",
      "El vencimiento o falta de pago podrá ocasionar limitación de funcionalidades, suspensión de módulos, ocultamiento parcial de perfiles públicos o cancelación del acceso.",
      "Debido a la naturaleza digital del servicio y su activación inmediata, Klicor no realiza devoluciones ni reembolsos una vez activado el servicio, salvo obligación legal aplicable.",
    ],
  },
  {
    title: "7. Uso permitido",
    body: [
      "El usuario se compromete a no utilizar la plataforma para fraude, phishing, spam, malware, suplantación, actividades ilegales, QR maliciosos, distribución de contenido ilícito o actividades que afecten la estabilidad de la plataforma.",
      "Klicor podrá suspender inmediatamente cuentas que representen riesgo técnico, legal o reputacional.",
    ],
  },
  {
    title: "8. Responsabilidad del negocio",
    body: [
      "Cada negocio registrado es responsable exclusivamente de sus productos, servicios, precios, promociones, reservas, horarios, publicaciones, entregas, atención al cliente, facturación, permisos y cumplimiento comercial.",
      "Klicor no garantiza ventas, posicionamiento, tráfico, reservas ni resultados comerciales.",
    ],
  },
  {
    title: "9. Agenda, reservas y datos personales",
    body: [
      "Klicor podrá almacenar técnicamente información enviada mediante formularios de agenda, reservas, contacto, solicitudes o citas. La información podrá incluir nombres, teléfonos, correos, fechas, horarios y mensajes enviados por el usuario.",
      "El usuario entiende y acepta que dicha información será compartida con el negocio correspondiente para gestionar la solicitud realizada.",
      "Klicor actúa como plataforma tecnológica de almacenamiento y transmisión de información. Cada negocio registrado es responsable del uso adecuado, tratamiento y protección de los datos personales recibidos mediante la plataforma.",
      "Klicor no será responsable por el uso indebido que un negocio haga de la información recibida fuera del entorno controlado de la plataforma.",
    ],
  },
  {
    title: "10. Servicios externos",
    body: [
      "Klicor podrá integrarse o enlazar servicios de terceros como WhatsApp, redes sociales, pasarelas de pago, bancos, servicios de mapas, plataformas externas o herramientas de terceros.",
      "Klicor no controla ni garantiza la disponibilidad, decisiones, tiempos, costos, errores, reversos o funcionamiento de dichos servicios externos.",
    ],
  },
  {
    title: "11. Disponibilidad y evolución del producto",
    body: [
      "Klicor podrá realizar mantenimientos, actualizaciones, mejoras, cambios técnicos, migraciones o modificaciones de infraestructura. La plataforma no garantiza disponibilidad continua e ininterrumpida.",
      "Klicor podrá agregar, modificar, reorganizar, limitar, eliminar, reemplazar o rediseñar funcionalidades, módulos o características de la plataforma en cualquier momento. La evolución técnica y comercial del producto hace parte natural del servicio.",
    ],
  },
  {
    title: "12. Dorika y plataformas relacionadas",
    body: [
      "Klicor podrá integrar o sincronizar información pública con plataformas relacionadas como Dorika.",
      "La aparición de negocios o productos en dichas plataformas no garantiza visibilidad, posicionamiento, tráfico, reservas, ventas ni resultados comerciales.",
      "Klicor podrá moderar, limitar, ocultar o eliminar perfiles públicos cuando lo considere necesario por razones técnicas, legales, reputacionales, de seguridad o de calidad.",
    ],
  },
  {
    title: "13. Limitación de responsabilidad",
    body: [
      "Klicor no será responsable por pérdidas económicas, lucro cesante, pérdida de datos, interrupciones, errores de terceros, fallas externas, daños indirectos ni conflictos entre negocios y usuarios finales.",
      "En la medida permitida por la ley, la responsabilidad máxima de Klicor frente al usuario se limita al valor efectivamente pagado por el período vigente del servicio afectado, salvo que la ley aplicable disponga algo distinto.",
    ],
  },
  {
    title: "14. Propiedad intelectual",
    body: [
      "Todos los derechos sobre software, diseño, marca, estructura, código, contenido propio y elementos de Klicor pertenecen a Klicor o sus respectivos titulares.",
      "El usuario conserva derechos sobre el contenido propio publicado en la plataforma, pero autoriza a Klicor a alojarlo, procesarlo, publicarlo y mostrarlo en la medida necesaria para prestar el servicio.",
    ],
  },
  {
    title: "15. Modificaciones y legislación aplicable",
    body: [
      "Klicor podrá modificar estos términos en cualquier momento. El uso continuado de la plataforma implica aceptación de las modificaciones vigentes.",
      `Estos términos se rigen por las leyes de la República de Colombia. Última actualización: ${UPDATED_AT}.`,
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalDocument
      badge="Legal"
      title="Términos y condiciones"
      intro="Reglas principales para usar Klicor como plataforma SaaS de presencia, comercio, agenda, QR y operación digital para negocios."
      sections={sections}
      actions={[
        { href: "/politica-de-privacidad", label: "Política de privacidad" },
        { href: "/habeas-data", label: "Habeas Data" },
        { href: "/politica-de-pagos", label: "Política de pagos" },
        { href: "/uso-permitido", label: "Uso permitido" },
      ]}
    />
  );
}
