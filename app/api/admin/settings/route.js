import { NextResponse } from "next/server";
import { verifyRequest, requireAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { saveAdminSettings } from "@/lib/admin-panel";
import { getAdminSettings } from "@/lib/firestore";
import { adminSettingsSchema, priceSchema } from "@/lib/schemas";

export async function GET(request) {
  try {
    const auth = await verifyRequest(request);
    requireAdmin(auth);
    return NextResponse.json({ settings: await getAdminSettings() });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

async function handleUpdate(request, isLegacy = false) {
  try {
    const auth = await verifyRequest(request);
    requireAdmin(auth);
    const body = await request.json();
    const parsed = isLegacy ? priceSchema.parse(body) : adminSettingsSchema.parse(body);

    await saveAdminSettings(isLegacy ? { annualPrice: parsed.annualPrice } : parsed, auth.user);
    writeAuditLog({
      request,
      actor: auth.user,
      role: "admin",
      action: isLegacy ? "admin.settings.legacy_price_update" : "admin.settings.update",
      status: "success",
    }).catch((error) => console.error("[audit-log]", error?.message || error));

    return NextResponse.json({ settings: await getAdminSettings() });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PATCH(request) {
  return handleUpdate(request, false);
}

export async function POST(request) {
  return handleUpdate(request, true);
}
