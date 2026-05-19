import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { createAgencyAccessRequest } from "@/lib/agency";

export async function POST(request) {
  try {
    const { user } = await verifyRequest(request);
    const body = await request.json().catch(() => ({}));
    const accessRequest = await createAgencyAccessRequest({
      agencyUser: user,
      businessEmail: body.businessEmail,
      message: body.message,
    });
    writeAuditLog({
      request,
      actor: user,
      role: "agency",
      action: "agency.request_access",
      targetUid: accessRequest.businessUid,
      status: "success",
      metadata: { requestId: accessRequest.id, businessEmail: accessRequest.businessEmail },
    }).catch((error) => console.error("[audit-log]", error?.message || error));
    return NextResponse.json({ request: accessRequest });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
