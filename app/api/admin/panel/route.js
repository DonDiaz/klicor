import { NextResponse } from "next/server";
import { requireAdmin, verifyRequest } from "@/lib/auth";
import { getAdminPanelSnapshot } from "@/lib/admin-panel";

export async function GET(request) {
  try {
    const auth = await verifyRequest(request);
    requireAdmin(auth);
    return NextResponse.json(await getAdminPanelSnapshot());
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
