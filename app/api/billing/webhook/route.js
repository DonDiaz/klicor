import { NextResponse } from "next/server";
import { activateUserSubscription } from "@/lib/firestore";
import { getPayment } from "@/lib/mercadopago";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    const search = request.nextUrl.searchParams;
    const paymentId = body?.data?.id || search.get("data.id") || search.get("id");
    const type = body?.type || search.get("type") || search.get("topic");

    if (!paymentId || !["payment", "topic_payment"].some((value) => String(type || "").includes("payment") || String(type) === value)) {
      return NextResponse.json({ received: true });
    }

    const payment = await getPayment(paymentId);
    if (payment.status !== "approved") {
      return NextResponse.json({ received: true, status: payment.status });
    }

    const uid = payment.external_reference || payment.metadata?.uid;
    if (!uid) {
      return NextResponse.json({ received: true, warning: "missing uid" });
    }

    await activateUserSubscription(uid, {
      id: String(payment.id),
      amount: payment.transaction_amount,
      status: payment.status,
      externalReference: payment.external_reference,
      raw: payment,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
