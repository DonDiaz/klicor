import { NextResponse } from "next/server";
import { resolveContactCardData } from "@/lib/contact-card";
import { trackClick } from "@/lib/firestore";
import { getPublicProfileByUsername } from "@/lib/public-profiles";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { sanitizeSlug } from "@/lib/utils";

function resolveTrackedTarget(user, { button, linkId }) {
  if (!user) return "";

  if (button === "contact_card") {
    return resolveContactCardData(user).contactUrl || "";
  }

  const safeLinkId = String(linkId || "").trim();
  if (!safeLinkId) return "";

  return user.profileLinks?.find((item) => item.id === safeLinkId && item.type === button)?.url || "";
}

async function safelyTrackClick(username, button) {
  try {
    await trackClick(username, button);
  } catch (error) {
    console.error("[analytics-click]", error?.message || error);
  }
}

export async function GET(request) {
  const rate = checkRateLimit(request, {
    key: "analytics-click",
    limit: 90,
    windowMs: 60_000,
  });
  if (rate.limited) {
    return new NextResponse("Too many requests", {
      status: 429,
      headers: rateLimitHeaders(rate),
    });
  }

  const username = sanitizeSlug(request.nextUrl.searchParams.get("username"));
  const button = String(request.nextUrl.searchParams.get("button") || "unknown").trim();
  const linkId = request.nextUrl.searchParams.get("linkId") || "";

  if (!username) {
    return new NextResponse("Not found", { status: 404 });
  }

  const user = await getPublicProfileByUsername(username);
  const target = resolveTrackedTarget(user, { button, linkId });

  if (!target) {
    return new NextResponse("Not found", { status: 404 });
  }

  await safelyTrackClick(username, button);
  const response = NextResponse.redirect(new URL(target, request.url), 307);
  for (const [key, value] of Object.entries(rateLimitHeaders(rate))) {
    response.headers.set(key, value);
  }
  return response;
}
