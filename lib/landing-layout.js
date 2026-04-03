import {
  applyDefaultLinkPriorityTiers,
  getBusinessCategoryTemplate,
  isSocialLinkType,
  resolveBusinessIdentityCopy,
  resolveBusinessLinkLabel,
  sortLinksByBusinessCategory,
} from "@/lib/business-categories";
import { LINK_CATALOG_MAP } from "@/lib/link-catalog";

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
  const sortedLinks = sortLinksByBusinessCategory(user.profileLinks || [], category);
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
    paymentKey: (user.profileLinks || []).find((item) => item.type === "payment_key") || null,
  };
}
