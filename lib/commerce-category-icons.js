import { TARGET_COMMERCE_CATEGORY_GROUPS, TARGET_COMMERCE_CATEGORY_SEMANTICS } from "./commerce-category-target-catalog.js";

export const COMMERCE_CATEGORY_ICON_FALLBACK = "target_food_main_dishes";
export const COMMERCE_CATEGORY_COLOR_FALLBACK = "#6D28D9";

export const COMMERCE_CATEGORY_COLORS = [
  "#F97316",
  "#EF4444",
  "#8B5CF6",
  "#2563EB",
  "#0EA5E9",
  "#14B8A6",
  "#16A34A",
  "#CA8A04",
  "#A16207",
  "#0F172A",
  "#DB2777",
  "#7C3AED",
];

const DEFAULT_ICON_KEYS = [COMMERCE_CATEGORY_ICON_FALLBACK];

const CATEGORY_SEMANTICS = [
  ...TARGET_COMMERCE_CATEGORY_SEMANTICS,
];

const PRESETS = CATEGORY_SEMANTICS.map(({ iconKey, aliases, verticals }) => ({ iconKey, aliases, verticals }));

const CATEGORY_BY_KEY = CATEGORY_SEMANTICS.reduce((items, item) => {
  items[item.iconKey] = item;
  return items;
}, {});

const ICON_LABELS = CATEGORY_SEMANTICS.reduce((labels, item) => {
  labels[item.iconKey] = item.label;
  return labels;
}, {});

const ICON_GROUPS_BY_VERTICAL = {
  default: [
    group("Generales", DEFAULT_ICON_KEYS),
  ],
};

Object.entries(TARGET_COMMERCE_CATEGORY_GROUPS).forEach(([vertical, targetGroups]) => {
  ICON_GROUPS_BY_VERTICAL[vertical] = targetGroups;
});

const ICON_KEYS_BY_VERTICAL = CATEGORY_SEMANTICS.reduce((groups, item) => {
  item.verticals.forEach((vertical) => {
    if (!groups[vertical]) groups[vertical] = [];
    groups[vertical].push(item.iconKey);
  });
  return groups;
}, { default: DEFAULT_ICON_KEYS });

function group(title, keys) {
  return { title, keys };
}

function uniqueIconKeys(keys = []) {
  return [...new Set(keys.filter(Boolean))];
}

function buildOption(iconKey) {
  return {
    iconKey,
    label: ICON_LABELS[iconKey] || "Icono",
  };
}

function buildContextText(context = {}) {
  if (!context || typeof context !== "object") return normalizeCommerceCategoryIconText(context);
  return normalizeCommerceCategoryIconText([
    context.businessCategory,
    context.businessType,
    context.businessTypeLabel,
    context.activeMode,
    context.module,
    context.subcategory,
    context.variant,
    context.theme,
  ].filter(Boolean).join(" "));
}

const CONTEXT_RULES = [
  {
    intent: "shoes",
    terms: ["shoes", "shoe", "zapatos", "zapato", "calzado", "sandalias", "sandalia", "botas", "bota", "tacones", "tacon"],
    groupOrder: ["Calzado", "Calzado ampliado", "Accesorios de moda", "Moda", "Mas usadas", "Belleza y cuidado", "Especializadas", "Colecciones retail"],
    allowedPrefixes: ["target_shoes_", "target_accessories_", "target_jewelry_", "target_apparel_"],
  },
  {
    intent: "fashion",
    terms: ["fashion", "moda", "ropa", "clothing", "clothing female", "clothing male", "clothing mixed"],
    groupOrder: ["Moda", "Ropa ampliada", "Calzado", "Calzado ampliado", "Accesorios de moda", "Joyeria y accesorios ampliados", "Mas usadas", "Belleza y cuidado", "Especializadas", "Colecciones retail"],
    allowedPrefixes: ["target_apparel_", "target_shoes_", "target_jewelry_", "target_accessories_"],
  },
  {
    intent: "grocery",
    terms: ["grocery", "supermarket", "mercado", "supermercado", "minimercado", "neighborhood store", "tienda de barrio", "viveres"],
    groupOrder: ["Supermercado", "Mas usadas", "Especializadas", "Hogar"],
  },
  {
    intent: "beauty",
    terms: ["beauty", "belleza", "cosmeticos", "cosmetico", "maquillaje", "cuidado personal"],
    groupOrder: ["Belleza y cuidado", "Mas usadas", "Moda", "Especializadas"],
  },
  {
    intent: "tech",
    terms: ["tech", "technology", "tecnologia", "electronica", "celulares", "computadores"],
    groupOrder: ["Tecnologia", "Mas usadas", "Especializadas"],
  },
  {
    intent: "pharmacy",
    terms: ["pharmacy", "farmacia", "drogueria", "salud", "supplements", "suplementos"],
    groupOrder: ["Farmacia y bebe", "Belleza y cuidado", "Mas usadas"],
  },
  {
    intent: "hardware",
    terms: ["hardware", "ferreteria", "herramientas", "construction", "construccion"],
    groupOrder: ["Ferreteria", "Hogar", "Mas usadas"],
  },
  {
    intent: "pet",
    terms: ["pet", "mascotas", "mascota", "petshop"],
    groupOrder: ["Especializadas", "Mas usadas", "Supermercado"],
  },
];

