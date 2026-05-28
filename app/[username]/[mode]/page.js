import { notFound, redirect } from "next/navigation";
import { CommercePublicView } from "@/components/commerce-public-view";
import { JsonLd } from "@/components/json-ld";
import { buildCommercePublicUrl, normalizeCommerceMode } from "@/lib/commerce-config";
import { getPublicCommerceBootstrapByUsername } from "@/lib/public-commerce";
import { buildCommerceSeoMetadata, buildLocalBusinessJsonLd, toAbsoluteUrl } from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata({ params }) {
  const { username, mode } = await params;
  const normalizedMode = normalizeCommerceMode(mode);
  const data = await getPublicCommerceBootstrapByUsername(username, normalizedMode);
  if (!data) {
    return { title: "No encontrado" };
  }

  const canonicalUrl = toAbsoluteUrl(
    buildCommercePublicUrl(data.business.usernameLower || username, normalizedMode),
  );

  return buildCommerceSeoMetadata(data, canonicalUrl);
}

export default async function CommercePublicPage({ params }) {
  const { username, mode } = await params;
  const normalizedMode = normalizeCommerceMode(mode);
  const data = await getPublicCommerceBootstrapByUsername(username, normalizedMode);

  if (!data) {
    notFound();
  }

  if (data.business.usernameLower && data.business.usernameLower !== username.toLowerCase()) {
    redirect(buildCommercePublicUrl(data.business.usernameLower, normalizedMode));
  }

  const canonicalUrl = toAbsoluteUrl(
    buildCommercePublicUrl(data.business.usernameLower || username, normalizedMode),
  );
  const seo = buildCommerceSeoMetadata(data, canonicalUrl);

  return (
    <>
      <JsonLd data={buildLocalBusinessJsonLd({
        business: data.business,
        url: canonicalUrl,
        description: seo.description,
        image: data.business.photoThumb || data.business.photo,
      })} />
      <CommercePublicView bootstrap={data} />
    </>
  );
}
