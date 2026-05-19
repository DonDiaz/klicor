import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth";
import { assertAgencyCanEditBusiness, recordAgencyEdit } from "@/lib/agency";
import { writeAuditLog } from "@/lib/audit-log";
import { enableUserModule, getAccountView } from "@/lib/firestore";
import { normalizeKlicorModule } from "@/lib/plans";

export async function POST(request) {
  try {
    const { user } = await verifyRequest(request);
    const body = await request.json().catch(() => ({}));
    const module = normalizeKlicorModule(body?.module);
    const targetUid = String(body?.targetUid || "").trim();
    const agencyAccess = targetUid ? await assertAgencyCanEditBusiness(user, targetUid, module) : null;
    const effectiveUser = agencyAccess?.business || user;
    const updatedUser = await enableUserModule(effectiveUser.uid, module);
    if (agencyAccess) {
      await recordAgencyEdit(agencyAccess, `module:${module}`);
    }
    writeAuditLog({
      request,
      actor: user,
      role: agencyAccess ? "agency" : user.role || "owner",
      action: "modules.enable",
      targetUid: effectiveUser.uid,
      status: "success",
      metadata: { module, agencyMode: Boolean(agencyAccess) },
    }).catch((error) => console.error("[audit-log]", error?.message || error));
    return NextResponse.json({
      ok: true,
      user: getAccountView(updatedUser),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
