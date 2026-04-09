import { notFound, redirect } from "next/navigation";
import { BookingPublicView } from "@/components/booking-public-view";
import { buildBookingPublicUrl } from "@/lib/booking-config";
import { getPublicBookingBootstrapByUsername } from "@/lib/public-booking";

export async function generateMetadata({ params }) {
  const { username } = await params;
  const data = await getPublicBookingBootstrapByUsername(username);
  if (!data) {
    return { title: "No encontrado" };
  }

  return {
    title: `${data.business.businessName} | Agenda tu cita`,
    description: `Reserva tu cita con ${data.business.businessName} en pocos pasos.`,
    alternates: {
      canonical: buildBookingPublicUrl(data.business.usernameLower || username),
    },
  };
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

  return <BookingPublicView bootstrap={data} />;
}
