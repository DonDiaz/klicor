import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth";
import { activateUserSubscription, storePaymentAttempt } from "@/lib/firestore";
import { getPayment } from "@/lib/mercadopago";

export async function POST(request) {
  try {
    const { user } = await verifyRequest(request);
    const body = await request.json();
    const paymentId = String(body?.paymentId || "").trim();

    if (!paymentId) {
      return NextResponse.json({ error: "Falta paymentId" }, { status: 400 });
    }

    const payment = await getPayment(paymentId);
    const uid = payment.external_reference || payment.metadata?.uid;

    if (!uid || uid !== user.uid) {
      return NextResponse.json({ error: "Pago no asociado al usuario autenticado" }, { status: 403 });
    }

    await storePaymentAttempt(uid, {
      id: String(payment.id),
      amount: payment.transaction_amount,
      status: payment.status,
      statusDetail: payment.status_detail || "",
      externalReference: payment.external_reference,
      raw: payment,
    });

    if (payment.status === "approved") {
      await activateUserSubscription(uid, {
        id: String(payment.id),
        amount: payment.transaction_amount,
        status: payment.status,
        statusDetail: payment.status_detail || "",
        externalReference: payment.external_reference,
        raw: payment,
      });
    }

    return NextResponse.json({
      paymentId: payment.id,
      status: payment.status,
      statusDetail: payment.status_detail || "",
      uid,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
