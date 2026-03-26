const PRESETS = [
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
      primaryColor: "#0F172A",
      textPrimaryColor: "#E2E8F0",
      textSecondaryColor: "#94A3B8",
      buttonTextColor: "#F8FAFC",
      buttonStyle: "solid",
      buttonRadius: "rounded",
      cardTransparency: "solid",
      cardShadow: "medium",
      nameSize: "m",
      nameWeight: "bold",
      avatarShape: "circle",
    },
  },
];

export const APPEARANCE_PRESETS = PRESETS;
export const APPEARANCE_PRESET_MAP = Object.fromEntries(PRESETS.map((preset) => [preset.id, preset]));

export const APPEARANCE_SWATCHES = {
  primaryColor: ["#F97316", "#0F766E", "#BE185D", "#6366F1", "#166534", "#CA8A04", "#EA580C", "#0F172A"],
  backgroundColor: ["#FFF7ED", "#ECFEFF", "#FFF1F2", "#111827", "#F0FDF4", "#FEFCE8", "#020617", "#FFFFFF"],
  surfaceColor: ["#FFF7ED", "#ECFEFF", "#FFF1F2", "#111827", "#F0FDF4", "#FEFCE8", "#020617", "#FFFFFF"],
  textPrimaryColor: ["#1C1917", "#0F172A", "#3F0D22", "#F9FAFB", "#14532D", "#713F12", "#7C2D12", "#E2E8F0"],
  textSecondaryColor: ["#78716C", "#475569", "#9D174D", "#CBD5E1", "#15803D", "#A16207", "#C2410C", "#94A3B8"],
  buttonTextColor: ["#FFFFFF", "#ECFEFF", "#FFF1F2", "#F0FDF4", "#FFF7ED", "#F8FAFC", "#E2E8F0", "#0F172A"],
};

export const APPEARANCE_DEFAULTS = {
  presetId: "sunrise",
  advancedEnabled: false,
  ...APPEARANCE_PRESET_MAP.sunrise.appearance,
};

function clampHex(value, fallback) {
  return /^#([A-Fa-f0-9]{6})$/.test(String(value || "")) ? value : fallback;
}

function clampEnum(value, options, fallback) {
  return options.includes(value) ? value : fallback;
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
  const presetId = APPEARANCE_PRESET_MAP[input?.presetId] ? input.presetId : APPEARANCE_DEFAULTS.presetId;
  const preset = APPEARANCE_PRESET_MAP[presetId]?.appearance || APPEARANCE_DEFAULTS;
  const legacyPrimary = input?.primaryColor || input?.accent;
  const legacySurface = input?.surfaceColor || input?.surface;
  const legacyTextPrimary = input?.textPrimaryColor || input?.titleText || input?.text;
  const legacyTextSecondary = input?.textSecondaryColor || input?.text || preset.textSecondaryColor;
  const legacyButtonText = input?.buttonTextColor || input?.buttonText;

  return {
    presetId,
    advancedEnabled: Boolean(input?.advancedEnabled),
    backgroundStyle: clampEnum(input?.backgroundStyle, ["solid", "gradient"], preset.backgroundStyle),
    backgroundColor: clampHex(input?.backgroundColor, preset.backgroundColor),
    surfaceColor: clampHex(legacySurface, preset.surfaceColor),
    primaryColor: clampHex(legacyPrimary, preset.primaryColor),
    textPrimaryColor: clampHex(legacyTextPrimary, preset.textPrimaryColor),
    textSecondaryColor: clampHex(legacyTextSecondary, preset.textSecondaryColor),
    buttonTextColor: clampHex(legacyButtonText, preset.buttonTextColor),
    buttonStyle: clampEnum(input?.buttonStyle, ["solid", "outline", "soft"], preset.buttonStyle),
    buttonRadius: clampEnum(input?.buttonRadius, ["rounded", "square"], preset.buttonRadius),
    cardTransparency: clampEnum(input?.cardTransparency, ["solid", "soft"], preset.cardTransparency),
    cardShadow: clampEnum(input?.cardShadow, ["none", "soft", "medium"], preset.cardShadow),
    nameSize: clampEnum(input?.nameSize, ["s", "m", "l"], preset.nameSize),
    nameWeight: clampEnum(input?.nameWeight, ["regular", "bold"], preset.nameWeight),
    avatarShape: clampEnum(input?.avatarShape, ["circle", "rounded", "soft-square"], preset.avatarShape),
  };
}

export function getAppearanceWarnings(appearance) {
  const next = normalizeAppearance(appearance);
  const checks = [
    {
      key: "button",
      ratio: getContrastRatio(next.primaryColor, next.buttonTextColor),
      min: 4.5,
      message: "El contraste entre el botón y su texto es muy bajo.",
    },
    {
      key: "surface-primary",
      ratio: getContrastRatio(next.surfaceColor, next.textPrimaryColor),
      min: 4.5,
      message: "El texto principal pierde legibilidad sobre la tarjeta.",
    },
    {
      key: "surface-secondary",
      ratio: getContrastRatio(next.surfaceColor, next.textSecondaryColor),
      min: 3,
      message: "El texto secundario pierde legibilidad sobre la tarjeta.",
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
