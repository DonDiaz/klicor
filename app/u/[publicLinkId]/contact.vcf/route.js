import { NextResponse } from "next/server";
import { buildVCardString, resolveContactCardData } from "@/lib/contact-card";
import { getPublicProfileByPublicLinkId } from "@/lib/public-profiles";
import { sanitizeSlug } from "@/lib/utils";

export async function GET(_request, { params }) {
  const { publicLinkId } = await params;
  const user = await getPublicProfileByPublicLinkId(publicLinkId);

  if (!user) {
    return new NextResponse("No encontrado", { status: 404 });
  }

  const contactCard = resolveContactCardData(user);
  const vCard = buildVCardString(user);

  if (!contactCard.shouldShow || !vCard) {
    return new NextResponse("No disponible", { status: 404 });
  }

  const filenameBase = sanitizeSlug(contactCard.name || user.businessName || "contacto") || "contacto";

  return new NextResponse(vCard, {
    status: 200,
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `inline; filename="${filenameBase}.vcf"`,
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
    },
  });
}
