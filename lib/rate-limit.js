const buckets = new Map();
const DEFAULT_WINDOW_MS = 60_000;
const MAX_BUCKETS = 5000;

function getClientIp(request) {
  const forwardedFor = request.headers.get("x-forwarded-for") || "";
  const vercelForwardedFor = request.headers.get("x-vercel-forwarded-for") || "";
  const realIp = request.headers.get("x-real-ip") || "";
  const rawIp = forwardedFor || vercelForwardedFor || realIp || "unknown";
  return rawIp.split(",")[0]?.trim() || "unknown";
}

function pruneBuckets(now) {
  if (buckets.size <= MAX_BUCKETS) return;
  for (const [key, value] of buckets.entries()) {
    if (value.resetAt <= now) buckets.delete(key);
  }
}

export function checkRateLimit(request, { key = "global", limit = 60, windowMs = DEFAULT_WINDOW_MS } = {}) {
  const now = Date.now();
  const safeLimit = Math.max(Number(limit) || 1, 1);
  const safeWindowMs = Math.max(Number(windowMs) || DEFAULT_WINDOW_MS, 1000);
  const bucketKey = `${key}:${getClientIp(request)}`;
  const current = buckets.get(bucketKey);

  if (!current || current.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + safeWindowMs });
    pruneBuckets(now);
    return {
      limited: false,
      limit: safeLimit,
      remaining: safeLimit - 1,
      resetAt: now + safeWindowMs,
      retryAfter: 0,
    };
  }

  current.count += 1;
  const retryAfter = Math.ceil((current.resetAt - now) / 1000);
  return {
    limited: current.count > safeLimit,
    limit: safeLimit,
    remaining: Math.max(safeLimit - current.count, 0),
    resetAt: current.resetAt,
    retryAfter,
  };
}

export function rateLimitHeaders(result) {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    ...(result.limited ? { "Retry-After": String(result.retryAfter) } : {}),
  };
}

export function rateLimitResponse(result, message = "Demasiadas solicitudes. Intenta de nuevo en unos segundos.") {
  return Response.json(
    { error: message },
    {
      status: 429,
      headers: rateLimitHeaders(result),
    },
  );
}
