import crypto from "node:crypto";

function parseSignatureHeader(signatureHeader = "") {
  const values = Object.fromEntries(
    String(signatureHeader)
      .split(",")
      .map((part) => part.trim().split("=", 2))
      .filter(([key, value]) => key && value),
  );

  return {
    ts: values.ts || "",
    v1: values.v1 || "",
  };
}

function buildSignatureTemplate({ dataId, requestId, ts }) {
  const segments = [];
  if (dataId) segments.push(`id:${String(dataId).toLowerCase()};`);
  if (requestId) segments.push(`request-id:${requestId};`);
  if (ts) segments.push(`ts:${ts};`);
  return segments.join("");
}

function safeCompare(hexA, hexB) {
  const a = Buffer.from(String(hexA || ""), "hex");
  const b = Buffer.from(String(hexB || ""), "hex");
  if (!a.length || !b.length || a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

export function verifyMercadoPagoWebhook({ signatureHeader, requestIdHeader, dataId, secret }) {
  if (!secret) {
    return { ok: true, skipped: true, reason: "missing_secret" };
  }

  const { ts, v1 } = parseSignatureHeader(signatureHeader);
  if (!ts || !v1) {
    return { ok: false, reason: "missing_signature_parts" };
  }

  const template = buildSignatureTemplate({
    dataId,
    requestId: requestIdHeader,
    ts,
  });

  const expected = crypto
    .createHmac("sha256", secret)
    .update(template)
    .digest("hex");

  return {
    ok: safeCompare(expected, v1),
    skipped: false,
    reason: "verified",
  };
}
