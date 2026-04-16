import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth";
import { PLAN_SLUG } from "@/lib/constants";
import { createPreference } from "@/lib/mercadopago";
import { getAdminSettings } from "@/lib/firestore";
import { getPlanAnnualPrice, normalizeKlicorPlan } from "@/lib/plans";

export async function POST(request) {
  try {
    const { decoded, user } = await verifyRequest(request);
    if (!decoded.email_verified) {
      return NextResponse.json({ error: "Debes verificar tu correo antes de pagar" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const plan = normalizeKlicorPlan(body?.plan || PLAN_SLUG);
    const settings = await getAdminSettings();
    const annualPrice = getPlanAnnualPrice(plan, settings);
    const preference = await createPreference({ user, plan, annualPrice });
    return NextResponse.json({
      preferenceId: preference.id,
      initPoint: preference.init_point || preference.sandbox_init_point || "",
      sandboxInitPoint: preference.sandbox_init_point || "",
      publicKey: process.env.MERCADOPAGO_PUBLIC_KEY || "",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
