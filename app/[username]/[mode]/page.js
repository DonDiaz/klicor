import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { CommercePublicView } from "@/components/commerce-public-view";
import { JsonLd } from "@/components/json-ld";
import { buildCommercePublicUrl, normalizeCommerceMode } from "@/lib/commerce-config";
import { getPublicCommerceBootstrapByUsername } from "@/lib/public-commerce";
import { buildCommerceSeoMetadata, buildLocalBusinessJsonLd, toAbsoluteUrl } from "@/lib/seo";

async function getCurrentOrigin() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "";
  const protocol = requestHeaders.get("x-forwarded-proto") || "https";
  return host ? `${protocol}://${host}` : undefined;
}

export async function generateMetadata({ params }) {
  const { username, mode } = await params;
  const normalizedMode = normalizeCommerceMode(mode);
  const data = await getPublicCommerceBootstrapByUsername(username, normalizedMode);
  if (!data) {
    return { title: "No encontrado" };
  }

  const canonicalUrl = toAbsoluteUrl(
    buildCommercePublicUrl(data.business.usernameLower || username, normalizedMode),
    await getCurrentOrigin(),
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
    await getCurrentOrigin(),
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
