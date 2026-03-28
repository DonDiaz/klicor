import { LINK_CATALOG_MAP } from "@/lib/link-catalog";
import { buildWhatsappLink, normalizeUrl, sanitizePhone } from "@/lib/utils";

function normalizeItem(item, index = 0) {
  if (!item) return null;
  const type = item.type || "website";
  const meta = LINK_CATALOG_MAP[type] || LINK_CATALOG_MAP.website;
  const label = (item.label || meta.label || "Enlace").trim();
  const rawValue = (item.value || item.url || "").trim();
  const message = typeof item.message === "string" ? item.message.trim() : "";

  if (!rawValue) return null;

  if (meta.kind === "phone") {
    const value = sanitizePhone(rawValue);
    if (!value) return null;
    return {
      id: item.id || `${type}-${index}`,
      type,
      label,
      value,
      message,
      url: buildWhatsappLink(value, message || "Hola, quiero informacion"),
    };
  }

  if (meta.kind === "email") {
    return {
      id: item.id || `${type}-${index}`,
      type,
      label,
      value: rawValue.toLowerCase(),
      message: "",
      url: `mailto:${rawValue.toLowerCase()}`,
    };
  }

  if (meta.kind === "text") {
    return {
      id: item.id || `${type}-${index}`,
      type,
      label,
      value: rawValue,
      message: "",
      url: "",
    };
  }

  return {
    id: item.id || `${type}-${index}`,
    type,
    label,
    value: rawValue,
    message: "",
    url: normalizeUrl(rawValue),
  };
}

export function legacyLinksToArray(links = {}) {
  return Object.entries(links)
    .map(([type, value], index) => normalizeItem({ type, value }, index))
    .filter(Boolean);
}

export function normalizeProfileLinks(rawLinks = [], legacyLinks = {}) {
  if (Array.isArray(rawLinks) && rawLinks.length) {
    return rawLinks.map((item, index) => normalizeItem(item, index)).filter(Boolean);
  }
  return legacyLinksToArray(legacyLinks);
}
