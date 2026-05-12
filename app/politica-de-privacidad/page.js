import { LegalDocument } from "@/components/legal-document";

export const metadata = {
  title: "Política de privacidad | Klicor",
  description: "Política de privacidad y tratamiento de datos personales de Klicor.",
};

const sections = [
  {
    title: "1. Alcance",
    body: [
      "Esta política explica cómo Klicor trata datos personales cuando una persona crea una cuenta, administra un negocio, usa el panel, paga un plan, publica un link, agenda una cita o interactúa con páginas públicas creadas en la plataforma.",
      "Klicor trata datos personales conforme a las reglas aplicables en Colombia, incluyendo la Ley 1581 de 2012 y normas relacionadas sobre protección de datos personales.",
    ],
  },
  {
    title: "2. Datos que recopilamos",
    body: [
      "Podemos tratar datos de identificación y contacto como nombre, correo electrónico, teléfono, foto, negocio, ciudad, datos de facturación, métodos de recuperación, información de autenticación y datos necesarios para administrar la cuenta.",
      "También podemos tratar información operativa del negocio, como enlaces, horarios, productos, servicios, precios, imágenes, métodos de pago visibles, configuración de agenda, citas, personal, preferencias de diseño, QR, actividad básica del panel y métricas de uso del link.",
      "En funciones de agenda, clientes finales pueden entregar datos de contacto y detalles de reserva. El negocio que recibe la cita debe usar esa información solo para gestionar su relación con el cliente y cumplir sus obligaciones.",
    ],
  },
  {
    title: "3. Finalidades",
    body: [
      "Usamos los datos para crear y administrar cuentas, autenticar usuarios, operar el link público, mostrar productos o servicios, gestionar agenda, generar QR, procesar pagos, enviar comunicaciones esenciales, brindar soporte, prevenir abuso, mejorar seguridad y cumplir obligaciones legales o contractuales.",
      "También podemos usar datos técnicos y métricas agregadas para diagnosticar fallas, mejorar rendimiento, entender uso de funciones, priorizar mejoras y proteger la estabilidad de Klicor y Dorika.",
    ],
  },
  {
    title: "4. Autorización y responsabilidad del negocio",
    body: [
      "Al registrarte, aceptar estos documentos, usar la plataforma o entregar información voluntariamente, autorizas el tratamiento de tus datos para las finalidades descritas.",
      "Cuando un negocio carga datos de terceros, publica información de clientes, recibe citas o administra datos de consumidores finales, debe contar con la autorización o base legal correspondiente.",
    ],
  },
  {
    title: "5. Información pública",
    body: [
      "La información que el usuario decide publicar en Klicor, como nombre del negocio, logo, enlaces, productos, servicios, precios, horarios, redes, WhatsApp, ubicación o métodos de pago visibles, puede ser consultada por cualquier persona con acceso al link público, QR, catálogo, menú, tienda, agenda o Dorika.",
      "El usuario debe revisar cuidadosamente que la información publicada sea correcta, autorizada y adecuada para mostrarse públicamente.",
    ],
  },
  {
    title: "6. Terceros y proveedores tecnológicos",
    body: [
      "Klicor puede apoyarse en proveedores de autenticación, hosting, base de datos, almacenamiento, correo transaccional, analítica técnica, pagos y servicios relacionados, incluyendo tecnologías como Firebase, proveedores de hosting, pasarelas de pago y servicios de correo.",
      "Los pagos pueden ser procesados por pasarelas externas como Mercado Pago. Klicor no almacena datos completos de tarjetas ni credenciales financieras sensibles.",
    ],
  },
  {
    title: "7. Cookies y almacenamiento local",
    body: [
      "Klicor puede usar cookies técnicas, almacenamiento local o tecnologías similares para mantener sesiones, recordar preferencias, operar autenticación, mejorar seguridad y permitir funciones necesarias de la plataforma.",
      "Si en el futuro se incorporan cookies no esenciales de publicidad, medición avanzada o seguimiento de terceros, Klicor deberá informarlo y habilitar los mecanismos de consentimiento que correspondan.",
    ],
  },
  {
    title: "8. Conservación, seguridad y eliminación",
    body: [
      "Conservamos los datos mientras la cuenta esté activa, mientras sean necesarios para prestar el servicio, atender soporte, cumplir obligaciones legales, resolver disputas, prevenir fraude o mantener registros administrativos razonables.",
      "El usuario puede solicitar eliminación o actualización de su cuenta escribiendo a donjhonnathan@gmail.com. Algunas copias, registros de pago, auditoría, seguridad o cumplimiento pueden conservarse cuando exista una obligación o interés legítimo aplicable.",
    ],
  },
  {
    title: "9. Derechos del titular",
    body: [
      "Como titular puedes solicitar acceso, actualización, rectificación, prueba de autorización, información sobre el uso de tus datos, revocatoria de autorización o supresión cuando proceda legalmente.",
      "Para ejercer estos derechos, escribe a donjhonnathan@gmail.com indicando tu nombre, correo asociado a la cuenta, solicitud concreta y datos necesarios para verificar tu identidad.",
    ],
  },
  {
    title: "10. Cambios",
    body: [
      "Esta política puede actualizarse para reflejar cambios legales, técnicos u operativos. La versión vigente será la publicada en esta página. Última actualización: 12 de mayo de 2026.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      badge="Privacidad"
      title="Política de privacidad"
      intro="Tratamiento de datos personales en Klicor, sus páginas públicas, QR, módulos de comercio, agenda, pagos visibles y futuras experiencias como Dorika."
      sections={sections}
      actions={[
        { href: "/terminos-y-condiciones", label: "Términos y condiciones" },
        { href: "/politica-de-pagos", label: "Política de pagos" },
        { href: "/uso-permitido", label: "Uso permitido" },
      ]}
    />
  );
}
