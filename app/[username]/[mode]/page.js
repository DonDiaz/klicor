import { notFound, redirect } from "next/navigation";
import { CommercePublicView } from "@/components/commerce-public-view";
import { buildCommercePublicUrl, normalizeCommerceMode } from "@/lib/commerce-config";
import { getPublicCommerceBootstrapByUsername } from "@/lib/public-commerce";

export async function generateMetadata({ params }) {
  const { username, mode } = await params;
  const normalizedMode = normalizeCommerceMode(mode);
  const data = await getPublicCommerceBootstrapByUsername(username, normalizedMode);
  if (!data) {
    return { title: "No encontrado" };
  }

  const title = `${data.business.businessName} | ${data.modeMeta.label}`;
  const description = data.business.businessHeadline || data.modeMeta.publicHeadlineFallback;

  return {
    title,
    description,
    alternates: {
      canonical: buildCommercePublicUrl(data.business.usernameLower || username, normalizedMode),
    },
  };
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

  return <CommercePublicView bootstrap={data} />;
}
