const PRESETS = [
  {
    id: "klicor",
    name: "Klicor",
    appearance: {
      backgroundStyle: "solid",
      backgroundColor: "#F8FAFC",
      surfaceColor: "#FFFFFF",
      primaryColor: "#5B21B6",
      secondaryColor: "#22D3EE",
      tertiaryColor: "#E9D5FF",
      textPrimaryColor: "#0B1020",
      textSecondaryColor: "#64748B",
      buttonTextColor: "#FFFFFF",
      buttonStyle: "solid",
      buttonRadius: "rounded",
      cardTransparency: "soft",
      cardShadow: "medium",
      socialStyle: "cards",
      fontFamily: "inter",
      nameSize: "m",
      nameWeight: "bold",
      avatarShape: "circle",
    },
  },
  {
    id: "sunrise",
    name: "Amanecer",
    appearance: {
      backgroundStyle: "solid",
      backgroundColor: "#FFF7ED",
      surfaceColor: "#FFF7ED",
      primaryColor: "#F97316",
      textPrimaryColor: "#1C1917",
      textSecondaryColor: "#78716C",
      buttonTextColor: "#FFFFFF",
      buttonStyle: "solid",
      buttonRadius: "rounded",
      cardTransparency: "soft",
      cardShadow: "soft",
      socialStyle: "cards",
      fontFamily: "inter",
      nameSize: "m",
      nameWeight: "bold",
      avatarShape: "circle",
    },
  },
  {
    id: "ocean",
    name: "Océano",
    appearance: {
      backgroundStyle: "solid",
      backgroundColor: "#ECFEFF",
      surfaceColor: "#ECFEFF",
      primaryColor: "#0F766E",
      textPrimaryColor: "#0F172A",
      textSecondaryColor: "#475569",
      buttonTextColor: "#ECFEFF",
      buttonStyle: "solid",
      buttonRadius: "rounded",
      cardTransparency: "soft",
      cardShadow: "soft",
      socialStyle: "cards",
      fontFamily: "inter",
      nameSize: "m",
      nameWeight: "regular",
      avatarShape: "rounded",
    },
  },
  {
    id: "berry",
    name: "Berry",
    appearance: {
      backgroundStyle: "solid",
      backgroundColor: "#FFF1F2",
      surfaceColor: "#FFF1F2",
      primaryColor: "#BE185D",
      textPrimaryColor: "#3F0D22",
      textSecondaryColor: "#9D174D",
      buttonTextColor: "#FFF1F2",
      buttonStyle: "solid",
      buttonRadius: "rounded",
      cardTransparency: "soft",
      cardShadow: "soft",
      socialStyle: "cards",
      fontFamily: "inter",
      nameSize: "m",
      nameWeight: "bold",
      avatarShape: "circle",
    },
  },
  {
    id: "night",
    name: "Noche",
    appearance: {
      backgroundStyle: "solid",
      backgroundColor: "#111827",
      surfaceColor: "#111827",
      primaryColor: "#6366F1",
      textPrimaryColor: "#F9FAFB",
      textSecondaryColor: "#CBD5E1",
      buttonTextColor: "#FFFFFF",
      buttonStyle: "solid",
      buttonRadius: "rounded",
      cardTransparency: "solid",
      cardShadow: "medium",
      socialStyle: "cards",
      fontFamily: "inter",
      nameSize: "m",
      nameWeight: "bold",
      avatarShape: "rounded",
    },
  },
  {
    id: "forest",
    name: "Bosque",
    appearance: {
      backgroundStyle: "solid",
      backgroundColor: "#F0FDF4",
      surfaceColor: "#F0FDF4",
      primaryColor: "#166534",
      textPrimaryColor: "#14532D",
      textSecondaryColor: "#15803D",
      buttonTextColor: "#F0FDF4",
      buttonStyle: "solid",
      buttonRadius: "rounded",
      cardTransparency: "soft",
      cardShadow: "soft",
      socialStyle: "cards",
      fontFamily: "inter",
      nameSize: "m",
      nameWeight: "bold",
      avatarShape: "circle",
    },
  },
  {
    id: "gold",
    name: "Oro",
    appearance: {
      backgroundStyle: "solid",
      backgroundColor: "#FEFCE8",
      surfaceColor: "#FEFCE8",
      primaryColor: "#CA8A04",
      textPrimaryColor: "#713F12",
      textSecondaryColor: "#A16207",
      buttonTextColor: "#FFF7ED",
      buttonStyle: "solid",
      buttonRadius: "rounded",
      cardTransparency: "soft",
      cardShadow: "soft",
      socialStyle: "cards",
      fontFamily: "inter",
      nameSize: "m",
      nameWeight: "bold",
      avatarShape: "rounded",
    },
  },
  {
    id: "coral",
    name: "Coral",
    appearance: {
      backgroundStyle: "solid",
      backgroundColor: "#FFF7ED",
      surfaceColor: "#FFF7ED",
      primaryColor: "#EA580C",
      textPrimaryColor: "#7C2D12",
      textSecondaryColor: "#C2410C",
      buttonTextColor: "#FFF7ED",
      buttonStyle: "solid",
      buttonRadius: "rounded",
      cardTransparency: "soft",
      cardShadow: "soft",
      socialStyle: "cards",
      fontFamily: "inter",
      nameSize: "m",
      nameWeight: "bold",
      avatarShape: "rounded",
    },
  },
  {
    id: "midnight",
    name: "Medianoche",
    appearance: {
      backgroundStyle: "solid",
      backgroundColor: "#020617",
      surfaceColor: "#020617",
      primaryColor: "#1E293B",
      secondaryColor: "#38BDF8",
      tertiaryColor: "#1E293B",
      textPrimaryColor: "#E2E8F0",
      textSecondaryColor: "#94A3B8",
      buttonTextColor: "#F8FAFC",
      buttonStyle: "solid",
      buttonRadius: "rounded",
      cardTransparency: "solid",
      cardShadow: "medium",
      socialStyle: "cards",
      fontFamily: "inter",
      nameSize: "m",
      nameWeight: "bold",
      avatarShape: "circle",
    },
  },
  {
    id: "lavender",
    name: "Lavanda",
    appearance: {
      backgroundStyle: "solid",
      backgroundColor: "#F5F3FF",
      surfaceColor: "#F5F3FF",
      primaryColor: "#7C3AED",
      textPrimaryColor: "#312E81",
      textSecondaryColor: "#6D28D9",
      buttonTextColor: "#FFFFFF",
      buttonStyle: "solid",
      buttonRadius: "rounded",
      cardTransparency: "soft",
      cardShadow: "soft",
      socialStyle: "cards",
      fontFamily: "inter",
      nameSize: "m",
      nameWeight: "bold",
      avatarShape: "circle",
    },
  },
  {
    id: "cielo",
    name: "Cielo",
    appearance: {
      backgroundStyle: "solid",
      backgroundColor: "#EFF6FF",
      surfaceColor: "#EFF6FF",
      primaryColor: "#2563EB",
      textPrimaryColor: "#1E3A8A",
      textSecondaryColor: "#3B82F6",
      buttonTextColor: "#FFFFFF",
      buttonStyle: "solid",
      buttonRadius: "rounded",
      cardTransparency: "soft",
      cardShadow: "soft",
      socialStyle: "cards",
      fontFamily: "inter",
      nameSize: "m",
      nameWeight: "regular",
      avatarShape: "rounded",
    },
  },
  {
    id: "menta",
    name: "Menta",
    appearance: {
      backgroundStyle: "solid",
      backgroundColor: "#ECFDF5",
      surfaceColor: "#ECFDF5",
      primaryColor: "#059669",
      textPrimaryColor: "#064E3B",
      textSecondaryColor: "#10B981",
      buttonTextColor: "#F0FDF4",
      buttonStyle: "solid",
      buttonRadius: "rounded",
      cardTransparency: "soft",
      cardShadow: "soft",
      socialStyle: "cards",
      fontFamily: "inter",
      nameSize: "m",
      nameWeight: "regular",
      avatarShape: "circle",
    },
  },
  {
    id: "arena",
    name: "Arena",
    appearance: {
      backgroundStyle: "solid",
      backgroundColor: "#FFFBEB",
      surfaceColor: "#FFFBEB",
      primaryColor: "#D97706",
      textPrimaryColor: "#78350F",
      textSecondaryColor: "#B45309",
      buttonTextColor: "#FFFBEB",
      buttonStyle: "solid",
      buttonRadius: "rounded",
      cardTransparency: "soft",
      cardShadow: "soft",
      socialStyle: "cards",
      fontFamily: "inter",
      nameSize: "m",
      nameWeight: "bold",
      avatarShape: "rounded",
    },
  },
  {
    id: "ruby",
    name: "Rubi",
    appearance: {
      backgroundStyle: "solid",
      backgroundColor: "#FFF1F2",
      surfaceColor: "#FFF1F2",
      primaryColor: "#DC2626",
      textPrimaryColor: "#7F1D1D",
      textSecondaryColor: "#EF4444",
      buttonTextColor: "#FFFFFF",
      buttonStyle: "solid",
      buttonRadius: "rounded",
      cardTransparency: "soft",
      cardShadow: "soft",
      socialStyle: "cards",
      fontFamily: "inter",
      nameSize: "m",
      nameWeight: "bold",
      avatarShape: "circle",
    },
  },
  {
    id: "graphite",
    name: "Grafito",
    appearance: {
      backgroundStyle: "solid",
      backgroundColor: "#F8FAFC",
      surfaceColor: "#FFFFFF",
      primaryColor: "#334155",
      textPrimaryColor: "#0F172A",
      textSecondaryColor: "#64748B",
      buttonTextColor: "#FFFFFF",
      buttonStyle: "solid",
      buttonRadius: "square",
      cardTransparency: "solid",
      cardShadow: "soft",
      socialStyle: "cards",
      fontFamily: "inter",
      nameSize: "m",
      nameWeight: "bold",
      avatarShape: "rounded",
    },
  },
  {
    id: "plum",
    name: "Ciruela",
    appearance: {
      backgroundStyle: "solid",
      backgroundColor: "#FAF5FF",
      surfaceColor: "#FAF5FF",
      primaryColor: "#9333EA",
      textPrimaryColor: "#581C87",
      textSecondaryColor: "#A855F7",
      buttonTextColor: "#FFFFFF",
      buttonStyle: "solid",
      buttonRadius: "rounded",
      cardTransparency: "soft",
      cardShadow: "soft",
      socialStyle: "cards",
      fontFamily: "inter",
      nameSize: "m",
      nameWeight: "bold",
      avatarShape: "soft-square",
    },
  },
  {
    id: "lagoon",
    name: "Laguna",
    appearance: {
      backgroundStyle: "gradient",
      backgroundColor: "#E0F2FE",
      surfaceColor: "#F0FDFF",
      primaryColor: "#0891B2",
      textPrimaryColor: "#164E63",
      textSecondaryColor: "#0EA5E9",
      buttonTextColor: "#ECFEFF",
      buttonStyle: "solid",
      buttonRadius: "rounded",
      cardTransparency: "soft",
      cardShadow: "soft",
      socialStyle: "cards",
      fontFamily: "inter",
      nameSize: "m",
      nameWeight: "regular",
      avatarShape: "rounded",
    },
  },
  {
    id: "rose-night",
    name: "Rosa nocturno",
    appearance: {
      backgroundStyle: "solid",
      backgroundColor: "#18181B",
      surfaceColor: "#27272A",
      primaryColor: "#F43F5E",
      textPrimaryColor: "#FAFAFA",
      textSecondaryColor: "#FDB4C0",
      buttonTextColor: "#FFFFFF",
      buttonStyle: "solid",
      buttonRadius: "rounded",
      cardTransparency: "solid",
      cardShadow: "medium",
      socialStyle: "cards",
      fontFamily: "inter",
      nameSize: "m",
      nameWeight: "bold",
      avatarShape: "circle",
    },
  },
];

