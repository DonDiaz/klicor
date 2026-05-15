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
const PHARMACY_TYPES = new Set(["pharmacy", "optical", "supplements"]);
const STATIONERY_TYPES = new Set(["stationery", "bookstore"]);
const HARDWARE_TYPES = new Set(["hardware", "paint", "garden"]);
const BEAUTY_STORE_TYPES = new Set(["beauty_products"]);
const PET_STORE_TYPES = new Set(["pet_shop"]);

const RETAIL_THEME_BY_TYPE = {
  pharmacy: "pharmacy_care",
  optical: "pharmacy_care",
  supplements: "pharmacy_care",
  stationery: "stationery_clear",
  bookstore: "stationery_clear",
  hardware: "hardware_practical",
  paint: "hardware_practical",
  garden: "hardware_practical",
  beauty_products: "beauty_soft",
  pet_shop: "pet_store",
  sports: "active_store",
  toys: "playful_store",
  gifts: "gift_store",
  flowers: "flower_store",
  furniture: "home_warm",
  home_goods: "home_warm",
  liquor_store: "liquor_premium",
  auto_parts: "auto_steel",
  motorcycles: "auto_steel",
  appliances: "appliance_clean",
};

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

function resolveStoreGridExperience({ activeMode, businessType, subcategory, theme }) {
  return {
    module: activeMode || "mitienda",
    category: "store",
    subcategory: subcategory || businessType || "general",
    variant: "neutral",
    layout: activeMode === "micatalogo" ? "catalog_feed" : "store_grid",
    theme,
  };
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
      theme: businessType === "pizza" ? "food_pizzeria" : businessType === "healthy_food" ? "food_healthy" : "food_fast",
    };
  }

  if (businessCategory === "retail_sales") {
    if (FASHION_TYPES.has(businessType)) {
      const resolvedVariant = resolveFashionVariant(businessType, variant);
      const isPremiumCatalog = activeMode === "micatalogo" && ["accessories", "jewelry"].includes(businessType);
      return {
        module: activeMode || "mitienda",
        category: "store",
        subcategory: resolveFashionSubtype(businessType),
        variant: resolvedVariant,
        layout: activeMode === "micatalogo" ? "catalog_feed" : "store_grid",
        theme: isPremiumCatalog ? "premium_catalog" : `fashion_${resolvedVariant}`,
      };
    }

    if (GROCERY_TYPES.has(businessType)) {
      return resolveStoreGridExperience({ activeMode, businessType, subcategory: "grocery", theme: "grocery_fresh" });
    }

    if (TECH_TYPES.has(businessType)) {
      return resolveStoreGridExperience({ activeMode, businessType, subcategory: "tech", theme: "tech_blue" });
    }

    if (PHARMACY_TYPES.has(businessType)) {
      return resolveStoreGridExperience({ activeMode, businessType, subcategory: "pharmacy", theme: "pharmacy_care" });
    }

    if (STATIONERY_TYPES.has(businessType)) {
      return resolveStoreGridExperience({ activeMode, businessType, subcategory: "stationery", theme: "stationery_clear" });
    }

    if (HARDWARE_TYPES.has(businessType)) {
      return resolveStoreGridExperience({ activeMode, businessType, subcategory: "hardware", theme: "hardware_practical" });
    }

    if (BEAUTY_STORE_TYPES.has(businessType)) {
      return resolveStoreGridExperience({ activeMode, businessType, subcategory: "beauty", theme: "beauty_soft" });
    }

    if (PET_STORE_TYPES.has(businessType)) {
      return resolveStoreGridExperience({ activeMode, businessType, subcategory: "pet", theme: "pet_store" });
    }

    if (RETAIL_THEME_BY_TYPE[businessType]) {
      return resolveStoreGridExperience({ activeMode, businessType, theme: RETAIL_THEME_BY_TYPE[businessType] });
    }

    return resolveStoreGridExperience({ activeMode, businessType, theme: "general_market" });
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
