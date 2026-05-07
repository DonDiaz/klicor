import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth";
import { getAdminStorage } from "@/lib/firebase-admin";
import { sanitizeSlug } from "@/lib/utils";

export async function GET(request) {
  try {
    const { user } = await verifyRequest(request);
    if (!user?.qrPath) {
      return NextResponse.json({ error: "Todavía no tienes un QR generado" }, { status: 404 });
    }

    const [buffer] = await getAdminStorage().file(user.qrPath).download();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${sanitizeSlug(user.username) || "klicor"}-qr.png"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "No se pudo descargar el QR" }, { status: 400 });
  }
}
