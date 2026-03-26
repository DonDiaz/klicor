import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth";
import { createPreference } from "@/lib/mercadopago";
import { getAdminSettings } from "@/lib/firestore";

export async function POST(request) {
  try {
    const { decoded, user } = await verifyRequest(request);
    if (!decoded.email_verified) {
      return NextResponse.json({ error: "Debes verificar tu correo antes de pagar" }, { status: 403 });
    }

    const settings = await getAdminSettings();
    const preference = await createPreference({ user, annualPrice: settings.annualPrice });
    return NextResponse.json({
      preferenceId: preference.id,
      initPoint: preference.sandbox_init_point || preference.init_point,
      publicKey: process.env.MERCADOPAGO_PUBLIC_KEY || "",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
