import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";

function cleanText(value = "", max = 180) {
  return String(value || "").replace(/[\r\n\t]+/g, " ").trim().slice(0, max);
}

function safeMetadata(input = {}) {
  return Object.entries(input || {}).reduce((acc, [key, value]) => {
    const cleanKey = cleanText(key, 60);
    if (!cleanKey) return acc;
    if (value === null || value === undefined) {
      acc[cleanKey] = "";
    } else if (typeof value === "number" || typeof value === "boolean") {
      acc[cleanKey] = value;
    } else {
      acc[cleanKey] = cleanText(value, 300);
    }
    return acc;
  }, {});
}

function getRequestIp(request) {
  const forwardedFor = request?.headers?.get?.("x-forwarded-for") || "";
  const vercelForwardedFor = request?.headers?.get?.("x-vercel-forwarded-for") || "";
  const realIp = request?.headers?.get?.("x-real-ip") || "";
  return String(forwardedFor || vercelForwardedFor || realIp || "").split(",")[0]?.trim().slice(0, 120) || "";
}

export async function writeAuditLog({ request = null, actor = {}, role = "", action = "", targetUid = "", status = "success", metadata = {} } = {}) {
  const cleanAction = cleanText(action, 120);
  if (!cleanAction) return null;

  const ref = getAdminDb().collection("auditLogs").doc();
  await ref.set({
    action: cleanAction,
    status: cleanText(status, 40) || "success",
    actorUid: cleanText(actor?.uid || actor?.id || "", 140),
    actorEmail: cleanText(actor?.email || "", 180),
    actorRole: cleanText(role || actor?.role || "", 80),
    targetUid: cleanText(targetUid, 140),
    ip: getRequestIp(request),
    userAgent: cleanText(request?.headers?.get?.("user-agent") || "", 300),
    metadata: safeMetadata(metadata),
    createdAt: FieldValue.serverTimestamp(),
  });

  return ref.id;
}