export const APPEARANCE_PRESETS = PRESETS;
export const APPEARANCE_PRESET_MAP = Object.fromEntries(PRESETS.map((preset) => [preset.id, preset]));

function unique(values) {
  return [...new Set(values)];
}

export const APPEARANCE_SWATCHES = {
  primaryColor: unique(PRESETS.map((preset) => preset.appearance.primaryColor)),
  secondaryColor: unique(PRESETS.map((preset) => preset.appearance.secondaryColor).filter(Boolean)),
  tertiaryColor: unique(PRESETS.map((preset) => preset.appearance.tertiaryColor).filter(Boolean)),
  backgroundColor: unique(PRESETS.map((preset) => preset.appearance.backgroundColor)),
  surfaceColor: unique(PRESETS.map((preset) => preset.appearance.surfaceColor)),
  textPrimaryColor: unique(PRESETS.map((preset) => preset.appearance.textPrimaryColor)),
  textSecondaryColor: unique(PRESETS.map((preset) => preset.appearance.textSecondaryColor)),
  buttonTextColor: unique(PRESETS.map((preset) => preset.appearance.buttonTextColor)),
};

export const APPEARANCE_DEFAULTS = {
  presetId: "klicor",
  advancedEnabled: false,
  ...APPEARANCE_PRESET_MAP.klicor.appearance,
};

