import { NextResponse } from "next/server";
import { getUserByUsername } from "@/lib/firestore";
import { getAdminStorage } from "@/lib/firebase-admin";

export async function GET(_request, { params }) {
  const { username } = await params;
  const user = await getUserByUsername(username);

  if (!user?.paymentQrPath) {
    return NextResponse.json({ error: "QR oficial no encontrado" }, { status: 404 });
  }

  try {
    const file = getAdminStorage().file(user.paymentQrPath);
    const [buffer] = await file.download();
    const [metadata] = await file.getMetadata();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": metadata.contentType || "image/png",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("[public-payment-qr]", error?.message || error);
    return NextResponse.json({ error: "No se pudo cargar el QR oficial" }, { status: 400 });
  }
}
