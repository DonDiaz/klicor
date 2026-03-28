import { buildContactCardUrl, buildStableProfileUrl, buildVanityProfileUrl } from "@/lib/public-profile-links";
import { normalizeProfileLinks } from "@/lib/profile-links";
import { sanitizePhone } from "@/lib/utils";

function normalizePhoneForVCard(value = "") {
  const raw = String(value || "").trim();
  const digits = sanitizePhone(raw);
  if (!digits) return "";
  if (raw.startsWith("+")) return `+${digits}`;
  if (digits.length === 10) return `+57${digits}`;
  return digits.startsWith("57") ? `+${digits}` : digits;
}

function escapeVCardText(value = "") {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

export function resolveContactCardData(user = {}) {
  const profileLinks = Array.isArray(user.profileLinks) && user.profileLinks.every((item) => item?.url !== undefined)
    ? user.profileLinks
    : normalizeProfileLinks(user.profileLinks, user.links);
  const whatsappLinks = profileLinks.filter((item) => item.type === "whatsapp");
  const selectedWhatsapp = user.contactCardWhatsappLinkId
    ? whatsappLinks.find((item) => item.id === user.contactCardWhatsappLinkId)
    : whatsappLinks[0] || null;
  const emailLink = profileLinks.find((item) => item.type === "email");
  const websiteLink = profileLinks.find((item) => item.type === "website");
  const name = String(user.contactCardName || user.businessName || "").trim();
  const title = String(user.contactCardTitle || "").trim();
  const phone = normalizePhoneForVCard(selectedWhatsapp?.value || user.contactCardPhone || "");
  const email = String(emailLink?.value || "").trim().toLowerCase();
  const website = websiteLink?.url
    || buildStableProfileUrl(user.publicLinkId)
    || buildVanityProfileUrl(user.usernameLower || user.username);
  const enabled = Boolean(user.contactCardEnabled);
  const shouldShow = Boolean(enabled && name && (phone || email || website));

  return {
    enabled,
    shouldShow,
    name,
    org: String(user.businessName || name).trim(),
    title,
    phone,
    email,
    website,
    whatsappLinkId: selectedWhatsapp?.id || "",
    contactUrl: user.publicLinkId ? buildContactCardUrl(user.publicLinkId) : "",
    hasEmailLink: Boolean(emailLink),
    hasWebsiteLink: Boolean(websiteLink),
    hasWhatsappLinks: whatsappLinks.length > 0,
    whatsappOptions: whatsappLinks.map((item) => ({
      id: item.id,
      label: item.label,
      value: item.value,
    })),
  };
}

export function buildVCardString(user = {}) {
  const card = resolveContactCardData(user);
  if (!card.shouldShow) {
    return "";
  }

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "PRODID:-//Klicor//Contact Card//ES",
    `FN:${escapeVCardText(card.name)}`,
    `N:${escapeVCardText(card.name)};;;;`,
  ];

  if (card.org) lines.push(`ORG:${escapeVCardText(card.org)}`);
  if (card.title) lines.push(`TITLE:${escapeVCardText(card.title)}`);
  if (card.phone) lines.push(`TEL;TYPE=CELL,VOICE:${escapeVCardText(card.phone)}`);
  if (card.email) lines.push(`EMAIL;TYPE=INTERNET:${escapeVCardText(card.email)}`);
  if (card.website) lines.push(`URL:${escapeVCardText(card.website)}`);

  lines.push("END:VCARD");
  return `${lines.join("\r\n")}\r\n`;
}
