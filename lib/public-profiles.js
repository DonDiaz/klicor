import { revalidateTag, unstable_cache } from "next/cache";
import { normalizeBusinessCategory, resolveBusinessCategoryLabel } from "@/lib/business-categories";
import { getAdminDb } from "@/lib/firebase-admin";
import { buildContactCardUrl } from "@/lib/public-profile-links";
import { normalizeProfileLinks } from "@/lib/profile-links";
import { normalizeAppearance } from "@/lib/theme-system";
import { sanitizeSlug, toDate } from "@/lib/utils";

function usersCollection() {
  return getAdminDb().collection("users");
}

function usernamesCollection() {
  return getAdminDb().collection("usernames");
}

function publicLinksCollection() {
  return getAdminDb().collection("publicLinks");
}

function buildPublicProfileView(user = {}) {
  return {
    uid: user.uid,
    publicLinkId: user.publicLinkId || "",
    username: user.username || "",
    usernameLower: user.usernameLower || "",
    businessName: user.businessName || "Tu negocio",
    businessCategory: normalizeBusinessCategory(user.businessCategory),
    businessHeadline: user.businessHeadline || "",
    businessSubheadline: user.businessSubheadline || "",
    photo: user.photo || "",
    paymentQrUrl: user.paymentQrUrl || "",
    contactCardEnabled: Boolean(user.contactCardEnabled),
    contactCardName: user.contactCardName || "",
    contactCardTitle: user.contactCardTitle || "",
    contactCardWhatsappLinkId: user.contactCardWhatsappLinkId || "",
    contactCardPhone: user.contactCardPhone || "",
    contactCardUrl: user.publicLinkId ? buildContactCardUrl(user.publicLinkId) : "",
    profileLinks: normalizeProfileLinks(user.profileLinks, user.links),
    settings: normalizeAppearance(user.settings),
    status: user.status || "trial",
    updatedAtMs: toDate(user.updatedAt)?.getTime() || 0,
  };
}

export function buildPublicProfileDescription(user = {}) {
  const businessName = user.businessName || "este negocio";
  const categoryLabel = resolveBusinessCategoryLabel(user.businessCategory).toLowerCase();
  return `Conoce ${businessName}, ${categoryLabel}, y sus canales principales en un solo lugar.`;
}

async function readPublicProfileByUid(uid) {
  const snap = await usersCollection().doc(uid).get();
  if (!snap.exists) return null;
  return buildPublicProfileView(snap.data());
}

async function readPublicProfileByUsername(slug) {
  const usernameSnap = await usernamesCollection().doc(slug).get();
  if (!usernameSnap.exists) return null;
  return readPublicProfileByUid(usernameSnap.data().uid);
}

async function readPublicProfileByPublicLinkId(publicLinkId) {
  const linkSnap = await publicLinksCollection().doc(publicLinkId).get();
  if (!linkSnap.exists || linkSnap.data()?.active === false) return null;
  return readPublicProfileByUid(linkSnap.data().uid);
}

export async function getPublicProfileByUsername(username) {
  const slug = sanitizeSlug(username);
  if (!slug) return null;

  return unstable_cache(
    async () => readPublicProfileByUsername(slug),
    ["public-profile-by-username", slug],
    {
      tags: [`public-profile:username:${slug}`],
      revalidate: 300,
    },
  )();
}

export async function getPublicProfileByPublicLinkId(publicLinkId) {
  const slug = String(publicLinkId || "").trim().toLowerCase();
  if (!slug) return null;

  return unstable_cache(
    async () => readPublicProfileByPublicLinkId(slug),
    ["public-profile-by-link", slug],
    {
      tags: [`public-profile:link:${slug}`],
      revalidate: 300,
    },
  )();
}

export function invalidatePublicProfileCache({ currentUsername = "", previousUsername = "", publicLinkId = "" } = {}) {
  const currentSlug = sanitizeSlug(currentUsername);
  const previousSlug = sanitizeSlug(previousUsername);
  const stableId = String(publicLinkId || "").trim().toLowerCase();

  if (currentSlug) revalidateTag(`public-profile:username:${currentSlug}`);
  if (previousSlug && previousSlug !== currentSlug) revalidateTag(`public-profile:username:${previousSlug}`);
  if (stableId) revalidateTag(`public-profile:link:${stableId}`);
}
