import { notFound, redirect } from "next/navigation";
import { getPublicProfileByUsername } from "@/lib/public-profiles";
import { LandingView } from "@/components/landing-view";

export async function generateMetadata({ params }) {
  const { username } = await params;
  const user = await getPublicProfileByUsername(username);
  if (!user) {
    return { title: "No encontrado" };
  }
  return { title: `${user.businessName} | BioImpulso` };
}

export default async function PublicPage({ params }) {
  const { username } = await params;
  const data = await getPublicProfileByUsername(username);
  if (!data) {
    notFound();
  }

  if (data.usernameLower && data.usernameLower !== username.toLowerCase()) {
    redirect(`/${data.usernameLower}`);
  }

  if (["suspended", "cancelled"].includes(data.status)) {
    return (
      <main className="public-page">
        <section className="card" style={{ padding: "2rem", maxWidth: "560px" }}>
          <h1>Cuenta suspendida</h1>
          <p className="lead">Esta landing esta temporalmente pausada por falta de pago. Una vez se reactive el plan anual, volvera a estar disponible.</p>
        </section>
      </main>
    );
  }

  return <LandingView user={data} />;
}
