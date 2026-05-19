import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { respondAgencyAccessRequest } from "@/lib/agency";

export async function POST(request) {
  try {
    const { user } = await verifyRequest(request);
    const body = await request.json().catch(() => ({}));
    const result = await respondAgencyAccessRequest({
      businessUser: user,
      requestId: body.requestId,
      action: body.action,
    });
    writeAuditLog({
      request,
      actor: user,
      role: "owner",
      action: `agency.respond.${String(body.action || "unknown").trim().toLowerCase()}`,
      targetUid: user.uid,
      status: "success",
      metadata: { requestId: body.requestId, resultStatus: result.status },
    }).catch((error) => console.error("[audit-log]", error?.message || error));
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
