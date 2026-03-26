import Link from "next/link";

export default async function BillingSuccessPage({ searchParams }) {
  const params = await searchParams;
  const status = params?.status || "approved";
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
        <Link className="btn btn-primary" href="/dashboard">Volver al dashboard</Link>
      </section>
    </main>
  );
}