function resolveContextRule(context = {}) {
  const contextText = buildContextText(context);
  if (!contextText) return null;
  return CONTEXT_RULES.find((rule) => rule.terms.some((term) => contextText.includes(normalizeCommerceCategoryIconText(term)))) || null;
}

function orderGroupDefinitions(definitions = [], rule = null) {
  if (!rule?.groupOrder?.length) return definitions;
  const score = (title) => {
    const index = rule.groupOrder.indexOf(title);
    return index === -1 ? 100 : index;
  };
  return [...definitions].sort((left, right) => score(left.title) - score(right.title));
}

function isContextAllowed(iconKey, rule = null) {
  if (!rule?.allowedPrefixes?.length) return true;
  return rule.allowedPrefixes.some((prefix) => iconKey.startsWith(prefix));
}

export function normalizeCommerceCategoryColor(value = "") {
  const cleanValue = String(value || "").trim();
  return /^#([A-Fa-f0-9]{6})$/.test(cleanValue) ? cleanValue.toUpperCase() : COMMERCE_CATEGORY_COLOR_FALLBACK;
}

export function normalizeCommerceCategoryIconKey(value = "") {
  const cleanValue = String(value || "").trim().toLowerCase();
  return ICON_LABELS[cleanValue] ? cleanValue : COMMERCE_CATEGORY_ICON_FALLBACK;
}

export function getCommerceCategoryIconOptions(category = "") {
  const vertical = String(category || "").trim();
  const keys = uniqueIconKeys([
    ...(ICON_KEYS_BY_VERTICAL[vertical] || []),
    ...ICON_KEYS_BY_VERTICAL.default,
  ]);

  return keys.map((iconKey) => ({
    iconKey,
    label: ICON_LABELS[iconKey] || "Icono",
  }));
}

export function getCommerceCategoryIconGroups(category = "", query = "", suggestedIconKey = "", context = {}) {
  const vertical = String(category || "").trim();
  const cleanQuery = normalizeCommerceCategoryIconText(query);
  const contextRule = resolveContextRule({ businessCategory: vertical, ...context });
  const includeAll = Boolean(context?.includeAll);

  if (cleanQuery) {
    const matches = CATEGORY_SEMANTICS
      .filter((item) => isContextAllowed(item.iconKey, contextRule))
      .map((item) => {
        const label = normalizeCommerceCategoryIconText(item.label);
        const aliasMatch = item.aliases.some((alias) => normalizeCommerceCategoryIconText(alias).includes(cleanQuery));
        const labelMatch = label.includes(cleanQuery);
        const verticalScore = vertical && item.verticals.includes(vertical) ? 30 : 0;
        const baseScore = label === cleanQuery ? 100 : labelMatch ? 80 : aliasMatch ? 65 : 0;
        const score = baseScore ? baseScore + verticalScore : 0;
        return { item, score };
      })
      .filter(({ score }) => score > 0)
      .sort((left, right) => right.score - left.score || left.item.label.localeCompare(right.item.label))
      .slice(0, includeAll ? 96 : 48)
      .map(({ item }) => buildOption(item.iconKey));

    return matches.length ? [{ title: "Resultados", options: matches }] : [{ title: "Sin resultados", options: [buildOption(COMMERCE_CATEGORY_ICON_FALLBACK)] }];
  }

  const seen = new Set();
  const groups = [];
  const suggested = normalizeCommerceCategoryIconKey(suggestedIconKey);

  if (suggested && suggested !== COMMERCE_CATEGORY_ICON_FALLBACK && CATEGORY_BY_KEY[suggested]) {
    seen.add(suggested);
    groups.push({ title: "Sugerido", options: [buildOption(suggested)] });
  }

  const definitions = orderGroupDefinitions(ICON_GROUPS_BY_VERTICAL[vertical] || ICON_GROUPS_BY_VERTICAL.default, contextRule);
  definitions.forEach((definition) => {
    const options = definition.keys
      .filter((iconKey) => isContextAllowed(iconKey, contextRule))
      .filter((iconKey) => CATEGORY_BY_KEY[iconKey] && !seen.has(iconKey))
      .map((iconKey) => {
        seen.add(iconKey);
        return buildOption(iconKey);
      });
    if (options.length) groups.push({ title: definition.title, options });
  });

  DEFAULT_ICON_KEYS.forEach((iconKey) => {
    if (!seen.has(iconKey) && CATEGORY_BY_KEY[iconKey]) {
      seen.add(iconKey);
      if (!groups.some((item) => item.title === "Generales")) {
        groups.push({ title: "Generales", options: [] });
      }
      groups.find((item) => item.title === "Generales").options.push(buildOption(iconKey));
    }
  });

  return groups;
}

