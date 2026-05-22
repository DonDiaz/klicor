import { LegalDocument } from "@/components/legal-document";

export const metadata = {
  title: "Política Habeas Data | Klicor",
  description: "Política Habeas Data de Klicor conforme a la normativa colombiana de protección de datos personales.",
};

const UPDATED_AT = "22 de mayo de 2026";
const CONTACT_EMAIL = "donjhonnathan@gmail.com";

const sections = [
  {
    title: "1. Marco legal",
    body: [
      "Esta política se desarrolla conforme a la Ley 1581 de 2012, el Decreto 1074 de 2015 y demás normas aplicables sobre protección de datos personales en Colombia.",
    ],
  },
  {
    title: "2. Derechos del titular",
    body: [
      "El titular de los datos podrá conocer, actualizar, rectificar, solicitar eliminación, revocar autorización y presentar consultas o reclamos sobre el tratamiento de sus datos personales.",
    ],
  },
  {
    title: "3. Finalidad del tratamiento",
    body: [
      "Los datos serán utilizados para operación de la plataforma, gestión de cuentas, reservas, contacto, soporte, seguridad, prevención de fraude y funcionamiento técnico de Klicor.",
    ],
  },
  {
    title: "4. Transferencia de información",
    body: [
      "Los datos podrán ser compartidos con el negocio correspondiente cuando el usuario realice reservas, envíe formularios o solicite atención mediante la plataforma.",
      "El negocio que recibe la información debe usarla únicamente para gestionar la solicitud realizada y cumplir sus obligaciones legales de protección de datos.",
    ],
  },
  {
    title: "5. Responsable y encargado",
    body: [
      "Klicor actúa como responsable y/o encargado del tratamiento según corresponda técnicamente al flujo de información gestionado por la plataforma.",
      "Cada negocio registrado puede actuar como responsable del tratamiento respecto de los datos que recibe y usa fuera del entorno controlado de Klicor.",
    ],
  },
  {
    title: "6. Consultas y reclamos",
    body: [
      `Las solicitudes relacionadas con protección de datos podrán enviarse a ${CONTACT_EMAIL}. La solicitud debe incluir nombre del titular, correo de contacto, descripción clara de la petición y datos necesarios para verificar identidad.`,
      `Última actualización: ${UPDATED_AT}.`,
    ],
  },
];

export default function HabeasDataPage() {
  return (
    <LegalDocument
      badge="Habeas Data"
      title="Política Habeas Data"
      intro="Derechos del titular y reglas principales para consultas, reclamos y tratamiento de datos personales en Klicor."
      sections={sections}
      actions={[
        { href: "/terminos-y-condiciones", label: "Términos y condiciones" },
        { href: "/politica-de-privacidad", label: "Política de privacidad" },
        { href: "/politica-de-pagos", label: "Política de pagos" },
        { href: "/uso-permitido", label: "Uso permitido" },
      ]}
    />
  );
}