export const APPEARANCE_FONT_OPTIONS = [
  { value: "inter", label: "Inter" },
  { value: "manrope", label: "Manrope" },
  { value: "dm-sans", label: "DM Sans" },
  { value: "poppins", label: "Poppins" },
  { value: "outfit", label: "Outfit" },
  { value: "plus-jakarta-sans", label: "Plus Jakarta Sans" },
  { value: "space-grotesk", label: "Space Grotesk" },
  { value: "sora", label: "Sora" },
  { value: "nunito", label: "Nunito" },
  { value: "rubik", label: "Rubik" },
  { value: "lora", label: "Lora" },
  { value: "merriweather", label: "Merriweather" },
  { value: "playfair-display", label: "Playfair Display" },
  { value: "cormorant-garamond", label: "Cormorant Garamond" },
  { value: "fraunces", label: "Fraunces" },
  { value: "bitter", label: "Bitter" },
  { value: "oswald", label: "Oswald" },
  { value: "bebas-neue", label: "Bebas Neue" },
  { value: "barlow-condensed", label: "Barlow Condensed" },
  { value: "roboto-slab", label: "Roboto Slab" },
];

export const APPEARANCE_FONT_VALUES = APPEARANCE_FONT_OPTIONS.map((option) => option.value);

const LEGACY_FONT_FAMILY_MAP = {
  modern: "inter",
  friendly: "nunito",
  editorial: "playfair-display",
  strong: "space-grotesk",
};

