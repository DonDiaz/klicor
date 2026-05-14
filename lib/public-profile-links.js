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

export function buildStableProfileUrl(publicLinkId, baseUrl = getAppUrl()) {
  const path = buildStableProfilePath(publicLinkId);
  return path ? `${String(baseUrl || getAppUrl()).replace(/\/$/, "")}${path}` : "";
}

export function buildContactCardPath(publicLinkId) {
  const path = buildStableProfilePath(publicLinkId);
  return path ? `${path}/contact.vcf` : "";
}

export function buildContactCardUrl(publicLinkId, baseUrl = getAppUrl()) {
  const path = buildContactCardPath(publicLinkId);
  return path ? `${String(baseUrl || getAppUrl()).replace(/\/$/, "")}${path}` : "";
}

export function buildVanityProfilePath(username) {
  const slug = sanitizeSlug(username);
  return slug ? `/${slug}` : "";
}

export function buildVanityProfileUrl(username, baseUrl = getAppUrl()) {
  const path = buildVanityProfilePath(username);
  return path ? `${String(baseUrl || getAppUrl()).replace(/\/$/, "")}${path}` : "";
}

export function buildShareProfileUrl(username, version = "", baseUrl = getAppUrl()) {
  const url = buildVanityProfileUrl(username, baseUrl);
  const token = String(version || "").trim();
  if (!url) return "";
  if (!token) return url;

  const shareUrl = new URL(url);
  shareUrl.searchParams.set(SHARE_QUERY_KEY, token);
  return shareUrl.toString();
}
