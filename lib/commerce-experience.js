import { normalizeBusinessCategory, normalizeBusinessType } from "@/lib/business-categories";
import { normalizeCommerceMode } from "@/lib/commerce-config";

const FOOD_MENU_TYPES = new Set([
  "restaurant",
  "fast_food",
  "pizza",
  "burgers",
  "grill",
  "cafe",
  "bakery",
  "desserts",
  "ice_cream",
  "juice_bar",
  "bar",
  "seafood",
  "healthy_food",
  "breakfast_brunch",
  "buffet",
  "catering",
  "food_truck",
  "street_food",
]);

const FASHION_TYPES = new Set([
  "clothing",
  "clothing_female",
  "clothing_male",
  "clothing_mixed",
  "shoes",
  "shoes_female",
  "shoes_male",
  "shoes_mixed",
  "accessories",
  "jewelry",
]);
const GROCERY_TYPES = new Set(["neighborhood_store", "supermarket", "grocery"]);
const TECH_TYPES = new Set(["technology", "cellphones", "appliances"]);

function resolveFashionSubtype(businessType = "") {
  if (String(businessType || "").startsWith("shoes")) return "shoes";
  if (["accessories", "jewelry"].includes(businessType)) return "accessories";
  return "fashion";
}

function resolveFashionVariant(businessType = "", fallback = "neutral") {
  if (String(businessType || "").endsWith("_female")) return "female";
  if (String(businessType || "").endsWith("_male")) return "male";
  if (String(businessType || "").endsWith("_mixed")) return "mixed";
  return normalizeCommerceVariant(fallback);
}

export function normalizeCommerceVariant(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  return ["female", "male", "mixed", "neutral"].includes(normalized) ? normalized : "neutral";
}

export function resolveCommerceExperience(input = {}, profile = {}) {
  const businessCategory = normalizeBusinessCategory(input.businessCategory || profile.businessCategory);
  const businessType = normalizeBusinessType(input.businessType || profile.businessType || profile.dorikaProfile?.businessType || "", businessCategory);
  const activeMode = normalizeCommerceMode(input.module || input.activeMode || profile.commerceMode || profile.commerce?.activeMode);
  const variant = normalizeCommerceVariant(input.variant || profile.commerce?.experience?.variant || "");

  if (businessCategory === "food_drink" || FOOD_MENU_TYPES.has(businessType)) {
    return {
      module: activeMode || "mimenu",
      category: "food",
      subcategory: businessType || "restaurant",
      variant: "neutral",
      layout: "menu_list",
      theme: businessType === "pizza" ? "food_pizzeria" : businessType === "healthy_food" ? "food_healthy" : "food_warm",
    };
  }

  if (businessCategory === "retail_sales") {
    if (FASHION_TYPES.has(businessType)) {
      const resolvedVariant = resolveFashionVariant(businessType, variant);
      return {
        module: activeMode || "mitienda",
        category: "store",
        subcategory: resolveFashionSubtype(businessType),
        variant: resolvedVariant,
        layout: activeMode === "micatalogo" ? "catalog_feed" : "store_grid",
        theme: `fashion_${resolvedVariant}`,
      };
    }

    if (GROCERY_TYPES.has(businessType)) {
      return {
        module: activeMode || "mitienda",
        category: "store",
        subcategory: "grocery",
        variant: "neutral",
        layout: activeMode === "micatalogo" ? "catalog_feed" : "store_grid",
        theme: "grocery_fresh",
      };
    }

    if (TECH_TYPES.has(businessType)) {
      return {
        module: activeMode || "mitienda",
        category: "store",
        subcategory: "tech",
        variant: "neutral",
        layout: activeMode === "micatalogo" ? "catalog_feed" : "store_grid",
        theme: "tech_blue",
      };
    }

    return {
      module: activeMode || "mitienda",
      category: "store",
      subcategory: businessType || "general",
      variant: "neutral",
      layout: activeMode === "micatalogo" ? "catalog_feed" : "store_grid",
      theme: "general_market",
    };
  }

  if (businessCategory === "health_wellness") {
    return {
      module: activeMode || "micatalogo",
      category: "health",
      subcategory: businessType || "wellness",
      variant: "neutral",
      layout: "catalog_feed",
      theme: "health_soft",
    };
  }

  if (businessCategory === "tourism_experiences") {
    return {
      module: activeMode || "micatalogo",
      category: "tourism",
      subcategory: businessType || "experience",
      variant: "neutral",
      layout: "catalog_feed",
      theme: "tourism_earth",
    };
  }

  return {
    module: activeMode || "micatalogo",
    category: "services",
    subcategory: businessType || "general",
    variant: "neutral",
    layout: "catalog_feed",
    theme: "services_clean",
  };
}
