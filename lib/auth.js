import "server-only";
import { getAdminAuth } from "@/lib/firebase-admin";
import { ensureUserProfile, getUserByUid } from "@/lib/firestore";

export async function verifyRequest(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    throw new Error("No autorizado");
  }

  const decoded = await getAdminAuth().verifyIdToken(token);
  await ensureUserProfile({
    uid: decoded.uid,
    email: decoded.email || "",
    name: decoded.name || "",
    photoURL: decoded.picture || "",
    role: decoded.email === process.env.ADMIN_EMAIL ? "admin" : "user",
  });
  const user = await getUserByUid(decoded.uid);

  return { decoded, user };
}

export function requireAdmin(user) {
  if (!user || (user.role !== "admin" && user.email !== process.env.ADMIN_EMAIL)) {
    throw new Error("Acceso restringido");
  }
}