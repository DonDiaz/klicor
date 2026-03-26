import Link from "next/link";
import { getPayment } from "@/lib/mercadopago";

export default async function BillingSuccessPage({ searchParams }) {
  const params = await searchParams;
  const status = params?.status || "approved";
  const paymentId = params?.payment_id || params?.collection_id || params?.paymentId || "";
  let payment = null;

  if (paymentId) {
    try {
      payment = await getPayment(paymentId);
    } catch {
      payment = null;
    }
  }

  const copy = {
    approved: "Pago recibido. En unos segundos veras tu cuenta activa.",
    pending: "Tu pago esta pendiente. Apenas se confirme, activaremos tu cuenta automaticamente.",
    failure: "El pago no se completo. Puedes intentarlo de nuevo desde tu dashboard.",
  };

  return (
    <main className="shell" style={{ padding: "4rem 0" }}>
      <section className="card" style={{ padding: "2rem", maxWidth: "640px", margin: "0 auto" }}>
        <h1>Estado del pago</h1>
        <p className="lead">{copy[status] || copy.approved}</p>
        {payment ? (
          <div className="stack" style={{ gap: ".55rem", margin: "1rem 0" }}>
            <p><strong>Operacion:</strong> {payment.id}</p>
            <p><strong>Estado:</strong> {payment.status}</p>
            <p><strong>Detalle:</strong> {payment.status_detail || "sin detalle"}</p>
            <p><strong>Medio:</strong> {payment.payment_method_id || payment.payment_type_id || "sin dato"}</p>
          </div>
        ) : null}
        <Link className="btn btn-primary" href="/dashboard">Volver al dashboard</Link>
      </section>
    </main>
  );
}
