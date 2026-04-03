import { getBusinessCategoryTemplate, resolveBusinessIdentityCopy, resolveBusinessLinkLabel, sortLinksByBusinessCategory } from "@/lib/business-categories";
import { LINK_CATALOG_MAP } from "@/lib/link-catalog";

const SOCIAL_TYPES = new Set(["instagram", "facebook", "tiktok", "youtube", "linkedin", "telegram", "x", "threads", "spotify", "twitch"]);

function decorateLink(item, category) {
  return {
    ...item,
    displayLabel: resolveBusinessLinkLabel(item, category),
    icon: LINK_CATALOG_MAP[item.type]?.icon,
  };
}

export function buildLandingLayout(user = {}) {
  const category = user.businessCategory;
  const template = getBusinessCategoryTemplate(category);
  const identity = resolveBusinessIdentityCopy(user);
  const links = sortLinksByBusinessCategory(user.profileLinks || [], category).filter((item) => item.type !== "payment_key");

  const primaryActions = [];
  const secondaryActions = [];
  const socialLinks = [];

  links.forEach((item) => {
    const decorated = decorateLink(item, category);

    if (SOCIAL_TYPES.has(item.type)) {
      socialLinks.push(decorated);
      return;
    }

    if (primaryActions.length < 3) {
      primaryActions.push(decorated);
      return;
    }

    secondaryActions.push(decorated);
  });

  return {
    category,
    template,
    identity,
    primaryActions,
    secondaryActions,
    socialLinks,
    paymentKey: (user.profileLinks || []).find((item) => item.type === "payment_key") || null,
  };
}
