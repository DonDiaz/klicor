import {
  applyDefaultLinkPriorityTiers,
  getBusinessCategoryTemplate,
  isSocialLinkType,
  resolveBusinessIdentityCopy,
  resolveBusinessLinkLabel,
  sortLinksByBusinessCategory,
} from "@/lib/business-categories";
import { buildBookingPublicUrl, normalizeBookingConfig } from "@/lib/booking-config";
import { buildCommercePublicUrl, normalizeCommerceConfig, resolveCommerceModeMeta } from "@/lib/commerce-config";
import { LINK_CATALOG_MAP } from "@/lib/link-catalog";

function decorateLink(item, category) {
  return {
    ...item,
    displayLabel: resolveBusinessLinkLabel(item, category),
    icon: LINK_CATALOG_MAP[item.type]?.icon,
  };
}

function buildSystemActions(user = {}) {
  const username = user.usernameLower || user.username || "";
  if (!username) return [];

  const actions = [];
  const category = user.businessCategory;
  const commerceConfig = normalizeCommerceConfig(user.commerce, user);
  if (["food_drink", "retail_sales"].includes(category) && commerceConfig.activeMode && commerceConfig.visibleProductsCount > 0) {
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
  if (["services", "health_wellness"].includes(category) && bookingConfig.enabled) {
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

export function buildLandingLayout(user = {}) {
  const category = user.businessCategory;
  const template = getBusinessCategoryTemplate(category);
  const identity = resolveBusinessIdentityCopy(user);
  const systemActions = buildSystemActions(user);
  const systemTypes = new Set(systemActions.map((item) => item.type));
  const profileLinks = (user.profileLinks || []).filter((item) => !systemTypes.has(item.type));
  const sortedLinks = sortLinksByBusinessCategory([...systemActions, ...profileLinks], category);
  const prioritizedLinks = applyDefaultLinkPriorityTiers(sortedLinks, category).filter((item) => item.type !== "payment_key");

  const priorityOneActions = [];
  const priorityTwoActions = [];
  const priorityThreeActions = [];
  const socialLinks = [];

  prioritizedLinks.forEach((item) => {
    const decorated = decorateLink(item, category);

    if (isSocialLinkType(item.type)) {
      socialLinks.push(decorated);
      return;
    }

    const tier = Number(item.priorityTier || 3);

    if (tier === 1) {
      priorityOneActions.push(decorated);
      return;
    }

    if (tier === 2) {
      priorityTwoActions.push(decorated);
      return;
    }

    priorityThreeActions.push(decorated);
  });

  return {
    category,
    template,
    identity,
    priorityOneActions,
    priorityTwoActions,
    priorityThreeActions,
    socialLinks,
    paymentMethods: Array.isArray(user.paymentMethods) ? user.paymentMethods.filter((method) => method?.entityId || method?.accountNumber || method?.brebKey).slice(0, 2) : [],
  };
}
