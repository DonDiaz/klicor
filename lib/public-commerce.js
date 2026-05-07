import { unstable_cache } from "next/cache";
import { normalizeCommerceMode } from "@/lib/commerce-config";
import { getPublicCommerceBootstrap, getPublicCommerceChunk, getPublicCommerceProductDeepLink } from "@/lib/commerce-firestore";
import { getUserByUsername } from "@/lib/firestore";
import { sanitizeSlug } from "@/lib/utils";

export async function getPublicCommerceBootstrapByUsername(username, mode) {
  const slug = sanitizeSlug(username);
  const normalizedMode = normalizeCommerceMode(mode);
  if (!slug || slug.length > 30 || !normalizedMode) return null;

  return unstable_cache(
    async () => {
      const owner = await getUserByUsername(slug);
      if (!owner) return null;
      const data = await getPublicCommerceBootstrap(owner);
      if (!data || data.mode !== normalizedMode) return null;
      return data;
    },
    ["public-commerce-bootstrap", slug, normalizedMode],
    {
      tags: [`public-commerce:${slug}`, `public-commerce:${slug}:${normalizedMode}`],
      revalidate: 300,
    },
  )();
}

export async function getPublicCommerceChunkByUsername(username, mode, selection = {}) {
  const slug = sanitizeSlug(username);
  const normalizedMode = normalizeCommerceMode(mode);
  if (!slug || slug.length > 30 || !normalizedMode) return null;

  const categoryId = String(selection.categoryId || "").trim();
  const subcategoryId = String(selection.subcategoryId || "").trim();
  const after = String(selection.after || "").trim();
  const includeSubcategories = selection.includeSubcategories !== false;

  if (categoryId.length > 120 || subcategoryId.length > 120 || after.length > 120) {
    return null;
  }

  return unstable_cache(
    async () => {
      const owner = await getUserByUsername(slug);
      if (!owner) return null;
      const activeMode = normalizeCommerceMode(owner.commerceMode || owner.commerce?.activeMode);
      if (activeMode !== normalizedMode) return null;
      return getPublicCommerceChunk(owner.uid, { categoryId, subcategoryId, after, includeSubcategories });
    },
    ["public-commerce-chunk", slug, normalizedMode, categoryId, subcategoryId, after, includeSubcategories ? "with-subcategories" : "products-only"],
    {
      tags: [`public-commerce:${slug}`, `public-commerce:${slug}:${normalizedMode}`],
      revalidate: 300,
    },
  )();
}

export async function getPublicCommerceProductDeepLinkByUsername(username, mode, productId = "") {
  const slug = sanitizeSlug(username);
  const normalizedMode = normalizeCommerceMode(mode);
  const cleanProductId = String(productId || "").trim();
  if (!slug || slug.length > 30 || !normalizedMode || !cleanProductId || cleanProductId.length > 120) return null;

  return unstable_cache(
    async () => {
      const owner = await getUserByUsername(slug);
      if (!owner) return null;
      const activeMode = normalizeCommerceMode(owner.commerceMode || owner.commerce?.activeMode);
      if (activeMode !== normalizedMode) return null;
      return getPublicCommerceProductDeepLink(owner, { productId: cleanProductId, mode: normalizedMode });
    },
    ["public-commerce-product-deeplink", slug, normalizedMode, cleanProductId],
    {
      tags: [`public-commerce:${slug}`, `public-commerce:${slug}:${normalizedMode}`],
      revalidate: 300,
    },
  )();
}
