import { TARGET_COMMERCE_CATEGORY_ASSETS } from "../lib/commerce-category-target-catalog.js";
import { buildCommerceCategoryNormalizedKey, normalizeCommerceCategoryIconText, resolveCommerceCategoryIcon } from "../lib/commerce-category-icons.js";

const DEMO_ICON_OVERRIDES = {
  "restaurant:comida_rapida": "target_food_burgers",

  "pharmacy:medicamento": "target_health_medicines",
  "pharmacy:primero_auxilio": "target_health_first_aid",
  "pharmacy:cuidado_personal": "target_health_personal_care",
  "pharmacy:bebe": "target_health_baby",
  "pharmacy:bienestar": "target_health_supplements",

  "beauty_products:maquillaje": "target_beauty_makeup",
  "beauty_products:cuidado_facial": "target_beauty_skincare",
  "beauty_products:cabello": "target_beauty_haircare",
  "beauty_products:una": "target_beauty_nails",
  "beauty_products:perfumeria": "target_beauty_perfumes",

  "supermarket:despensa": "target_grocery_pasta_rice",
  "neighborhood_store:despensa": "target_grocery_pasta_rice",

  "hardware:herramienta": "target_hardware_manual_tools",
  "hardware:tornilleria": "target_hardware_fasteners",

  "technology:computacion": "target_tech_computers",
  "technology:hogar_tech": "target_tech_appliances",

  "pet_shop:alimento": "target_pets_dog_food",
  "pet_shop:higiene": "target_pets_hygiene",
  "pet_shop:accesorio": "target_pets_collars",
  "pet_shop:juguete": "target_pets_toys",

  "shoes:accesorio": "target_shoes_accessories",
  "shoes:sandalia": "target_shoes_women_sandals",

  "clothing_mixed:mujer": "target_apparel_dresses",
  "clothing_mixed:hombre": "target_apparel_shirts",
  "clothing_mixed:zapato": "target_shoes_sneakers",
  "clothing_mixed:accesorio": "target_accessories_bags",
  "clothing_mixed:oferta": "target_food_combos",

  "stationery:regalo": "target_stationery_packaging",
  "gifts:accesorio": "target_jewelry_fashion",
  "retail_sales:regalo": "target_stationery_packaging",
};

function normalizeContext(value = "") {
  return normalizeCommerceCategoryIconText(value).replace(/\s+/g, "_");
}

function resolveOverride(name, business = {}) {
  const normalizedKey = buildCommerceCategoryNormalizedKey(name);
  const candidates = [
    `${normalizeContext(business.businessType)}:${normalizedKey}`,
    `${normalizeContext(business.businessCategory)}:${normalizedKey}`,
    normalizedKey,
  ];

  const iconKey = candidates.map((candidate) => DEMO_ICON_OVERRIDES[candidate]).find(Boolean);
  return iconKey && TARGET_COMMERCE_CATEGORY_ASSETS[iconKey] ? { iconKey, matchedKey: normalizedKey } : null;
}

export function resolveDemoCategoryIcon(name = "", business = {}) {
  const normalizedKey = buildCommerceCategoryNormalizedKey(name);
  const override = resolveOverride(name, business);
  if (override) {
    return {
      normalizedKey,
      iconKey: override.iconKey,
      iconSource: "demo-override",
      iconMatchedAlias: override.matchedKey,
    };
  }

  const icon = resolveCommerceCategoryIcon(name, business.businessCategory);
  return {
    normalizedKey,
    iconKey: icon.iconKey,
    iconSource: icon.iconSource,
    iconMatchedAlias: icon.iconMatchedAlias || "",
  };
}
