import "server-only";
import { getAdminAuth } from "@/lib/firebase-admin";
import { ensureUserProfile, getUserByUid } from "@/lib/firestore";

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

async function syncAdminClaims(decoded = {}) {
  if (!decoded?.uid) return false;

  const shouldBeAdmin = Boolean(decoded.email_verified) && isConfiguredAdminEmail(decoded.email);
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

export async function verifyRequest(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    throw new Error("No autorizado");
  }

  const decoded = await getAdminAuth().verifyIdToken(token);
  const claimsUpdated = await syncAdminClaims(decoded);
  const role = isAdminSession(decoded) ? "admin" : "user";
  let user = await getUserByUid(decoded.uid);

  if (!user) {
    await ensureUserProfile({
      uid: decoded.uid,
      email: decoded.email || "",
      name: decoded.name || "",
      photoURL: decoded.picture || "",
      role,
      emailVerified: Boolean(decoded.email_verified),
    });
    user = await getUserByUid(decoded.uid);
  }

  return {
    decoded,
    user: user ? { ...user, role } : null,
    claimsUpdated,
  };
}

export function requireAdmin(context) {
  if (!isAdminSession(context?.decoded)) {
    throw new Error("Acceso restringido");
  }
}
