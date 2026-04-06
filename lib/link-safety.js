import { isIP } from "node:net";
import { LINK_CATALOG_MAP } from "@/lib/link-catalog";
import { normalizeProfileLinks } from "@/lib/profile-links";

const WEB_RISK_THREAT_TYPES = [
  "MALWARE",
  "SOCIAL_ENGINEERING",
  "UNWANTED_SOFTWARE",
];

const CATEGORY_BLOCK_PATTERNS = [
  { pattern: /\badult\b/i, reason: "parece contenido para adultos" },
  { pattern: /\bporn/i, reason: "parece contenido pornográfico" },
  { pattern: /\bnudity\b/i, reason: "parece contenido para adultos" },
  { pattern: /\bsex\b/i, reason: "parece contenido para adultos" },
  { pattern: /\bhacking\b/i, reason: "parece contenido relacionado con hackeo" },
  { pattern: /\bpiracy\b/i, reason: "parece contenido relacionado con piratería" },
  { pattern: /\bwarez\b/i, reason: "parece contenido relacionado con piratería" },
  { pattern: /\bquestionable activities\b/i, reason: "parece contenido cuestionable" },
  { pattern: /\bquestionable content\b/i, reason: "parece contenido cuestionable" },
  { pattern: /\billegal downloads?\b/i, reason: "parece contenido relacionado con descargas ilegales" },
];

const BLOCKED_SCHEMES = new Set(["javascript:", "data:", "file:", "ftp:", "blob:"]);
const BLOCKED_HOSTS = new Set(["localhost", "0.0.0.0", "127.0.0.1", "::1"]);
const BLOCKED_HOST_SUFFIXES = [".local", ".internal", ".localhost", ".home.arpa", ".onion"];
const ALLOWED_PORTS = new Set(["", "80", "443"]);

function getWebRiskApiKey() {
  return process.env.GOOGLE_WEB_RISK_API_KEY || process.env.WEB_RISK_API_KEY || "";
}

function getWebshrinkerAccessKey() {
  return process.env.WEBSHRINKER_ACCESS_KEY || "";
}

function getWebshrinkerSecretKey() {
  return process.env.WEBSHRINKER_SECRET_KEY || "";
}

function parseIpv4(hostname) {
  const parts = hostname.split(".");
  if (parts.length !== 4) return null;

  const values = parts.map((part) => Number(part));
  if (values.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) {
    return null;
  }

  return values;
}

function isPrivateIpAddress(hostname) {
  const version = isIP(hostname);
  if (!version) return false;

  if (version === 4) {
    const [first, second] = parseIpv4(hostname) || [];

    if (first === 10) return true;
    if (first === 127) return true;
    if (first === 0) return true;
    if (first === 169 && second === 254) return true;
    if (first === 172 && second >= 16 && second <= 31) return true;
    if (first === 192 && second === 168) return true;
    if (first === 100 && second >= 64 && second <= 127) return true;
    return false;
  }

  const normalized = hostname.toLowerCase();
  return normalized === "::1"
    || normalized.startsWith("fc")
    || normalized.startsWith("fd")
    || normalized.startsWith("fe8")
    || normalized.startsWith("fe9")
    || normalized.startsWith("fea")
    || normalized.startsWith("feb");
}

function getThreatLabel(threatType) {
  if (threatType === "MALWARE") return "malware";
  if (threatType === "SOCIAL_ENGINEERING") return "phishing";
  if (threatType === "UNWANTED_SOFTWARE") return "software no deseado";
  return "riesgo de seguridad";
}

function getLinkName(link) {
  return link.label || LINK_CATALOG_MAP[link.type]?.label || "enlace";
}

function buildBlockedError(link, reason) {
  return new Error(`Bloqueamos el enlace "${getLinkName(link)}" porque ${reason}.`);
}

