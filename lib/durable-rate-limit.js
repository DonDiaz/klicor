import "server-only";

import crypto from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { rateLimitHeaders } from "@/lib/rate-limit";

const DEFAULT_WINDOW_MS = 60_000;

function getClientIp(request) {
  const forwardedFor = request.headers.get("x-forwarded-for") || "";
  const vercelForwardedFor = request.headers.get("x-vercel-forwarded-for") || "";
  const realIp = request.headers.get("x-real-ip") || "";
  const rawIp = forwardedFor || vercelForwardedFor || realIp || "unknown";
  return rawIp.split(",")[0]?.trim() || "unknown";
}

function hashKey(value = "") {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function collection() {
  return getAdminDb().collection("rateLimits");
}

export async function checkDurableRateLimit(request, { key = "global", limit = 30, windowMs = DEFAULT_WINDOW_MS } = {}) {
  const now = Date.now();
  const safeLimit = Math.max(Number(limit) || 1, 1);
  const safeWindowMs = Math.max(Number(windowMs) || DEFAULT_WINDOW_MS, 1000);
  const ip = getClientIp(request);
  const bucket = Math.floor(now / safeWindowMs);
  const docId = hashKey(`${key}:${ip}:${bucket}`);
  const ref = collection().doc(docId);
  let result = null;

  await getAdminDb().runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const current = snap.exists ? Number(snap.data()?.count || 0) : 0;
    const nextCount = current + 1;
    const resetAt = (bucket + 1) * safeWindowMs;

    transaction.set(ref, {
      key,
      bucket,
      count: FieldValue.increment(1),
      resetAt: Timestamp.fromMillis(resetAt),
      updatedAt: FieldValue.serverTimestamp(),
      ...(snap.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    }, { merge: true });

    result = {
      limited: nextCount > safeLimit,
      limit: safeLimit,
      remaining: Math.max(safeLimit - nextCount, 0),
      resetAt,
      retryAfter: Math.max(Math.ceil((resetAt - now) / 1000), 1),
    };
  });

  return result;
}

export function durableRateLimitResponse(result, message = "Demasiadas solicitudes. Intenta de nuevo en unos segundos.") {
  return Response.json(
    { error: message },
    {
      status: 429,
      headers: rateLimitHeaders(result),
    },
  );
}
