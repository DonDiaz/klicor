import { notFound, redirect } from "next/navigation";
import { buildPublicProfileDescription, getPublicProfileByUsername } from "@/lib/public-profiles";
import { buildVanityProfileUrl } from "@/lib/public-profile-links";
import { buildCommercePublicUrl, normalizeCommerceMode } from "@/lib/commerce-config";
import { LandingView } from "@/components/landing-view";
import { JsonLd } from "@/components/json-ld";
import { buildLocalBusinessJsonLd, buildSeoMetadata } from "@/lib/seo";

const SHARE_IMAGE_VERSION = "v3";

export const revalidate = 300;

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

  return buildSeoMetadata({
    title,
    description,
    url: canonicalUrl,
    image: imageUrl,
    imageAlt: `Vista previa de ${user.businessName}`,
  });
}

export default async function PublicPage({ params, searchParams }) {
  const { username } = await params;
  const query = await searchParams;
  const data = await getPublicProfileByUsername(username);
  if (!data) {
    notFound();
  }

  const canonicalUsername = data.usernameLower || username.toLowerCase();
  const productId = String(query?.producto || query?.product || query?.productId || "").trim();
  const activeCommerceMode = normalizeCommerceMode(data.commerce?.activeMode);

  if (productId && activeCommerceMode) {
    redirect(`${buildCommercePublicUrl(canonicalUsername, activeCommerceMode)}?producto=${encodeURIComponent(productId)}`);
  }

  if (data.usernameLower && data.usernameLower !== username.toLowerCase()) {
    redirect(`/${canonicalUsername}`);
  }

  if (["suspended", "cancelled"].includes(data.status)) {
    return (
      <main className="public-page">
        <section className="card" style={{ padding: "2rem", maxWidth: "560px" }}>
          <h1>Cuenta suspendida</h1>
          <p className="lead">Esta página está temporalmente pausada por falta de pago. Una vez se reactive el plan anual, volverá a estar disponible.</p>
        </section>
      </main>
    );
  }

  const canonicalUrl = buildVanityProfileUrl(canonicalUsername);
  const description = buildPublicProfileDescription(data);

  return (
    <>
      <JsonLd data={buildLocalBusinessJsonLd({
        business: data,
        url: canonicalUrl,
        description,
        image: data.photoThumb || data.photo,
      })} />
      <LandingView user={data} />
    </>
  );
}
