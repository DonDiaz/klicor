import "server-only";
import { Resend } from "resend";
import { getAppUrl } from "@/lib/env";
import { formatDate } from "@/lib/utils";

function getEmailFrom() {
  return process.env.EMAIL_FROM || "Klicor <hola@tudominio.com>";
}

export function getMailerConfigError() {
  if (!process.env.RESEND_API_KEY) {
    return "El envío de correos no está configurado todavía. Falta RESEND_API_KEY.";
  }

  if (getEmailFrom().includes("tudominio.com")) {
    return "EMAIL_FROM todavía usa el dominio de ejemplo. Configura un remitente real y verificado en Resend.";
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
      throw new Error("No encontramos un destinatario válido para enviar el correo.");
    }
    return { skipped: true };
  }

  const resend = getResend();
  if (!resend) {
    const configError = getMailerConfigError();
    if (strict) {
      throw new Error(configError || "El servicio de correos no está disponible.");
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
  const dashboardUrl = `${getAppUrl()}/dashboard`;

  return deliverEmail({
    to: user.email,
    subject: "Bienvenido a Klicor 🚀 Tu marca en un solo QR",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.65;color:#111827;background:#f4f1ff;padding:32px 16px;">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:24px;padding:32px;border:1px solid #e9ddff;">
          <p style="margin:0 0 20px;font-size:16px;">Hola 👋</p>

          <p style="margin:0 0 16px;font-size:16px;">Bienvenido a Klicor.</p>

          <p style="margin:0 0 20px;font-size:16px;">
            Desde ahora tienes una forma más simple de organizar tu información y compartir tu marca.
          </p>

          <div style="margin:0 0 24px;padding:20px;border-radius:20px;background:#f7f5ff;border:1px solid #ece4ff;">
            <p style="margin:0 0 8px;font-size:16px;">👉 Un solo enlace</p>
            <p style="margin:0 0 8px;font-size:16px;">👉 Un solo QR</p>
            <p style="margin:0;font-size:16px;">👉 Todo en un solo lugar</p>
          </div>

          <h2 style="margin:0 0 12px;font-size:20px;color:#261046;">🎯 ¿Qué puedes hacer ahora?</h2>
          <p style="margin:0 0 16px;font-size:16px;">En pocos minutos puedes tener tu Klicor listo:</p>

          <div style="margin:0 0 24px;padding:20px;border-radius:20px;background:#ffffff;border:1px solid #ece4ff;">
            <p style="margin:0 0 8px;font-size:16px;">✅ Agrega tus enlaces (WhatsApp, redes, web)</p>
            <p style="margin:0 0 8px;font-size:16px;">✅ Personaliza tu perfil</p>
            <p style="margin:0 0 8px;font-size:16px;">✅ Descarga tu QR</p>
            <p style="margin:0;font-size:16px;">✅ Empieza a compartirlo</p>
          </div>

          <h2 style="margin:0 0 12px;font-size:20px;color:#261046;">📲 ¿Para qué sirve?</h2>
          <p style="margin:0 0 8px;font-size:16px;">Para que tus clientes puedan:</p>
          <p style="margin:0 0 4px;font-size:16px;">Encontrarte fácilmente</p>
          <p style="margin:0 0 4px;font-size:16px;">Acceder a toda tu información</p>
          <p style="margin:0 0 24px;font-size:16px;">Guardar tu contacto en segundos</p>

          <h2 style="margin:0 0 12px;font-size:20px;color:#261046;">🚀 Empieza ahora</h2>
          <p style="margin:0 0 16px;font-size:16px;">Haz clic aquí y completa tu Klicor:</p>

          <p style="margin:0 0 28px;">
            <a href="${dashboardUrl}" style="display:inline-block;padding:14px 22px;background:#6D28D9;color:#ffffff;text-decoration:none;border-radius:14px;font-weight:700;">
              👉 Ir a mi perfil
            </a>
          </p>

          <h2 style="margin:0 0 12px;font-size:20px;color:#261046;">💡 Recuerda</h2>
          <p style="margin:0 0 8px;font-size:16px;">Puedes usar tu QR en:</p>
          <p style="margin:0 0 4px;font-size:16px;">Tarjetas</p>
          <p style="margin:0 0 4px;font-size:16px;">Etiquetas</p>
          <p style="margin:0 0 4px;font-size:16px;">Mostrador</p>
          <p style="margin:0 0 4px;font-size:16px;">Redes sociales</p>

          <p style="margin:24px 0 16px;font-size:16px;font-weight:700;color:#261046;">👉 Un QR. Toda tu marca.</p>

          <p style="margin:0 0 12px;font-size:16px;">Si tienes alguna duda, estamos aquí para ayudarte.</p>
          <p style="margin:0 0 24px;font-size:16px;">Bienvenido a una forma más simple de compartir tu negocio.</p>

          <p style="margin:0;font-size:15px;color:#4B5563;">— Equipo Klicor</p>
        </div>
      </div>
    `,
  });
}

export function sendUpcomingExpiryEmail(user) {
  return deliverEmail({
    to: user.email,
    subject: "Tu plan está por vencer",
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h1>Tu cuenta está por vencer</h1><p>Recuerda renovar antes del ${formatDate(user.expiresAt || user.trialEndsAt)} para no perder edición de tu perfil.</p></div>`,
  });
}

export function sendSuspensionEmail(user) {
  return deliverEmail({
    to: user.email,
    subject: "Tu cuenta fue suspendida temporalmente",
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h1>Cuenta suspendida</h1><p>Tu periodo de gracia terminó y la página se encuentra pausada hasta registrar el pago anual.</p><p>Ingresa al panel para renovar y reactivar tu página.</p></div>`,
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
