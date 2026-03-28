import Link from "next/link";
import { AuthProvider } from "@/components/providers/auth-provider";
import { BillingSuccessClient } from "@/components/billing-success-client";
import { getPayment } from "@/lib/mercadopago";

export default async function BillingSuccessPage({ searchParams }) {
  const params = await searchParams;
  const requestedStatus = params?.status || "";
  const paymentId = params?.payment_id || params?.collection_id || params?.paymentId || "";
  let payment = null;

  if (paymentId) {
    try {
      payment = await getPayment(paymentId);
    } catch {
      payment = null;
    }
  }

  const resolvedStatus = payment?.status || requestedStatus || "unknown";
  const copy = {
    approved: "Pago recibido. En unos segundos verás tu cuenta activa.",
    pending: "Tu pago está pendiente. Apenas se confirme, activaremos tu cuenta automáticamente.",
    in_process: "Tu pago está en proceso. Revisa de nuevo tu panel en unos minutos.",
    rejected: "El pago fue rechazado. Puedes intentarlo de nuevo desde tu panel.",
    cancelled: "El pago fue cancelado antes de completarse.",
    failure: "El pago no se completó. Puedes intentarlo de nuevo desde tu panel.",
    unknown: "Estamos revisando el estado del pago. Verifica tu panel en unos segundos.",
  };

  return (
    <main className="shell" style={{ padding: "4rem 0" }}>
      <section className="card" style={{ padding: "2rem", maxWidth: "640px", margin: "0 auto" }}>
        <h1>Estado del pago</h1>
        <p className="lead">{copy[resolvedStatus] || copy.unknown}</p>
        {payment ? (
          <div className="stack" style={{ gap: ".55rem", margin: "1rem 0" }}>
            <p><strong>Operación:</strong> {payment.id}</p>
            <p><strong>Estado:</strong> {payment.status}</p>
            <p><strong>Detalle:</strong> {payment.status_detail || "sin detalle"}</p>
            <p><strong>Medio:</strong> {payment.payment_method_id || payment.payment_type_id || "sin dato"}</p>
          </div>
        ) : null}
        <AuthProvider>
          <BillingSuccessClient paymentId={paymentId} initialStatus={resolvedStatus} />
        </AuthProvider>
        <Link className="btn btn-primary" href="/dashboard">Volver al panel</Link>
      </section>
    </main>
  );
}
