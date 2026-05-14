import { TARGET_COMMERCE_CATEGORY_ASSETS } from "./commerce-category-target-catalog.js";

export const COMMERCE_CATEGORY_ASSET_FALLBACK = "target_food_main_dishes";

const VERTICAL_FALLBACKS = {
  food_drink: "target_food_main_dishes",
  retail_sales: "target_grocery_fruits",
  services: "target_services_design_marketing",
  health_wellness: "target_services_health",
  tourism_experiences: "target_tourism_tours",
};

export function resolveCommerceCategoryAsset(iconKey = "", vertical = "") {
  const cleanKey = String(iconKey || "").trim().toLowerCase();
  const hyphenKey = cleanKey.replace(/_/g, "-");
  const fallbackKey = VERTICAL_FALLBACKS[String(vertical || "").trim()] || COMMERCE_CATEGORY_ASSET_FALLBACK;
  const resolvedKey = TARGET_COMMERCE_CATEGORY_ASSETS[cleanKey]
    ? cleanKey
    : TARGET_COMMERCE_CATEGORY_ASSETS[hyphenKey]
      ? hyphenKey
      : fallbackKey;
  const assetValue = TARGET_COMMERCE_CATEGORY_ASSETS[resolvedKey] || TARGET_COMMERCE_CATEGORY_ASSETS[COMMERCE_CATEGORY_ASSET_FALLBACK];

  return {
    key: resolvedKey,
    ...assetValue,
  };
}
