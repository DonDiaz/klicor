import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth";
import { assertAgencyCanEditBusiness } from "@/lib/agency";
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
    return NextResponse.json({
      ok: true,
      user: getAccountView(updatedUser),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