export function normalizeCommerceCategoryIconText(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const NORMALIZED_KEY_TOKEN_OVERRIDES = {
  accesorios: "accesorio",
  bebidas: "bebida",
  bolsos: "bolso",
  botas: "bota",
  cafes: "cafe",
  camisetas: "camiseta",
  carnes: "carne",
  celulares: "celular",
  computadores: "computador",
  cosmeticos: "cosmetico",
  dulces: "dulce",
  ensaladas: "ensalada",
  gaseosas: "gaseosa",
  hamburguesas: "hamburguesa",
  helados: "helado",
  juguetes: "juguete",
  jugos: "jugo",
  laptops: "laptop",
  mariscos: "marisco",
  maletines: "maletin",
  mochilas: "mochila",
  pastas: "pasta",
  perros: "perro",
  pescados: "pescado",
  pizzas: "pizza",
  platos: "plato",
  promociones: "promocion",
  rapidas: "rapida",
  regalos: "regalo",
  relojes: "reloj",
  servicios: "servicio",
  zapatos: "zapato",
};

function normalizeCommerceCategoryKeyToken(token = "") {
  const normalized = String(token || "").trim();
  if (!normalized) return "";
  if (NORMALIZED_KEY_TOKEN_OVERRIDES[normalized]) return NORMALIZED_KEY_TOKEN_OVERRIDES[normalized];
  if (normalized.length > 3 && normalized.endsWith("s")) return normalized.slice(0, -1);
  return normalized;
}

export function buildCommerceCategoryNormalizedKey(value = "") {
  return normalizeCommerceCategoryIconText(value)
    .split(" ")
    .map(normalizeCommerceCategoryKeyToken)
    .filter(Boolean)
    .join("_");
}

function calculatePresetMatchScore(text, alias, preset, vertical) {
  const normalizedAlias = normalizeCommerceCategoryIconText(alias);
  if (!normalizedAlias) return 0;

  let score = 0;
  if (text === normalizedAlias) {
    score = 100;
  } else if (normalizedAlias.length >= 4 && text.includes(normalizedAlias)) {
    score = 80;
  } else if (normalizedAlias.includes(text) && text.length >= 4) {
    score = 55;
  }

  if (!score) return 0;
  if (vertical && preset.verticals?.includes(vertical)) score += 30;
  if (preset.iconKey?.startsWith("target_")) score += 12;
  return score;
}

export function resolveCommerceCategoryIcon(value = "", category = "") {
  const text = normalizeCommerceCategoryIconText(value);
  const vertical = String(category || "").trim();
  if (!text) {
    return {
      iconKey: COMMERCE_CATEGORY_ICON_FALLBACK,
      iconSource: "fallback",
      iconMatchedAlias: "",
    };
  }

  let bestMatch = null;
  for (const preset of PRESETS) {
    for (const alias of preset.aliases) {
      const score = calculatePresetMatchScore(text, alias, preset, vertical);
      if (score && (!bestMatch || score > bestMatch.score)) {
        bestMatch = {
          score,
          iconKey: preset.iconKey,
          iconMatchedAlias: normalizeCommerceCategoryIconText(alias),
        };
      }
    }
  }

  if (bestMatch) {
    return {
      iconKey: bestMatch.iconKey,
      iconSource: "preset",
      iconMatchedAlias: bestMatch.iconMatchedAlias,
    };
  }

  return {
    iconKey: COMMERCE_CATEGORY_ICON_FALLBACK,
    iconSource: "fallback",
    iconMatchedAlias: "",
  };
}
