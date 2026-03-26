const PRESETS = [
  {
    id: "linka-purple",
    name: "Morado",
    appearance: {
      backgroundStyle: "solid",
      backgroundColor: "#F8FAFC",
      surfaceColor: "#FFFFFF",
      primaryColor: "#5B21B6",
      textPrimaryColor: "#0B1020",
      textSecondaryColor: "#64748B",
      buttonTextColor: "#FFFFFF",
      buttonStyle: "solid",
      buttonRadius: "rounded",
      cardTransparency: "solid",
      cardShadow: "soft",
      nameSize: "m",
      nameWeight: "bold",
      avatarShape: "circle",
    },
  },
  {
    id: "dark-elegant",
    name: "Oscuro elegante",
    appearance: {
      backgroundStyle: "solid",
      backgroundColor: "#0F172A",
      surfaceColor: "#111827",
      primaryColor: "#5B21B6",
      textPrimaryColor: "#E5E7EB",
      textSecondaryColor: "#94A3B8",
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
    id: "light-minimal",
    name: "Claro minimalista",
    appearance: {
      backgroundStyle: "solid",
      backgroundColor: "#F8FAFC",
      surfaceColor: "#FFFFFF",
      primaryColor: "#0F172A",
      textPrimaryColor: "#0B1020",
      textSecondaryColor: "#64748B",
      buttonTextColor: "#FFFFFF",
      buttonStyle: "solid",
      buttonRadius: "square",
      cardTransparency: "solid",
      cardShadow: "none",
      nameSize: "m",
      nameWeight: "regular",
      avatarShape: "circle",
    },
  },
  {
    id: "modern-blue",
    name: "Azul moderno",
    appearance: {
      backgroundStyle: "solid",
      backgroundColor: "#EFF6FF",
      surfaceColor: "#FFFFFF",
      primaryColor: "#2563EB",
      textPrimaryColor: "#0F172A",
      textSecondaryColor: "#64748B",
      buttonTextColor: "#FFFFFF",
      buttonStyle: "solid",
      buttonRadius: "rounded",
      cardTransparency: "solid",
      cardShadow: "soft",
      nameSize: "m",
      nameWeight: "bold",
      avatarShape: "rounded",
    },
  },
  {
    id: "soft-green",
    name: "Verde suave",
    appearance: {
      backgroundStyle: "solid",
      backgroundColor: "#F0FDF4",
      surfaceColor: "#FFFFFF",
      primaryColor: "#16A34A",
      textPrimaryColor: "#14532D",
      textSecondaryColor: "#4B5563",
      buttonTextColor: "#FFFFFF",
      buttonStyle: "soft",
      buttonRadius: "rounded",
      cardTransparency: "solid",
      cardShadow: "soft",
      nameSize: "m",
      nameWeight: "bold",
      avatarShape: "circle",
    },
  },
  {
    id: "warm-coral",
    name: "Coral cálido",
    appearance: {
      backgroundStyle: "solid",
      backgroundColor: "#FFF7ED",
      surfaceColor: "#FFFFFF",
      primaryColor: "#EA580C",
      textPrimaryColor: "#7C2D12",
      textSecondaryColor: "#9A3412",
      buttonTextColor: "#FFFFFF",
      buttonStyle: "solid",
      buttonRadius: "rounded",
      cardTransparency: "solid",
      cardShadow: "soft",
      nameSize: "m",
      nameWeight: "bold",
      avatarShape: "rounded",
    },
  },
  {
    id: "gradient-linka",
    name: "Gradiente morado-cian",
    appearance: {
      backgroundStyle: "gradient",
      backgroundColor: "#F8FAFC",
      surfaceColor: "#FFFFFF",
      primaryColor: "#5B21B6",
      textPrimaryColor: "#0B1020",
      textSecondaryColor: "#64748B",
      buttonTextColor: "#FFFFFF",
      buttonStyle: "solid",
      buttonRadius: "rounded",
      cardTransparency: "soft",
      cardShadow: "medium",
      nameSize: "m",
      nameWeight: "bold",
      avatarShape: "circle",
    },
  },
  {
    id: "premium-black",
    name: "Negro premium",
    appearance: {
      backgroundStyle: "solid",
      backgroundColor: "#020617",
      surfaceColor: "#0F172A",
      primaryColor: "#5B21B6",
      textPrimaryColor: "#F8FAFC",
      textSecondaryColor: "#94A3B8",
      buttonTextColor: "#FFFFFF",
      buttonStyle: "outline",
      buttonRadius: "square",
      cardTransparency: "solid",
      cardShadow: "medium",
      nameSize: "l",
      nameWeight: "bold",
      avatarShape: "soft-square",
    },
  },
];

export const APPEARANCE_PRESETS = PRESETS;
export const APPEARANCE_PRESET_MAP = Object.fromEntries(PRESETS.map((preset) => [preset.id, preset]));

export const APPEARANCE_SWATCHES = {
  primaryColor: ["#5B21B6", "#6D28D9", "#2563EB", "#16A34A", "#EA580C", "#0F172A", "#111827", "#7C3AED"],
  backgroundColor: ["#F8FAFC", "#FFFFFF", "#F1F5F9", "#EFF6FF", "#F0FDF4", "#FFF7ED", "#0F172A", "#020617"],
  surfaceColor: ["#FFFFFF", "#F8FAFC", "#F1F5F9", "#EEF2FF", "#ECFEFF", "#111827", "#0F172A", "#1E293B"],
  textPrimaryColor: ["#0B1020", "#1E293B", "#334155", "#14532D", "#7C2D12", "#E5E7EB", "#F8FAFC"],
  textSecondaryColor: ["#64748B", "#475569", "#94A3B8", "#9CA3AF", "#CBD5E1", "#9A3412"],
  buttonTextColor: ["#FFFFFF", "#F8FAFC", "#E5E7EB", "#0B1020", "#1E293B"],
};

export const APPEARANCE_DEFAULTS = {
  presetId: "linka-purple",
  advancedEnabled: false,
  ...APPEARANCE_PRESET_MAP["linka-purple"].appearance,
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
