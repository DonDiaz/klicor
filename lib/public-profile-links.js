import { getAppUrl } from "@/lib/env";
import { sanitizeSlug } from "@/lib/utils";

const PUBLIC_PROFILE_PREFIX = "/u";
const SHARE_QUERY_KEY = "share";

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

export function buildShareProfileUrl(username, version = "") {
  const url = buildVanityProfileUrl(username);
  const token = String(version || "").trim();
  if (!url) return "";
  if (!token) return url;

  const shareUrl = new URL(url);
  shareUrl.searchParams.set(SHARE_QUERY_KEY, token);
  return shareUrl.toString();
}
