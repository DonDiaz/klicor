import { normalizeAppearance } from "@/lib/theme-system";

const GENERATED_THEME_ID = "generated-logo-theme";

function clampChannel(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function toHex(value) {
  return clampChannel(value).toString(16).padStart(2, "0").toUpperCase();
}

function rgbToHex(r, g, b) {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function parseHex(hex) {
  const safe = String(hex || "#000000").replace("#", "").padEnd(6, "0").slice(0, 6);
  return {
    r: Number.parseInt(safe.slice(0, 2), 16),
    g: Number.parseInt(safe.slice(2, 4), 16),
    b: Number.parseInt(safe.slice(4, 6), 16),
  };
}

function mixHex(hexA, hexB, ratio = 0.5) {
  const left = parseHex(hexA);
  const right = parseHex(hexB);
  const weight = Math.max(0, Math.min(1, ratio));
  return rgbToHex(
    (left.r * (1 - weight)) + (right.r * weight),
    (left.g * (1 - weight)) + (right.g * weight),
    (left.b * (1 - weight)) + (right.b * weight),
  );
}

function colorDistance(hexA, hexB) {
  const left = parseHex(hexA);
  const right = parseHex(hexB);
  return Math.sqrt(
    ((left.r - right.r) ** 2)
    + ((left.g - right.g) ** 2)
    + ((left.b - right.b) ** 2),
  );
}

function relativeLuminance(hex) {
  const { r, g, b } = parseHex(hex);
  const normalize = (channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return (0.2126 * normalize(r)) + (0.7152 * normalize(g)) + (0.0722 * normalize(b));
}

function quantizeChannel(value) {
  return clampChannel(Math.round(value / 24) * 24);
}

function isUsefulPixel(r, g, b, alpha) {
  if (alpha < 140) return false;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max - min;
  const brightness = (r + g + b) / 3;
  if (brightness > 248) return false;
  if (brightness < 10) return false;
  return saturation > 18 || brightness < 220;
}

function getThemeName(businessName = "") {
  const safeName = String(businessName || "").trim();
  return safeName ? `Tema ${safeName}` : "Tema de tu negocio";
}

async function loadImageBitmapFromFile(file) {
  if (typeof window === "undefined" || !file) return null;

  if (typeof window.createImageBitmap === "function") {
    try {
      return await window.createImageBitmap(file);
    } catch {
      // Fall back below.
    }
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("No pudimos leer la imagen del logo."));
    };
    image.src = objectUrl;
  });
}

function extractPaletteFromCanvas(canvas) {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("No pudimos analizar la imagen del logo.");
  }

  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  const buckets = new Map();

  for (let index = 0; index < data.length; index += 4) {
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const alpha = data[index + 3];

    if (!isUsefulPixel(r, g, b, alpha)) {
      continue;
    }

    const key = rgbToHex(
      quantizeChannel(r),
      quantizeChannel(g),
      quantizeChannel(b),
    );

    buckets.set(key, (buckets.get(key) || 0) + 1);
  }

  const sorted = [...buckets.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([hex]) => hex);

  return sorted;
}

function resolvePalette(themeColors = []) {
  const primary = themeColors[0] || "#5B21B6";
  const secondaryCandidate = themeColors.find((color) => color !== primary && colorDistance(color, primary) > 68);
  const secondary = secondaryCandidate || mixHex(primary, "#22D3EE", 0.55);
  const tertiary = mixHex(secondary, "#FFFFFF", 0.72);
  const backgroundColor = mixHex(primary, "#FFFFFF", 0.92);
  const surfaceColor = mixHex(backgroundColor, "#FFFFFF", 0.5);
  const textPrimaryColor = relativeLuminance(primary) > 0.48 ? "#0B1020" : mixHex(primary, "#0B1020", 0.7);
  const textSecondaryColor = mixHex(textPrimaryColor, "#94A3B8", 0.62);

  return {
    primary,
    secondary,
    tertiary,
    backgroundColor,
    surfaceColor,
    textPrimaryColor,
    textSecondaryColor,
  };
}

export async function generateThemeFromLogoFile(file, businessName = "") {
  if (typeof window === "undefined" || !file) {
    return null;
  }

  const bitmap = await loadImageBitmapFromFile(file);
  if (!bitmap) {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 28;
  canvas.height = 28;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return null;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  if (typeof bitmap.close === "function") {
    bitmap.close();
  }

  const palette = extractPaletteFromCanvas(canvas);
  const resolved = resolvePalette(palette);

  return {
    id: GENERATED_THEME_ID,
    name: getThemeName(businessName),
    appearance: normalizeAppearance({
      presetId: GENERATED_THEME_ID,
      advancedEnabled: false,
      backgroundStyle: "solid",
      backgroundColor: resolved.backgroundColor,
      surfaceColor: surfaceColorWithContrast(resolved.surfaceColor, resolved.backgroundColor),
      primaryColor: resolved.primary,
      secondaryColor: resolved.secondary,
      tertiaryColor: resolved.tertiary,
      textPrimaryColor: resolved.textPrimaryColor,
      textSecondaryColor: resolved.textSecondaryColor,
      buttonTextColor: relativeLuminance(resolved.primary) > 0.58 ? "#0B1020" : "#FFFFFF",
      buttonStyle: "solid",
      buttonRadius: "rounded",
      cardTransparency: "soft",
      cardShadow: "medium",
      socialStyle: "brand-circles",
      fontFamily: "inter",
      nameSize: "m",
      nameWeight: "bold",
      avatarShape: "circle",
    }),
  };
}

function surfaceColorWithContrast(surfaceColor, backgroundColor) {
  return colorDistance(surfaceColor, backgroundColor) < 22
    ? mixHex(surfaceColor, "#FFFFFF", 0.4)
    : surfaceColor;
}

export function mergeGeneratedTheme(currentThemes = [], nextTheme = null, businessName = "") {
  const filtered = Array.isArray(currentThemes)
    ? currentThemes.filter((theme) => String(theme?.id || "") !== GENERATED_THEME_ID)
    : [];

  if (!nextTheme) {
    return filtered;
  }

  return [
    {
      ...nextTheme,
      name: getThemeName(businessName) || nextTheme.name,
    },
    ...filtered,
  ];
}

export function getGeneratedThemeId() {
  return GENERATED_THEME_ID;
}
