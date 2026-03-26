import Link from "next/link";
import { verifyBackupEmail } from "@/lib/firestore";

export default async function RecoveryVerifyPage({ searchParams }) {
  const params = await searchParams;
  const uid = String(params?.uid || "");
  const token = String(params?.token || "");
  let result = { ok: false, message: "No pudimos verificar este correo de respaldo." };

  if (uid && token) {
    try {
      await verifyBackupEmail(uid, token);
      result = { ok: true, message: "Tu correo de respaldo quedó verificado correctamente." };
    } catch (error) {
      result = { ok: false, message: error.message };
    }
  }

  return (
    <main className="shell" style={{ padding: "4rem 0" }}>
      <section className="card" style={{ padding: "2rem", maxWidth: "640px", margin: "0 auto" }}>
        <h1>Verificación de recuperación</h1>
        <p className="lead">{result.message}</p>
        <Link className="btn btn-primary" href="/dashboard">Ir al dashboard</Link>
      </section>
    </main>
  );
}
