import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit-log";
import { activateUserSubscription, storePaymentAttempt } from "@/lib/firestore";
import { getPayment } from "@/lib/mercadopago";
import { verifyMercadoPagoWebhook } from "@/lib/mercadopago-webhook";

function getPayloadFromText(rawText) {
  if (!rawText) return null;

  try {
    return JSON.parse(rawText);
  } catch {
    const params = new URLSearchParams(rawText);
    const dataId = params.get("data.id") || params.get("id");
    const type = params.get("type") || params.get("topic");

    if (!dataId && !type) {
      return null;
    }

    return {
      data: {
        id: dataId,
      },
      type,
    };
  }
}

export async function POST(request) {
  try {
    const rawText = await request.text();
    const payload = getPayloadFromText(rawText);
    const search = request.nextUrl.searchParams;
    const paymentId = payload?.data?.id || search.get("data.id") || search.get("id");
    const type = payload?.type || search.get("type") || search.get("topic");

    if (!paymentId || !String(type || "").includes("payment")) {
      return NextResponse.json({ received: true, ignored: true });
    }

    const signatureCheck = verifyMercadoPagoWebhook({
      signatureHeader: request.headers.get("x-signature"),
      requestIdHeader: request.headers.get("x-request-id"),
      dataId: paymentId,
      secret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
    });

    if (!signatureCheck.ok) {
      const status = signatureCheck.reason === "missing_secret" ? 503 : 401;
      const errorMessage = signatureCheck.reason === "missing_secret"
        ? "Webhook de Mercado Pago no configurado"
        : "Firma de webhook no válida";
      return NextResponse.json({ error: errorMessage }, { status });
    }

    const payment = await getPayment(paymentId);
    const uid = payment.external_reference || payment.metadata?.uid;

    if (uid) {
      await storePaymentAttempt(uid, {
        id: String(payment.id),
        amount: payment.transaction_amount,
        status: payment.status,
        statusDetail: payment.status_detail || "",
        externalReference: payment.external_reference,
        plan: payment.metadata?.plan || "",
        raw: payment,
      });
    }

    if (payment.status !== "approved") {
      writeAuditLog({
        request,
        role: "system",
        action: "billing.webhook.payment",
        targetUid: uid || "",
        status: payment.status || "received",
        metadata: { paymentId: payment.id, statusDetail: payment.status_detail || "" },
      }).catch((error) => console.error("[audit-log]", error?.message || error));
      return NextResponse.json({
        received: true,
        status: payment.status,
        statusDetail: payment.status_detail || null,
      });
    }

    if (!uid) {
      return NextResponse.json({ received: true, warning: "missing_uid" });
    }

    await activateUserSubscription(uid, {
      id: String(payment.id),
      amount: payment.transaction_amount,
      status: payment.status,
      statusDetail: payment.status_detail || "",
      externalReference: payment.external_reference,
      plan: payment.metadata?.plan || "",
      raw: payment,
    });
    writeAuditLog({
      request,
      role: "system",
      action: "billing.webhook.approved",
      targetUid: uid,
      status: "approved",
      metadata: { paymentId: payment.id, amount: payment.transaction_amount, plan: payment.metadata?.plan || "" },
    }).catch((error) => console.error("[audit-log]", error?.message || error));

    return NextResponse.json({
      received: true,
      verified: true,
    });
  } catch (error) {
    console.error("[billing-webhook]", error?.message || error);
    return NextResponse.json({ error: "No pudimos procesar el webhook." }, { status: 400 });
  }
}
