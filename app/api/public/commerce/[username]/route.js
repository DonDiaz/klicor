import { NextResponse } from "next/server";
import { getPublicCommerceBootstrapByUsername, getPublicCommerceChunkByUsername } from "@/lib/public-commerce";
import { normalizeCommerceMode } from "@/lib/commerce-config";

export async function GET(request, { params }) {
  try {
    const { username } = await params;
    const { searchParams } = new URL(request.url);
    const mode = normalizeCommerceMode(searchParams.get("mode"));
    const categoryId = String(searchParams.get("categoryId") || "").trim();
    const subcategoryId = String(searchParams.get("subcategoryId") || "").trim();
    const after = String(searchParams.get("after") || "").trim();
    const includeSubcategories = searchParams.get("includeSubcategories") !== "false";

    if (!mode) {
      throw new Error("Modo comercial inválido.");
    }

    if (!categoryId && !subcategoryId) {
      const bootstrap = await getPublicCommerceBootstrapByUsername(username, mode);
      if (!bootstrap) {
        return NextResponse.json({ error: "No encontramos ese comercio." }, { status: 404 });
      }
      return NextResponse.json({ data: bootstrap });
    }

    const chunk = await getPublicCommerceChunkByUsername(username, mode, { categoryId, subcategoryId, after, includeSubcategories });
    if (!chunk) {
      return NextResponse.json({ error: "No encontramos esa sección comercial." }, { status: 404 });
    }

    return NextResponse.json({ data: chunk });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
