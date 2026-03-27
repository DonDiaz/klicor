import { NextResponse } from "next/server";
import { getUserByPublicLinkId } from "@/lib/firestore";
import { buildVanityProfilePath } from "@/lib/public-profile-links";

export async function GET(request, { params }) {
  const { publicLinkId } = await params;
  const user = await getUserByPublicLinkId(publicLinkId);

  if (!user?.usernameLower) {
    return new NextResponse("Not found", { status: 404 });
  }

  const destination = buildVanityProfilePath(user.usernameLower);
  const response = NextResponse.redirect(new URL(destination, request.url), 307);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
