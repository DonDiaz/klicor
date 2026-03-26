import "server-only";
import { Resend } from "resend";
import { formatDate } from "@/lib/utils";

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

async function deliverEmail({ to, subject, html }) {
  const resend = getResend();
  if (!resend || !to) {
    return { skipped: true };
  }

  return resend.emails.send({
    from: process.env.EMAIL_FROM || "BioImpulso <hola@tudominio.com>",
    to,
    subject,
    html,
  });
}

export function sendWelcomeEmail(user) {
  return deliverEmail({
    to: user.email,
    subject: "Bienvenido a BioImpulso",
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h1>Tu perfil ya esta listo</h1><p>Hola ${user.businessName || user.email}, gracias por empezar tu prueba gratuita.</p><p>Ahora puedes completar tu landing, compartir tu enlace y descargar tu QR.</p></div>`,
  });
}

export function sendUpcomingExpiryEmail(user) {
  return deliverEmail({
    to: user.email,
    subject: "Tu plan esta por vencer",
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h1>Tu cuenta esta por vencer</h1><p>Recuerda renovar antes del ${formatDate(user.expiresAt || user.trialEndsAt)} para no perder edicion de tu perfil.</p></div>`,
  });
}

export function sendSuspensionEmail(user) {
  return deliverEmail({
    to: user.email,
    subject: "Tu cuenta fue suspendida temporalmente",
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h1>Cuenta suspendida</h1><p>Tu periodo de gracia termino y la landing se encuentra pausada hasta registrar el pago anual.</p><p>Ingresa al panel para renovar y reactivar tu pagina.</p></div>`,
  });
}
