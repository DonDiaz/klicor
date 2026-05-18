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
    return { skipped: true, reason: "missing_recipient" };
  }

  const resend = getResend();
  if (!resend) {
    const configError = getMailerConfigError();
    if (strict) {
      throw new Error(configError || "El servicio de correos no está disponible.");
    }
    return { skipped: true, reason: configError || "mailer_not_configured" };
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

function escapeHtml(value = "") {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMoney(value = 0) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function getAdminEmail() {
  return String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
}

function billingProfileRows(profile = {}) {
  return [
    { label: "Razon social / nombre", value: profile.legalName },
    { label: "Tipo documento", value: profile.documentType },
    { label: "Numero documento", value: profile.verificationDigit ? `${profile.documentNumber}-${profile.verificationDigit}` : profile.documentNumber },
    { label: "Responsable de IVA", value: profile.taxResponsibility === "si" ? "Si" : profile.taxResponsibility === "no" ? "No" : "" },
    { label: "Correo facturacion", value: profile.billingEmail },
    { label: "Telefono facturacion", value: profile.billingPhone },
    { label: "Direccion", value: profile.address },
    { label: "Ciudad", value: [profile.city, profile.department].filter(Boolean).join(", ") },
    { label: "Pais", value: profile.country },
  ];
}

function adminBillingShell({ title, intro, rows = [], actionUrl = "" }) {
  const safeRows = rows
    .filter((row) => row?.label)
    .map((row) => `
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;border-bottom:1px solid #eef2f7;">${escapeHtml(row.label)}</td>
        <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:700;text-align:right;border-bottom:1px solid #eef2f7;">${escapeHtml(row.value || "-")}</td>
      </tr>
    `)
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.55;color:#0f172a;background:#f8fafc;padding:28px 14px;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;padding:28px;">
        <p style="margin:0 0 8px;color:#6D28D9;font-weight:700;font-size:13px;letter-spacing:.02em;">KLICOR FACTURACION</p>
        <h1 style="margin:0 0 12px;font-size:24px;line-height:1.2;color:#111827;">${escapeHtml(title)}</h1>
        <p style="margin:0 0 22px;font-size:15px;color:#475569;">${escapeHtml(intro)}</p>
        <table style="width:100%;border-collapse:collapse;margin:0 0 22px;">
          <tbody>${safeRows}</tbody>
        </table>
        ${actionUrl ? `<p style="margin:0;"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;padding:12px 16px;background:#6D28D9;color:#ffffff;text-decoration:none;border-radius:12px;font-weight:700;">Abrir admin</a></p>` : ""}
      </div>
    </div>
  `;
}

export function sendAdminBillingProfileUpdated({ user }) {
  const adminEmail = getAdminEmail();
  const dashboardUrl = `${getAppUrl()}/admin`;
  const profile = user?.billingProfile || {};

  return deliverEmail({
    to: adminEmail,
    subject: `Datos de facturacion actualizados - ${user?.businessName || user?.email || "Klicor"}`,
    html: adminBillingShell({
      title: "Cliente actualizo datos de facturacion",
      intro: "Revisa estos datos para facturacion electronica manual si el cliente la solicita.",
      actionUrl: dashboardUrl,
      rows: [
        { label: "Negocio", value: user?.businessName },
        { label: "Usuario", value: user?.usernameLower || user?.username },
        { label: "Correo cuenta", value: user?.email },
        { label: "Plan actual", value: user?.plan || user?.status },
        ...billingProfileRows(profile),
      ],
    }),
  });
}

export function sendAdminPaymentApproved({ user, payment }) {
  const adminEmail = getAdminEmail();
  const dashboardUrl = `${getAppUrl()}/admin`;
  const profile = user?.billingProfile || {};
  const hasBillingData = Boolean(profile.legalName && profile.documentNumber && profile.billingEmail);
  const paymentRaw = payment?.raw || {};
  const paymentMethod = [
    paymentRaw.payment_type_id,
    paymentRaw.payment_method_id,
  ].filter(Boolean).join(" / ");

  return deliverEmail({
    to: adminEmail,
    subject: `Pago aprobado ${hasBillingData ? "con datos" : "sin datos"} de facturacion - ${user?.businessName || user?.email || "Klicor"}`,
    html: adminBillingShell({
      title: "Pago aprobado en Klicor",
      intro: hasBillingData
        ? "El cliente tiene datos de facturacion guardados. Revisa si debes emitir factura electronica individual."
        : "El cliente pago sin datos completos de facturacion. Si no solicita factura individual, puede entrar al consolidado mensual de cliente indeterminado.",
      actionUrl: dashboardUrl,
      rows: [
        { label: "Negocio", value: user?.businessName },
        { label: "Usuario", value: user?.usernameLower || user?.username },
        { label: "Correo cuenta", value: user?.email },
        { label: "Plan pagado", value: payment?.plan || user?.plan },
        { label: "Valor", value: formatMoney(payment?.amount) },
        { label: "Medio pago", value: paymentMethod },
        { label: "ID Mercado Pago", value: payment?.id || paymentRaw.id },
        { label: "Referencia externa", value: payment?.externalReference || paymentRaw.external_reference },
        { label: "Datos facturacion", value: hasBillingData ? "Completos para revision manual" : "Incompletos o no solicitados" },
        ...billingProfileRows(profile),
      ],
    }),
  });
}

function bookingEmailShell({ title, intro, rows = [], actionUrl = "", actionLabel = "Ver agenda" }) {
  const safeRows = rows
    .filter((row) => row?.label && row?.value)
    .map((row) => `
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;">${escapeHtml(row.label)}</td>
        <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:700;text-align:right;">${escapeHtml(row.value)}</td>
      </tr>
    `)
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.55;color:#0f172a;background:#f8fafc;padding:28px 14px;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;padding:28px;">
        <p style="margin:0 0 8px;color:#6D28D9;font-weight:700;font-size:13px;letter-spacing:.02em;">KLICOR AGENDA</p>
        <h1 style="margin:0 0 12px;font-size:24px;line-height:1.2;color:#111827;">${escapeHtml(title)}</h1>
        <p style="margin:0 0 22px;font-size:15px;color:#475569;">${escapeHtml(intro)}</p>
        <table style="width:100%;border-collapse:collapse;margin:0 0 22px;">
          <tbody>${safeRows}</tbody>
        </table>
        ${actionUrl ? `<p style="margin:0;"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;padding:12px 16px;background:#6D28D9;color:#ffffff;text-decoration:none;border-radius:12px;font-weight:700;">${escapeHtml(actionLabel)}</a></p>` : ""}
      </div>
    </div>
  `;
}

function buildBookingRows({ businessName = "", appointment = {}, summary = {} } = {}) {
  return [
    { label: "Negocio", value: businessName },
    { label: "Cliente", value: appointment.customerName },
    { label: "Telefono", value: appointment.customerPhone },
    { label: "Servicio", value: summary.service || appointment.serviceNameSnapshot },
    { label: "Profesional", value: summary.professional || appointment.staffNameSnapshot },
    { label: "Fecha", value: summary.dateLabel || appointment.dateLabel },
    { label: "Hora", value: summary.timeLabel || appointment.timeLabel },
    { label: "Duracion", value: summary.durationLabel || appointment.durationLabel },
    { label: "Precio", value: summary.priceLabel || appointment.priceLabel },
  ];
}

export function sendBookingBusinessNotification({ to, businessName, appointment, summary, dashboardUrl, mode }) {
  const isConfirmed = mode === "confirmed" || appointment?.status === "confirmed";
  return deliverEmail({
    to,
    subject: isConfirmed
      ? `Nueva cita confirmada en ${businessName || "tu negocio"}`
      : `Nueva solicitud de cita en ${businessName || "tu negocio"}`,
    html: bookingEmailShell({
      title: isConfirmed ? "Nueva cita confirmada" : "Nueva solicitud de cita",
      intro: isConfirmed
        ? "El cliente creo una cita y quedo confirmada automaticamente segun tu configuracion."
        : "El cliente envio una solicitud. Revisa tu agenda para aceptarla, reprogramarla o cancelarla.",
      rows: buildBookingRows({ businessName, appointment, summary }),
      actionUrl: dashboardUrl,
      actionLabel: "Abrir agenda",
    }),
  });
}

export function sendBookingCustomerConfirmation({ to, businessName, appointment, summary, publicUrl }) {
  return deliverEmail({
    to,
    subject: `Tu cita en ${businessName || "el negocio"} esta confirmada`,
    html: bookingEmailShell({
      title: "Tu cita esta confirmada",
      intro: "Guardamos los datos de tu cita. Si el negocio realiza algun cambio importante, te avisaremos por correo.",
      rows: buildBookingRows({ businessName, appointment, summary }),
      actionUrl: publicUrl,
      actionLabel: "Ver agenda",
    }),
  });
}

export function sendBookingCustomerReminder({ to, businessName, appointment, summary, publicUrl }) {
  return deliverEmail({
    to,
    subject: `Recordatorio de tu cita en ${businessName || "el negocio"}`,
    html: bookingEmailShell({
      title: "Tu cita esta cerca",
      intro: "Te recordamos los datos de tu cita confirmada.",
      rows: buildBookingRows({ businessName, appointment, summary }),
      actionUrl: publicUrl,
      actionLabel: "Ver agenda",
    }),
  });
}

export function sendBookingCustomerUpdate({ to, businessName, appointment, summary, publicUrl, updateType = "updated" }) {
  const copy = {
    rescheduled: {
      subject: `Tu cita en ${businessName || "el negocio"} fue reprogramada`,
      title: "Tu cita fue reprogramada",
      intro: "El negocio actualizo la fecha u hora de tu cita. Revisa los nuevos datos.",
    },
    cancelled: {
      subject: `Tu cita en ${businessName || "el negocio"} fue cancelada`,
      title: "Tu cita fue cancelada",
      intro: "El negocio marco esta cita como cancelada. Si necesitas otra hora, abre de nuevo la agenda o contacta al negocio.",
    },
    updated: {
      subject: `Actualizacion de tu cita en ${businessName || "el negocio"}`,
      title: "Tu cita fue actualizada",
      intro: "Hay una actualizacion importante en tu cita. Revisa los datos.",
    },
  }[updateType] || {
    subject: `Actualizacion de tu cita en ${businessName || "el negocio"}`,
    title: "Tu cita fue actualizada",
    intro: "Hay una actualizacion importante en tu cita. Revisa los datos.",
  };

  return deliverEmail({
    to,
    subject: copy.subject,
    html: bookingEmailShell({
      title: copy.title,
      intro: copy.intro,
      rows: buildBookingRows({ businessName, appointment, summary }),
      actionUrl: publicUrl,
      actionLabel: "Ver agenda",
    }),
  });
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
