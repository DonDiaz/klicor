import "server-only";
import { getAdminAuth } from "@/lib/firebase-admin";
import { ensureUserProfile, getUserByUid } from "@/lib/firestore";
import { hasAcceptedRequiredLegal, hasCurrentUserLegalConsent } from "@/lib/legal-consent";

function normalizeEmail(email = "") {
  return String(email || "").trim().toLowerCase();
}

export function isConfiguredAdminEmail(email = "") {
  const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL);
  return Boolean(adminEmail) && normalizeEmail(email) === adminEmail;
}

export function isAdminSession(decoded = {}) {
  return Boolean(decoded?.admin) && Boolean(decoded?.email_verified) && isConfiguredAdminEmail(decoded?.email);
}

function hasConfiguredAdminAccess(decoded = {}) {
  return Boolean(decoded?.email_verified) && isConfiguredAdminEmail(decoded?.email);
}

function hasStoredAdminAccess(decoded = {}, user = {}) {
  const decodedEmail = normalizeEmail(decoded?.email);
  const userEmail = normalizeEmail(user?.email);

  return Boolean(decoded?.email_verified)
    && user?.role === "admin"
    && Boolean(decodedEmail)
    && decodedEmail === userEmail;
}

function shouldHaveAdminAccess(decoded = {}, user = {}) {
  return hasConfiguredAdminAccess(decoded) || hasStoredAdminAccess(decoded, user);
}

async function syncAdminClaims(decoded = {}, user = {}) {
  if (!decoded?.uid) return false;

  const shouldBeAdmin = shouldHaveAdminAccess(decoded, user);
  const tokenHasAdminClaim = decoded.admin === true;
  if (!shouldBeAdmin && !tokenHasAdminClaim) {
    return false;
  }

  const auth = getAdminAuth();
  const userRecord = await auth.getUser(decoded.uid);
  const currentClaims = userRecord.customClaims || {};
  const hasAdminClaim = currentClaims.admin === true;

  if (shouldBeAdmin && !hasAdminClaim) {
    await auth.setCustomUserClaims(decoded.uid, {
      ...currentClaims,
      admin: true,
    });
    return true;
  }

  if (!shouldBeAdmin && hasAdminClaim) {
    const { admin, ...rest } = currentClaims;
    await auth.setCustomUserClaims(decoded.uid, rest);
    return true;
  }

  return false;
}

export async function verifyRequest(request, options = {}) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    throw new Error("No autorizado");
  }

  const decoded = await getAdminAuth().verifyIdToken(token, Boolean(options.checkRevoked));
  const configuredRole = hasConfiguredAdminAccess(decoded) ? "admin" : "user";
  let user = await getUserByUid(decoded.uid);
  const hasFreshLegalAcceptance = hasAcceptedRequiredLegal(options.legalAcceptance);

  if (!user) {
    if (!hasFreshLegalAcceptance) {
      throw new Error("Debes aceptar los términos y condiciones para crear tu cuenta.");
    }

    await ensureUserProfile({
      uid: decoded.uid,
      email: decoded.email || "",
      name: decoded.name || "",
      photoURL: decoded.picture || "",
      role: configuredRole,
      emailVerified: Boolean(decoded.email_verified),
    });
    user = await getUserByUid(decoded.uid);
  } else if (options.requireCurrentLegal && !hasCurrentUserLegalConsent(user) && !hasFreshLegalAcceptance) {
    throw new Error("Debes aceptar los terminos y condiciones vigentes para continuar.");
  }

  const role = shouldHaveAdminAccess(decoded, user) ? "admin" : "user";
  const claimsUpdated = await syncAdminClaims(decoded, user);

  return {
    decoded,
    user: user ? { ...user, role } : null,
    claimsUpdated,
  };
}

export function requireAdmin(context) {
  if (!shouldHaveAdminAccess(context?.decoded, context?.user)) {
    throw new Error("Acceso restringido");
  }
}
