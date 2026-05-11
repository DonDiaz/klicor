import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth";
import { PLAN_SLUG } from "@/lib/constants";
import { createPreference } from "@/lib/mercadopago";
import { getAdminSettings } from "@/lib/firestore";
import { calculateCommercialToPlusUpgrade } from "@/lib/billing-rules";
import { BILLABLE_PLAN_VALUES, getPlanAnnualPrice, normalizeKlicorModule, normalizeKlicorPlan, resolvePrimaryModuleForBusinessCategory } from "@/lib/plans";
import { toDate } from "@/lib/utils";

export async function POST(request) {
  try {
    const { decoded, user } = await verifyRequest(request);
    if (!decoded.email_verified) {
      return NextResponse.json({ error: "Debes verificar tu correo antes de pagar" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const plan = normalizeKlicorPlan(body?.plan || PLAN_SLUG);
    if (!BILLABLE_PLAN_VALUES.includes(plan)) {
      throw new Error("Selecciona un plan válido para pagar.");
    }
    const requestedModule = normalizeKlicorModule(body?.module || body?.selectedModule);
    const module = plan === "commercial"
      ? requestedModule || normalizeKlicorModule(user.commercialModule) || resolvePrimaryModuleForBusinessCategory(user.businessCategory)
      : "";
    const settings = await getAdminSettings();
    const currentPlan = normalizeKlicorPlan(user.plan || "");
    const annualPrice = getPlanAnnualPrice(plan, settings);
    const now = new Date();
    const currentExpiry = toDate(user.expiresAt);
    const paymentType = currentPlan === "commercial" && plan === "plus" ? "upgrade" : "subscription";
    const metadata = {
      payment_type: paymentType,
      module,
      from_plan: paymentType === "upgrade" ? currentPlan : "",
      to_plan: plan,
    };

    let amountToCharge = annualPrice;
    let titleSuffix = "pago anual";

    if (paymentType === "upgrade") {
      const commercialPrice = getPlanAnnualPrice("commercial", settings);
      const upgrade = calculateCommercialToPlusUpgrade({
        now,
        currentExpiresAt: currentExpiry,
        commercialAnnualPrice: commercialPrice,
        plusAnnualPrice: annualPrice,
      });
      amountToCharge = upgrade.amountToCharge;
      Object.assign(metadata, {
        credit_amount: upgrade.creditAmount,
        amount_charged: amountToCharge,
        previous_expires_at: currentExpiry?.toISOString?.() || "",
        new_expires_at: upgrade.newExpiresAt.toISOString(),
      });
      titleSuffix = "upgrade a Plus";
    }

    const preference = await createPreference({
      user,
      plan,
      annualPrice: amountToCharge,
      metadata,
      titleSuffix,
    });
    return NextResponse.json({
      preferenceId: preference.id,
      initPoint: preference.init_point || preference.sandbox_init_point || "",
      sandboxInitPoint: preference.sandbox_init_point || "",
      publicKey: process.env.MERCADOPAGO_PUBLIC_KEY || "",
      plan,
      module,
      paymentType,
      amountToCharge,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
