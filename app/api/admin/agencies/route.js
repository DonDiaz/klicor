import { NextResponse } from "next/server";
import { requireAdmin, verifyRequest } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { listAgencyAccounts, saveAgencyAccount } from "@/lib/agency";

export async function GET(request) {
  try {
    const auth = await verifyRequest(request);
    requireAdmin(auth);
    return NextResponse.json({ agencies: await listAgencyAccounts() });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(request) {
  try {
    const auth = await verifyRequest(request);
    requireAdmin(auth);
    const body = await request.json().catch(() => ({}));
    const agency = await saveAgencyAccount(body, auth.user);
    writeAuditLog({
      request,
      actor: auth.user,
      role: "admin",
      action: "admin.agencies.save",
      status: "success",
      metadata: { agencyEmail: agency.email, agencyStatus: agency.status },
    }).catch((error) => console.error("[audit-log]", error?.message || error));
    return NextResponse.json({ agency, agencies: await listAgencyAccounts() });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
