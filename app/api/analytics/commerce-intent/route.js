import { NextResponse } from "next/server";
import { trackCommercialIntent } from "@/lib/firestore";
import { getPublicProfileByUsername } from "@/lib/public-profiles";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { sanitizeSlug } from "@/lib/utils";

const ALLOWED_ACTIONS = new Set(["product_whatsapp", "detail_whatsapp", "cart_whatsapp"]);

async function safelyTrackCommercialIntent(user, payload) {
  try {
    await trackCommercialIntent(user, payload);
  } catch (error) {
    console.error("[commerce-intent]", error?.message || error);
  }
}

export async function POST(request) {
  const rate = checkRateLimit(request, {
    key: "commerce-intent",
    limit: 120,
    windowMs: 60_000,
  });
  if (rate.limited) {
    return NextResponse.json({ error: "Too many requests" }, {
      status: 429,
      headers: rateLimitHeaders(rate),
    });
  }

  const body = await request.json().catch(() => ({}));
  const username = sanitizeSlug(body.username);
  const action = String(body.action || "").trim();

  if (!username || !ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const user = await getPublicProfileByUsername(username);
  if (!user?.uid) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  await safelyTrackCommercialIntent(user, {
    action,
    mode: body.mode,
    productId: body.productId,
    productName: body.productName,
  });

  return NextResponse.json({ ok: true }, { headers: rateLimitHeaders(rate) });
}
