import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { BookingPublicView } from "@/components/booking-public-view";
import { JsonLd } from "@/components/json-ld";
import { buildBookingPublicUrl } from "@/lib/booking-config";
import { getPublicBookingBootstrapByUsername } from "@/lib/public-booking";
import { buildBookingSeoMetadata, buildLocalBusinessJsonLd, toAbsoluteUrl } from "@/lib/seo";

async function getCurrentOrigin() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "";
  const protocol = requestHeaders.get("x-forwarded-proto") || "https";
  return host ? `${protocol}://${host}` : undefined;
}

export async function generateMetadata({ params }) {
  const { username } = await params;
  const data = await getPublicBookingBootstrapByUsername(username);
  if (!data) {
    return { title: "No encontrado" };
  }

  const canonicalUrl = toAbsoluteUrl(
    buildBookingPublicUrl(data.business.usernameLower || username),
    await getCurrentOrigin(),
  );

  return buildBookingSeoMetadata(data, canonicalUrl);
}

export default async function BookingPublicPage({ params }) {
  const { username } = await params;
  const data = await getPublicBookingBootstrapByUsername(username);

  if (!data) {
    notFound();
  }

  if (data.business.usernameLower && data.business.usernameLower !== username.toLowerCase()) {
    redirect(buildBookingPublicUrl(data.business.usernameLower));
  }

  const canonicalUrl = toAbsoluteUrl(
    buildBookingPublicUrl(data.business.usernameLower || username),
    await getCurrentOrigin(),
  );
  const seo = buildBookingSeoMetadata(data, canonicalUrl);

  return (
    <>
      <JsonLd data={buildLocalBusinessJsonLd({
        business: data.business,
        url: canonicalUrl,
        description: seo.description,
        image: data.business.photoThumb || data.business.photo,
      })} />
      <BookingPublicView bootstrap={data} />
    </>
  );
}