export const SOCIAL_STYLE_OPTIONS = [
  { value: "cards", label: "Tarjetas" },
  { value: "brand-circles", label: "Círculos" },
];

function clampHex(value, fallback) {
  return /^#([A-Fa-f0-9]{6})$/.test(String(value || "")) ? value : fallback;
}

function clampEnum(value, options, fallback) {
  return options.includes(value) ? value : fallback;
}

function sanitizeThemeId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function channelFromHexPair(pair) {
  return Number.parseInt(pair, 16);
}

function parseHex(hex) {
  const safe = clampHex(hex, "#000000").replace("#", "");
  return {
    r: channelFromHexPair(safe.slice(0, 2)),
    g: channelFromHexPair(safe.slice(2, 4)),
    b: channelFromHexPair(safe.slice(4, 6)),
  };
}

function relativeLuminance(hex) {
  const { r, g, b } = parseHex(hex);
  const normalize = (channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const red = normalize(r);
  const green = normalize(g);
  const blue = normalize(b);
  return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
}

function clampChannel(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function toHex(value) {
  return clampChannel(value).toString(16).padStart(2, "0").toUpperCase();
}

function mixHex(hexA, hexB, weight = 0.5) {
  const left = parseHex(hexA);
  const right = parseHex(hexB);
  const ratio = Math.max(0, Math.min(1, weight));

  return `#${toHex((left.r * (1 - ratio)) + (right.r * ratio))}${toHex((left.g * (1 - ratio)) + (right.g * ratio))}${toHex((left.b * (1 - ratio)) + (right.b * ratio))}`;
}

export function getContrastRatio(hexA, hexB) {
  const lumA = relativeLuminance(hexA);
  const lumB = relativeLuminance(hexB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

export function hexToRgba(hex, alpha) {
  const { r, g, b } = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function normalizeAppearance(input = {}) {
  const safePresetId = sanitizeThemeId(input?.presetId) || APPEARANCE_DEFAULTS.presetId;
  const preset = APPEARANCE_PRESET_MAP[safePresetId]?.appearance || APPEARANCE_DEFAULTS;
  const legacyPrimary = input?.primaryColor || input?.accent;
  const legacySurface = input?.surfaceColor || input?.surface;
  const legacyTextPrimary = input?.textPrimaryColor || input?.titleText || input?.text;
  const legacyTextSecondary = input?.textSecondaryColor || input?.text || preset.textSecondaryColor;
  const legacyButtonText = input?.buttonTextColor || input?.buttonText;
  const legacyFontFamily = LEGACY_FONT_FAMILY_MAP[input?.fontFamily] || input?.fontFamily;
  const primaryColor = clampHex(legacyPrimary, preset.primaryColor);
  const surfaceColor = clampHex(legacySurface, preset.surfaceColor);
  const secondaryColor = clampHex(input?.secondaryColor, preset.secondaryColor || mixHex(primaryColor, "#FFFFFF", 0.38));
  const tertiaryColor = clampHex(input?.tertiaryColor, preset.tertiaryColor || mixHex(surfaceColor, primaryColor, 0.18));

  return {
    presetId: safePresetId,
    advancedEnabled: Boolean(input?.advancedEnabled),
    backgroundStyle: clampEnum(input?.backgroundStyle, ["solid", "gradient"], preset.backgroundStyle),
    backgroundColor: clampHex(input?.backgroundColor, preset.backgroundColor),
    surfaceColor,
    primaryColor,
    secondaryColor,
    tertiaryColor,
    textPrimaryColor: clampHex(legacyTextPrimary, preset.textPrimaryColor),
    textSecondaryColor: clampHex(legacyTextSecondary, preset.textSecondaryColor),
    buttonTextColor: clampHex(legacyButtonText, preset.buttonTextColor),
    buttonStyle: clampEnum(input?.buttonStyle, ["solid", "outline", "soft"], preset.buttonStyle),
    buttonRadius: clampEnum(input?.buttonRadius, ["rounded", "square"], preset.buttonRadius),
    cardTransparency: clampEnum(input?.cardTransparency, ["solid", "soft"], preset.cardTransparency),
    cardShadow: clampEnum(input?.cardShadow, ["none", "soft", "medium"], preset.cardShadow),
    socialStyle: clampEnum(input?.socialStyle, ["cards", "brand-circles"], preset.socialStyle || APPEARANCE_DEFAULTS.socialStyle),
    fontFamily: clampEnum(legacyFontFamily, APPEARANCE_FONT_VALUES, preset.fontFamily || APPEARANCE_DEFAULTS.fontFamily),
    nameSize: clampEnum(input?.nameSize, ["s", "m", "l"], preset.nameSize),
    nameWeight: clampEnum(input?.nameWeight, ["regular", "bold"], preset.nameWeight),
    avatarShape: clampEnum(input?.avatarShape, ["circle", "rounded", "soft-square"], preset.avatarShape),
  };
}

export function normalizeCustomThemes(input = []) {
  if (!Array.isArray(input)) return [];

  return input
    .map((item, index) => {
      const id = sanitizeThemeId(item?.id) || `custom-theme-${index + 1}`;
      const name = String(item?.name || "").trim() || `Tema ${index + 1}`;
      return {
        id,
        name,
        appearance: normalizeAppearance({
          ...item?.appearance,
          presetId: id,
          advancedEnabled: false,
        }),
      };
    })
    .filter((item, index, collection) => collection.findIndex((candidate) => candidate.id === item.id) === index)
    .slice(0, 6);
}

export function getAppearanceWarnings(appearance) {
  const next = normalizeAppearance(appearance);
  const checks = [
    {
      key: "surface-primary",
      ratio: getContrastRatio(next.surfaceColor, next.textPrimaryColor),
      min: 4.5,
      message: "El texto principal pierde legibilidad sobre la tarjeta.",
    },
    {
      key: "background-primary",
      ratio: getContrastRatio(next.backgroundColor, next.textPrimaryColor),
      min: 4.5,
      message: "El texto principal pierde legibilidad sobre el fondo.",
    },
  ];

  return checks.filter((check) => check.ratio < check.min);
}

export function getAppearanceSuggestions(appearance) {
  const next = normalizeAppearance(appearance);
  const checks = [
    {
      key: "button",
      ratio: getContrastRatio(next.primaryColor, next.buttonTextColor),
      min: 4.5,
      message: "Sugerencia: el contraste entre el boton y su texto podria mejorarse.",
    },
  ];

  return checks.filter((check) => check.ratio < check.min);
}

