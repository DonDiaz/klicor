import { NextResponse } from "next/server";
import {
  getPublicCommerceBootstrapByUsername,
  getPublicCommerceChunkByUsername,
  getPublicCommerceProductDeepLinkByUsername,
} from "@/lib/public-commerce";
import { normalizeCommerceMode } from "@/lib/commerce-config";
import { checkRateLimit, rateLimitHeaders, rateLimitResponse } from "@/lib/rate-limit";
import { createServerTiming } from "@/lib/server-timing";
import { verifyAppCheckRequest, appCheckResponse } from "@/lib/app-check";

export async function GET(request, { params }) {
  const timing = createServerTiming();
  const rate = checkRateLimit(request, {
    key: "public-commerce-read",
    limit: 180,
    windowMs: 60_000,
  });
  if (rate.limited) return rateLimitResponse(rate);
  const appCheck = await verifyAppCheckRequest(request, { label: "public-commerce-read" });
  if (!appCheck.ok) return appCheckResponse(appCheck);

  try {
    const { username } = await params;
    const { searchParams } = new URL(request.url);
    const mode = normalizeCommerceMode(searchParams.get("mode"));
    const categoryId = String(searchParams.get("categoryId") || "").trim();
    const subcategoryId = String(searchParams.get("subcategoryId") || "").trim();
    const after = String(searchParams.get("after") || "").trim();
    const includeSubcategories = searchParams.get("includeSubcategories") !== "false";
    const productId = String(searchParams.get("producto") || searchParams.get("product") || searchParams.get("productId") || "").trim();

    if (!mode) {
      throw new Error("Modo comercial inválido.");
    }

    if (productId) {
      const deepLink = await timing.measure(
        "product",
        () => getPublicCommerceProductDeepLinkByUsername(username, mode, productId),
        "deep-link",
      );
      if (!deepLink) {
        const payload = { error: "No encontramos ese producto publicado." };
        return NextResponse.json(payload, {
          status: 404,
          headers: timing.headers(payload, rateLimitHeaders(rate)),
        });
      }

      const payload = { data: deepLink };
      return NextResponse.json(payload, {
        headers: timing.headers(payload, rateLimitHeaders(rate)),
      });
    }

    if (!categoryId && !subcategoryId) {
      const bootstrap = await timing.measure(
        "bootstrap",
        () => getPublicCommerceBootstrapByUsername(username, mode),
        "public-commerce",
      );
      if (!bootstrap) {
        const payload = { error: "No encontramos ese comercio." };
        return NextResponse.json(payload, {
          status: 404,
          headers: timing.headers(payload, rateLimitHeaders(rate)),
        });
      }

      const payload = { data: bootstrap };
      return NextResponse.json(payload, {
        headers: timing.headers(payload, rateLimitHeaders(rate)),
      });
    }

    const chunk = await timing.measure(
      "chunk",
      () => getPublicCommerceChunkByUsername(username, mode, { categoryId, subcategoryId, after, includeSubcategories }),
      includeSubcategories ? "with-subcategories" : "products-only",
    );

    if (!chunk) {
      const payload = { error: "No encontramos esa sección comercial." };
      return NextResponse.json(payload, {
        status: 404,
        headers: timing.headers(payload, rateLimitHeaders(rate)),
      });
    }

    const payload = { data: chunk };
    return NextResponse.json(payload, {
      headers: timing.headers(payload, rateLimitHeaders(rate)),
    });
  } catch (error) {
    console.error("[public-commerce]", error?.message || error);
    const payload = { error: "No pudimos cargar el comercio público." };
    return NextResponse.json(payload, {
      status: 400,
      headers: timing.headers(payload, rateLimitHeaders(rate)),
    });
  }
}
