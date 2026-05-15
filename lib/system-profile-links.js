import { buildBookingPublicUrl, normalizeBookingConfig } from "@/lib/booking-config";
import { buildCommercePublicUrl, normalizeCommerceConfig, resolveCommerceModeMeta } from "@/lib/commerce-config";
import { canUseModule } from "@/lib/plans";

export function isSystemLinkId(id = "") {
  const value = String(id || "");
  return value.startsWith("system-commerce-") || value === "system-booking";
}

export function isSystemProfileLink(item = {}) {
  return isSystemLinkId(item?.id);
}

export function buildSystemProfileLinks(user = {}) {
  const username = user.usernameLower || user.username || "";
  if (!username) return [];

  const actions = [];
  const commerceConfig = normalizeCommerceConfig(user.commerce, user);

  if (canUseModule(user, "commerce") && commerceConfig.activeMode && commerceConfig.visibleProductsCount > 0) {
    const modeMeta = resolveCommerceModeMeta(commerceConfig.activeMode);
    const url = buildCommercePublicUrl(username, commerceConfig.activeMode);
    if (url) {
      actions.push({
        id: `system-commerce-${commerceConfig.activeMode}`,
        type: "marketplace",
        label: modeMeta.shortLabel ? `Ver ${modeMeta.shortLabel.toLowerCase()}` : modeMeta.label,
        value: url,
        url,
        priorityTier: 1,
        systemAction: true,
      });
    }
  }

  const bookingConfig = normalizeBookingConfig(user.bookingConfig || user);
  if (canUseModule(user, "booking") && bookingConfig.enabled) {
    const url = buildBookingPublicUrl(username);
    if (url) {
      actions.push({
        id: "system-booking",
        type: "booking",
        label: "Agendar cita",
        value: url,
        url,
        priorityTier: 1,
        systemAction: true,
      });
    }
  }

  return actions;
}

export function mergeSystemProfileLinks(profileLinks = [], user = {}) {
  const systemLinks = buildSystemProfileLinks(user);
  const systemLinkById = new Map(systemLinks.map((item) => [item.id, item]));
  const activeSystemIds = new Set(systemLinks.map((item) => item.id));
  const currentLinks = Array.isArray(profileLinks)
    ? profileLinks
      .filter((item) => !isSystemLinkId(item?.id) || activeSystemIds.has(item.id))
      .map((item) => {
        const systemLink = systemLinkById.get(item.id);
        if (!systemLink) return item;

        return {
          ...systemLink,
          ...item,
          value: systemLink.value,
          url: systemLink.url,
          systemAction: true,
        };
      })
    : [];
  const currentIds = new Set(currentLinks.map((item) => item.id));
  const missingSystemLinks = systemLinks.filter((item) => !currentIds.has(item.id));

  return [...missingSystemLinks, ...currentLinks];
}
