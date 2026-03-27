import { getAppUrl } from "@/lib/env";
import { sanitizeSlug } from "@/lib/utils";

const PUBLIC_PROFILE_PREFIX = "/u";

export function normalizePublicLinkId(value = "") {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function buildStableProfilePath(publicLinkId) {
  const id = normalizePublicLinkId(publicLinkId);
  return id ? `${PUBLIC_PROFILE_PREFIX}/${id}` : "";
}

export function buildStableProfileUrl(publicLinkId) {
  const path = buildStableProfilePath(publicLinkId);
  return path ? `${getAppUrl()}${path}` : "";
}

export function buildVanityProfilePath(username) {
  const slug = sanitizeSlug(username);
  return slug ? `/${slug}` : "";
}

export function buildVanityProfileUrl(username) {
  const path = buildVanityProfilePath(username);
  return path ? `${getAppUrl()}${path}` : "";
}
