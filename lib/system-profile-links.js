import { buildBookingPublicUrl, normalizeBookingConfig } from "@/lib/booking-config";
import { buildCommercePublicUrl, normalizeCommerceConfig, resolveCommerceModeMeta } from "@/lib/commerce-config";
import { canUseModule } from "@/lib/plans";

function isSystemLinkId(id = "") {
  const value = String(id || "");
  return value.startsWith("system-commerce-") || value === "system-booking";
}

function buildAppUrl(path = "") {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://klicor.com";
  try {
    return new URL(path, baseUrl).toString();
  } catch {
    return path;
  }
}

export function buildSystemProfileLinks(user = {}) {
  const username = user.usernameLower || user.username || "";
  if (!username) return [];

  const actions = [];
  const category = user.businessCategory;
  const commerceConfig = normalizeCommerceConfig(user.commerce, user);

  if (["food_drink", "retail_sales"].includes(category) && canUseModule(user, "commerce") && commerceConfig.activeMode && commerceConfig.visibleProductsCount > 0) {
    const modeMeta = resolveCommerceModeMeta(commerceConfig.activeMode);
    const url = buildAppUrl(buildCommercePublicUrl(username, commerceConfig.activeMode));
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
  if (["services", "health_wellness"].includes(category) && canUseModule(user, "booking") && bookingConfig.enabled) {
    const url = buildAppUrl(buildBookingPublicUrl(username));
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
