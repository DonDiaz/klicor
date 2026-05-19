import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { revokeAgencyAccess } from "@/lib/agency";

export async function POST(request) {
  try {
    const { user } = await verifyRequest(request, { checkRevoked: true });
    const result = await revokeAgencyAccess({ businessUser: user });
    writeAuditLog({
      request,
      actor: user,
      role: "owner",
      action: "agency.revoke",
      targetUid: user.uid,
      status: "success",
    }).catch((error) => console.error("[audit-log]", error?.message || error));
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
