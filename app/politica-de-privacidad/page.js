import { LegalDocument } from "@/components/legal-document";

export const metadata = {
  title: "Política de privacidad | Klicor",
  description: "Política de privacidad y tratamiento de datos personales de Klicor.",
};

const UPDATED_AT = "22 de mayo de 2026";
const CONTACT_EMAIL = "donjhonnathan@gmail.com";

const sections = [
  {
    title: "1. Responsable del tratamiento",
    body: [
      `Klicor, operado por BACKFRONT, es responsable del tratamiento de los datos personales recopilados mediante la plataforma. Para solicitudes relacionadas con privacidad o tratamiento de datos puedes escribir a ${CONTACT_EMAIL}.`,
    ],
  },
  {
    title: "2. Información recopilada",
    body: [
      "Klicor podrá recopilar nombres, teléfonos, correos electrónicos, información de reservas, datos de negocio, información de contacto, registros técnicos, direcciones IP y datos de navegación.",
      "También podrá tratar información operativa del negocio, como enlaces, horarios, productos, servicios, precios, imágenes, métodos de pago visibles, configuración de agenda, citas, personal, preferencias de diseño, QR, actividad básica del panel y métricas de uso.",
    ],
  },
  {
    title: "3. Finalidad del tratamiento",
    body: [
      "Los datos podrán utilizarse para gestionar cuentas, reservas y solicitudes, facilitar comunicación entre usuarios y negocios, operar funcionalidades de la plataforma, brindar soporte, mejorar estabilidad y seguridad, prevenir fraude y cumplir obligaciones legales.",
      "Klicor podrá conservar evidencia técnica de aceptaciones legales, pagos, actividad de seguridad, intentos de abuso, auditorías y eventos necesarios para defensa legal o estabilidad del servicio.",
    ],
  },
  {
    title: "4. Compartición de información",
    body: [
      "La información enviada mediante formularios de agenda, contacto o reservas será compartida con el negocio correspondiente para gestionar la solicitud realizada por el usuario.",
      "El negocio es responsable del tratamiento y uso adecuado de la información recibida. Klicor no vende datos personales a terceros.",
    ],
  },
  {
    title: "5. Proveedores y servicios externos",
    body: [
      "Klicor puede apoyarse en proveedores de autenticación, hosting, base de datos, almacenamiento, correo transaccional, analítica técnica, pagos, mapas, seguridad y servicios relacionados.",
      "Los pagos pueden ser procesados por pasarelas externas como Mercado Pago. Klicor no almacena datos completos de tarjetas ni credenciales financieras sensibles.",
    ],
  },
  {
    title: "6. Seguridad",
    body: [
      "Klicor implementa medidas razonables de seguridad técnicas y organizativas para proteger la información almacenada.",
      "Sin embargo, ningún sistema puede garantizar seguridad absoluta. El usuario y cada negocio deben mantener buenas prácticas de acceso, autenticación, permisos y manejo de información.",
    ],
  },
  {
    title: "7. Conservación de datos",
    body: [
      "Klicor podrá conservar información mientras exista relación activa, sea necesaria para operación, cumplimiento legal, seguridad, soporte, prevención de fraude o defensa ante reclamaciones.",
      "Algunas copias, registros de pago, auditoría, seguridad o cumplimiento pueden conservarse cuando exista una obligación o interés legítimo aplicable.",
    ],
  },
  {
    title: "8. Derechos del titular",
    body: [
      "El usuario podrá solicitar acceso, actualización, corrección, eliminación o revocatoria de autorización mediante los canales oficiales de contacto.",
      `Para ejercer estos derechos, escribe a ${CONTACT_EMAIL} indicando tu nombre, correo asociado, solicitud concreta y datos necesarios para verificar tu identidad.`,
    ],
  },
  {
    title: "9. Uso indebido por terceros",
    body: [
      "Klicor no será responsable por el uso indebido que un negocio haga de la información recibida fuera del entorno controlado de la plataforma.",
      "Cada negocio es responsable de cumplir las normas aplicables sobre privacidad y protección de datos frente a sus clientes, usuarios finales y terceros.",
    ],
  },
  {
    title: "10. Cookies y tecnologías similares",
    body: [
      "Klicor podrá utilizar cookies, almacenamiento local o tecnologías similares para autenticación, preferencias, seguridad, estadísticas y mejora de experiencia.",
      "Si en el futuro se incorporan cookies no esenciales de publicidad, medición avanzada o seguimiento de terceros, Klicor deberá informarlo y habilitar los mecanismos de consentimiento que correspondan.",
    ],
  },
  {
    title: "11. Modificaciones",
    body: [
      `Klicor podrá modificar esta política en cualquier momento para adaptarla a cambios legales, técnicos u operativos. Última actualización: ${UPDATED_AT}.`,
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      badge="Privacidad"
      title="Política de privacidad"
      intro="Tratamiento de datos personales en Klicor, sus páginas públicas, QR, módulos de comercio, agenda, pagos visibles y experiencias relacionadas como Dorika."
      sections={sections}
      actions={[
        { href: "/terminos-y-condiciones", label: "Términos y condiciones" },
        { href: "/habeas-data", label: "Habeas Data" },
        { href: "/politica-de-pagos", label: "Política de pagos" },
        { href: "/uso-permitido", label: "Uso permitido" },
      ]}
    />
  );
}