function encodeUrlSafeBase64(value) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function runLocalUrlChecks(link) {
  let parsed;
  try {
    parsed = new URL(link.url);
  } catch {
    throw buildBlockedError(link, "no tiene un formato válido");
  }

  const hostname = parsed.hostname.toLowerCase();

  if (BLOCKED_SCHEMES.has(parsed.protocol)) {
    throw buildBlockedError(link, "usa un protocolo no permitido");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw buildBlockedError(link, "solo admite direcciones web publicas");
  }

  if (parsed.username || parsed.password) {
    throw buildBlockedError(link, "incluye credenciales dentro de la direccion");
  }

  if (BLOCKED_HOSTS.has(hostname) || BLOCKED_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix))) {
    throw buildBlockedError(link, "apunta a una direccion local o privada");
  }

  if (!hostname.includes(".")) {
    throw buildBlockedError(link, "no parece un dominio público válido");
  }

  if (isPrivateIpAddress(hostname)) {
    throw buildBlockedError(link, "apunta a una IP privada o interna");
  }

  if (!ALLOWED_PORTS.has(parsed.port)) {
    throw buildBlockedError(link, "usa un puerto no permitido");
  }
}

async function checkUrlWithWebRisk(link) {
  const apiKey = getWebRiskApiKey();
  if (!apiKey) return;

  const endpoint = new URL("https://webrisk.googleapis.com/v1/uris:search");
  for (const threatType of WEB_RISK_THREAT_TYPES) {
    endpoint.searchParams.append("threatTypes", threatType);
  }
  endpoint.searchParams.set("uri", link.url);
  endpoint.searchParams.set("key", apiKey);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  let response;
  try {
    response = await fetch(endpoint, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
  } catch {
    throw new Error(`No pudimos verificar el enlace "${getLinkName(link)}" en este momento. Intenta de nuevo.`);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`No pudimos verificar el enlace "${getLinkName(link)}" en este momento. Intenta de nuevo.`);
  }

  const data = await response.json();
  const matchedThreats = Array.isArray(data?.threat?.threatTypes) ? data.threat.threatTypes : [];

  if (matchedThreats.length) {
    const threatLabel = getThreatLabel(matchedThreats[0]);
    throw buildBlockedError(link, `parece ${threatLabel}`);
  }
}

async function checkUrlWithCategories(link) {
  const accessKey = getWebshrinkerAccessKey();
  const secretKey = getWebshrinkerSecretKey();
  if (!accessKey || !secretKey) return;

  const encodedUrl = encodeUrlSafeBase64(link.url);
  const endpoint = `https://api.webshrinker.com/categories/v3/${encodedUrl}?taxonomy=iabv1`;
  const auth = Buffer.from(`${accessKey}:${secretKey}`).toString("base64");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  let response;
  try {
    response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
      },
      cache: "no-store",
      signal: controller.signal,
    });
  } catch {
    throw new Error(`No pudimos clasificar el enlace "${getLinkName(link)}" en este momento. Intenta de nuevo.`);
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status === 202) {
    throw new Error(`Todavía estamos clasificando el enlace "${getLinkName(link)}". Intenta guardarlo nuevamente en unos segundos.`);
  }

  if (response.status === 412) {
    return;
  }

  if (!response.ok) {
    throw new Error(`No pudimos clasificar el enlace "${getLinkName(link)}" en este momento. Intenta de nuevo.`);
  }

  const data = await response.json();
  const categories = Array.isArray(data?.data?.[0]?.categories) ? data.data[0].categories : [];

  for (const category of categories) {
    const label = String(category?.label || "");
    const parent = String(category?.parent || "");
    const summary = `${label} ${parent}`.trim();

    const matchedPattern = CATEGORY_BLOCK_PATTERNS.find((entry) => entry.pattern.test(summary));
    if (matchedPattern) {
      throw buildBlockedError(link, matchedPattern.reason);
    }
  }
}

export async function validateProfileLinksSafety(profileLinks = []) {
  const normalizedLinks = normalizeProfileLinks(profileLinks);
  const seen = new Map();

  for (const link of normalizedLinks) {
    const meta = LINK_CATALOG_MAP[link.type];
    if (meta?.kind !== "url" || !link.url) continue;

    if (!seen.has(link.url)) {
      runLocalUrlChecks(link);
      await checkUrlWithWebRisk(link);
      await checkUrlWithCategories(link);
      seen.set(link.url, true);
    }
  }
}
