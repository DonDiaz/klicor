import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth";
import { assertAgencyBusinessAccess } from "@/lib/agency";
import { getAdminStorage } from "@/lib/firebase-admin";
import { sanitizeSlug } from "@/lib/utils";

export async function GET(request) {
  try {
    const { user } = await verifyRequest(request);
    const { searchParams } = new URL(request.url);
    const targetUid = String(searchParams.get("targetUid") || "").trim();
    const agencyAccess = targetUid ? await assertAgencyBusinessAccess(user, targetUid, "publicProfile") : null;
    const effectiveUser = agencyAccess?.business || user;

    if (!effectiveUser?.qrPath) {
      return NextResponse.json({ error: "Todavia no tienes un QR generado" }, { status: 404 });
    }

    const [buffer] = await getAdminStorage().file(effectiveUser.qrPath).download();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${sanitizeSlug(effectiveUser.username) || "klicor"}-qr.png"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "No se pudo descargar el QR" }, { status: 400 });
  }
}
