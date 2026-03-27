import { revalidateTag, unstable_cache } from "next/cache";
import { getAdminDb } from "@/lib/firebase-admin";
import { normalizeProfileLinks } from "@/lib/profile-links";
import { normalizeAppearance } from "@/lib/theme-system";
import { sanitizeSlug } from "@/lib/utils";

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
    username: user.username || "",
    usernameLower: user.usernameLower || "",
    businessName: user.businessName || "Tu negocio",
    photo: user.photo || "",
    profileLinks: normalizeProfileLinks(user.profileLinks, user.links),
    settings: normalizeAppearance(user.settings),
    status: user.status || "trial",
  };
}

export function buildPublicProfileDescription(user = {}) {
  const businessName = user.businessName || "este negocio";
  return `Conoce ${businessName} y sus canales principales en un solo lugar.`;
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
