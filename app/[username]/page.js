import { notFound, redirect } from "next/navigation";
import { buildPublicProfileDescription, getPublicProfileByUsername } from "@/lib/public-profiles";
import { buildVanityProfileUrl } from "@/lib/public-profile-links";
import { LandingView } from "@/components/landing-view";

const SHARE_IMAGE_VERSION = "v3";

export async function generateMetadata({ params }) {
  const { username } = await params;
  const user = await getPublicProfileByUsername(username);
  if (!user) {
    return { title: "No encontrado" };
  }

  const description = buildPublicProfileDescription(user);
  const canonicalUsername = user.usernameLower || username.toLowerCase();
  const canonicalUrl = buildVanityProfileUrl(canonicalUsername);
  const imageUrl = `${canonicalUrl}/opengraph-image?cache=${SHARE_IMAGE_VERSION}-${user.updatedAtMs || 0}`;
  const title = user.businessName;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `Vista previa de ${user.businessName}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
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
