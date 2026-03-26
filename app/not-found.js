import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell" style={{ padding: "4rem 0" }}>
      <section className="card" style={{ padding: "2rem", textAlign: "center" }}>
        <h1>Pagina no encontrada</h1>
        <p className="lead">Ese perfil no existe o ya no esta disponible.</p>
        <Link className="btn btn-primary" href="/">Volver al inicio</Link>
      </section>
    </main>
  );
}
