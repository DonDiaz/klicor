import { resolveBusinessCategoryLabel, resolveBusinessTypeLabel } from "@/lib/business-categories";

export const KLICOR_SITE_NAME = "Klicor";
export const KLICOR_HOME_TITLE = "Klicor | Link en bio, menú digital, tienda y agenda para negocios";
export const KLICOR_HOME_DESCRIPTION = "Crea un link profesional para tu negocio con QR, menú digital, catálogo, tienda por WhatsApp, agenda online, pagos visibles y enlaces en un solo lugar.";
export const KLICOR_DEFAULT_IMAGE = "/klicor-icon.png";

const SOCIAL_LINK_TYPES = new Set(["instagram", "facebook", "tiktok", "youtube", "linkedin", "x", "threads", "spotify", "twitch"]);

export function compactText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function truncateSeoText(value = "", maxLength = 155) {
  const text = compactText(value);
  if (text.length <= maxLength) return text;
  const trimmed = text.slice(0, maxLength - 1).trimEnd();
  return `${trimmed.replace(/[,.:\-–—;]+$/, "")}…`;
}

export function toAbsoluteUrl(value = "", origin = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  const base = String(origin || process.env.NEXT_PUBLIC_APP_URL || "https://klicor.com").replace(/\/+$/, "");
  return `${base}${raw.startsWith("/") ? raw : `/${raw}`}`;
}

export function buildSeoMetadata({
  title,
  description,
  url,
  image = KLICOR_DEFAULT_IMAGE,
  imageAlt = "Klicor",
  type = "website",
  siteName = KLICOR_SITE_NAME,
  twitterCard = "summary_large_image",
} = {}) {
  const cleanTitle = compactText(title || KLICOR_HOME_TITLE);
  const cleanDescription = truncateSeoText(description || KLICOR_HOME_DESCRIPTION);
  const cleanUrl = toAbsoluteUrl(url);
  const imageUrl = toAbsoluteUrl(image || KLICOR_DEFAULT_IMAGE);

  return {
    title: cleanTitle,
    description: cleanDescription,
    alternates: cleanUrl ? { canonical: cleanUrl } : undefined,
    openGraph: {
      title: cleanTitle,
      description: cleanDescription,
      url: cleanUrl || undefined,
      type,
      siteName,
      images: imageUrl
        ? [{
            url: imageUrl,
            alt: imageAlt,
          }]
        : undefined,
    },
    twitter: {
      card: twitterCard,
      title: cleanTitle,
      description: cleanDescription,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export function getBusinessCategoryText(business = {}) {
  const typeLabel = resolveBusinessTypeLabel(business.businessType || "", business.businessCategory || "");
  if (typeLabel) return typeLabel.toLowerCase();
  return resolveBusinessCategoryLabel(business.businessCategory).toLowerCase();
}

export function buildBusinessSeoDescription(business = {}, fallback = "") {
  const headline = compactText(business.businessHeadline || "");
  const subheadline = compactText(business.businessSubheadline || "");
  if (headline && subheadline) return truncateSeoText(`${headline}. ${subheadline}`);
  if (headline) return truncateSeoText(headline);
  if (subheadline) return truncateSeoText(subheadline);

  const name = business.businessName || "este negocio";
  const category = getBusinessCategoryText(business);
  return truncateSeoText(fallback || `Conoce ${name}, ${category}, y sus canales principales en un solo lugar.`);
}

function getSocialLinks(profileLinks = []) {
  return (Array.isArray(profileLinks) ? profileLinks : [])
    .filter((item) => SOCIAL_LINK_TYPES.has(item.type) && item.url)
    .map((item) => item.url);
}

export function buildLocalBusinessJsonLd({ business = {}, url = "", description = "", image = "", sameAs = [] } = {}) {
  const name = compactText(business.businessName || "");
  if (!name || !url) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name,
    url,
    description: truncateSeoText(description || buildBusinessSeoDescription(business), 250),
  };

  const imageUrl = toAbsoluteUrl(image || business.photoThumb || business.photo || "");
  if (imageUrl) jsonLd.image = imageUrl;

  const links = [...new Set([...(sameAs || []), ...getSocialLinks(business.profileLinks)])];
  if (links.length) jsonLd.sameAs = links;

  return jsonLd;
}

function resolveCommerceImage(data = {}) {
  const firstProduct = Array.isArray(data.initialProducts) ? data.initialProducts.find(Boolean) : null;
  const firstCategory = Array.isArray(data.categories) ? data.categories.find(Boolean) : null;
  return firstProduct?.imageCardUrl
    || firstProduct?.imageUrl
    || firstCategory?.imageUrl
    || firstCategory?.imageThumbUrl
    || data.business?.photoThumb
    || data.business?.photo
    || KLICOR_DEFAULT_IMAGE;
}

export function buildCommerceSeoMetadata(data = {}, canonicalUrl = "") {
  const business = data.business || {};
  const name = business.businessName || "Negocio";
  const mode = data.mode;
  const modeLabel = data.modeMeta?.shortLabel || data.modeMeta?.label || "Comercio";
  const categories = (Array.isArray(data.categories) ? data.categories : [])
    .map((item) => compactText(item.name))
    .filter(Boolean)
    .slice(0, 4);

  const titleByMode = {
    mitienda: `${name} | Tienda y pedidos por WhatsApp`,
    mimenu: `${name} | Menú digital y pedidos por WhatsApp`,
    micatalogo: `${name} | Catálogo digital`,
  };

  const categoryText = categories.length ? ` Categorías: ${categories.join(", ")}.` : "";
  const description = buildBusinessSeoDescription(
    business,
    `${modeLabel} de ${name}. Consulta productos, precios e información desde el celular y contacta por WhatsApp.${categoryText}`,
  );

  return buildSeoMetadata({
    title: titleByMode[mode] || `${name} | ${modeLabel}`,
    description,
    url: canonicalUrl,
    image: resolveCommerceImage(data),
    imageAlt: `${modeLabel} de ${name}`,
  });
}

export function buildBookingSeoMetadata(data = {}, canonicalUrl = "") {
  const business = data.business || {};
  const name = business.businessName || "Negocio";
  const category = getBusinessCategoryText(business);
  const description = buildBusinessSeoDescription(
    business,
    `Agenda una cita con ${name}, ${category}. Elige servicio, profesional, fecha y hora desde el celular.`,
  );

  return buildSeoMetadata({
    title: `${name} | Agenda citas online`,
    description,
    url: canonicalUrl,
    image: business.photoThumb || business.photo || KLICOR_DEFAULT_IMAGE,
    imageAlt: `Agenda de ${name}`,
  });
}
