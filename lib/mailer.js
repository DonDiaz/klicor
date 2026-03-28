import "server-only";
import { Resend } from "resend";
import { formatDate } from "@/lib/utils";

function getEmailFrom() {
  return process.env.EMAIL_FROM || "Klicor <hola@tudominio.com>";
}

export function getMailerConfigError() {
  if (!process.env.RESEND_API_KEY) {
    return "El envio de correos no esta configurado todavia. Falta RESEND_API_KEY.";
  }

  if (getEmailFrom().includes("tudominio.com")) {
    return "EMAIL_FROM todavia usa el dominio de ejemplo. Configura un remitente real y verificado en Resend.";
  }

  return null;
}

function getResend() {
  const configError = getMailerConfigError();
  if (configError) {
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

async function deliverEmail({ to, subject, html, strict = false }) {
  if (!to) {
    if (strict) {
      throw new Error("No encontramos un destinatario valido para enviar el correo.");
    }
    return { skipped: true };
  }

  const resend = getResend();
  if (!resend) {
    const configError = getMailerConfigError();
    if (strict) {
      throw new Error(configError || "El servicio de correos no esta disponible.");
    }
    return { skipped: true };
  }

  const result = await resend.emails.send({
    from: getEmailFrom(),
    to,
    subject,
    html,
  });

  if (result?.error) {
    throw new Error(result.error.message || "No pudimos enviar el correo.");
  }

  return result;
}

export function sendWelcomeEmail(user) {
  return deliverEmail({
    to: user.email,
    subject: "Bienvenido a Klicor",
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

export function sendBackupEmailVerification({ to, businessName, verificationUrl, expiresAt }) {
  return deliverEmail({
    to,
    subject: "Verifica tu correo de respaldo en Klicor",
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h1>Confirma tu correo de respaldo</h1><p>Hola ${businessName || "desde Klicor"}, agrega este correo como respaldo para recuperar tu cuenta si pierdes acceso al correo principal.</p><p><a href="${verificationUrl}" style="display:inline-block;padding:12px 18px;background:#5B21B6;color:#fff;text-decoration:none;border-radius:12px">Verificar correo de respaldo</a></p><p>Este enlace vence el ${formatDate(expiresAt)}.</p></div>`,
    strict: true,
  });
}
