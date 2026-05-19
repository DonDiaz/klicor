import "server-only";

import { NextResponse } from "next/server";
import { getAdminAppCheck } from "@/lib/firebase-admin";

function getMode() {
  const value = String(process.env.FIREBASE_APP_CHECK_MODE || process.env.APP_CHECK_MODE || "").trim().toLowerCase();
  if (value === "enforce" || value === "required") return "enforce";
  if (value === "monitor" || value === "report") return "monitor";
  return "off";
}

export function appCheckMode() {
  return getMode();
}

export async function verifyAppCheckRequest(request, { consume = false, label = "api" } = {}) {
  const mode = getMode();
  if (mode === "off") {
    return { ok: true, skipped: true, mode };
  }

  const token = request.headers.get("x-firebase-appcheck") || "";
  if (!token) {
    if (mode === "monitor") {
      console.warn("[app-check]", label, "missing-token");
      return { ok: true, skipped: true, mode, warning: "missing-token" };
    }
    return { ok: false, mode, reason: "missing-token" };
  }

  try {
    const claims = await getAdminAppCheck().verifyToken(token, consume ? { consume: true } : undefined);
    if (consume && claims?.alreadyConsumed) {
      if (mode === "monitor") {
        console.warn("[app-check]", label, "already-consumed");
        return { ok: true, skipped: false, mode, warning: "already-consumed" };
      }
      return { ok: false, mode, reason: "already-consumed" };
    }
    return { ok: true, skipped: false, mode, appId: claims?.appId || "" };
  } catch (error) {
    if (mode === "monitor") {
      console.warn("[app-check]", label, error?.message || error);
      return { ok: true, skipped: true, mode, warning: "invalid-token" };
    }
    return { ok: false, mode, reason: "invalid-token" };
  }
}

export function appCheckResponse(result) {
  return NextResponse.json(
    { error: "Solicitud no autorizada." },
    {
      status: 401,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Klicor-App-Check": result?.reason || "failed",
      },
    },
  );
}
