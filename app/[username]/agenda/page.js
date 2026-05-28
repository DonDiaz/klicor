import { notFound, redirect } from "next/navigation";
import { BookingPublicView } from "@/components/booking-public-view";
import { JsonLd } from "@/components/json-ld";
import { buildBookingPublicUrl } from "@/lib/booking-config";
import { getPublicBookingBootstrapByUsername } from "@/lib/public-booking";
import { buildBookingSeoMetadata, buildLocalBusinessJsonLd, toAbsoluteUrl } from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata({ params }) {
  const { username } = await params;
  const data = await getPublicBookingBootstrapByUsername(username);
  if (!data) {
    return { title: "No encontrado" };
  }

  const canonicalUrl = toAbsoluteUrl(
    buildBookingPublicUrl(data.business.usernameLower || username),
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
