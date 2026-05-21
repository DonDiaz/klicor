import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { PLAN_SLUG } from "@/lib/constants";
import { createPreference } from "@/lib/mercadopago";
import { getAdminSettings } from "@/lib/firestore";
import { assertAgencyBusinessAccess } from "@/lib/agency";
import { assertNoActivePlanDowngrade, calculatePlanUpgrade, isActivePaidPlan, isPlanUpgrade } from "@/lib/billing-rules";
import { isBusinessModuleEligible } from "@/lib/business-categories";
import { BILLABLE_PLAN_VALUES, getPlanAnnualPrice, getPlanDefinition, normalizeKlicorModule, normalizeKlicorPlan, resolvePrimaryModuleForBusinessCategory } from "@/lib/plans";
import { toDate } from "@/lib/utils";

export async function POST(request) {
  try {
    const { decoded, user } = await verifyRequest(request, { checkRevoked: true });
    if (!decoded.email_verified) {
      return NextResponse.json({ error: "Debes verificar tu correo antes de pagar" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const targetUid = String(body?.targetUid || "").trim();
    const agencyAccess = targetUid ? await assertAgencyBusinessAccess(user, targetUid, "subscriptionRenewal") : null;
    const effectiveUser = agencyAccess?.business || user;
    const plan = normalizeKlicorPlan(body?.plan || PLAN_SLUG);
    if (!BILLABLE_PLAN_VALUES.includes(plan)) {
      throw new Error("Selecciona un plan válido para pagar.");
    }
    const requestedModule = normalizeKlicorModule(body?.module || body?.selectedModule);
    const defaultModule = normalizeKlicorModule(effectiveUser.commercialModule)
      || resolvePrimaryModuleForBusinessCategory(effectiveUser.businessCategory, effectiveUser.businessType || effectiveUser.dorikaProfile?.businessType);
    const effectiveModule = plan === "commercial" ? requestedModule || defaultModule : "";
    if (effectiveModule && !isBusinessModuleEligible(effectiveUser, effectiveModule)) {
      throw new Error(`${effectiveModule === "booking" ? "Agenda" : "Comercio"} no está disponible para este tipo de negocio.`);
    }
    const settings = await getAdminSettings();
    const currentPlan = normalizeKlicorPlan(effectiveUser.plan || "");
    const annualPrice = getPlanAnnualPrice(plan, settings);
    const now = new Date();
    const currentExpiry = toDate(effectiveUser.expiresAt);
    assertNoActivePlanDowngrade({
      status: effectiveUser.status,
      currentPlan,
      requestedPlan: plan,
      currentExpiresAt: currentExpiry,
      now,
    });
    const isUpgrade = isActivePaidPlan({
      status: effectiveUser.status,
      currentPlan,
      currentExpiresAt: currentExpiry,
      now,
    }) && isPlanUpgrade({ currentPlan, requestedPlan: plan });
    const paymentType = isUpgrade ? "upgrade" : "subscription";
    const metadata = {
      payment_type: paymentType,
      module: effectiveModule,
      from_plan: paymentType === "upgrade" ? currentPlan : "",
      to_plan: plan,
    };

    let amountToCharge = annualPrice;
    let titleSuffix = "pago anual";

    if (paymentType === "upgrade") {
      const currentAnnualPrice = getPlanAnnualPrice(currentPlan, settings);
      const upgrade = calculatePlanUpgrade({
        now,
        currentExpiresAt: currentExpiry,
        currentAnnualPrice,
        requestedAnnualPrice: annualPrice,
      });
      amountToCharge = upgrade.amountToCharge;
      Object.assign(metadata, {
        credit_amount: upgrade.creditAmount,
        amount_charged: amountToCharge,
        current_annual_price: currentAnnualPrice,
        requested_annual_price: annualPrice,
        previous_expires_at: currentExpiry?.toISOString?.() || "",
        new_expires_at: upgrade.newExpiresAt.toISOString(),
      });
      titleSuffix = `upgrade a ${getPlanDefinition(plan).publicName}`;
    }

    const preference = await createPreference({
      user: effectiveUser,
      plan,
      annualPrice: amountToCharge,
      metadata,
      titleSuffix,
    });
    writeAuditLog({
      request,
      actor: user,
      role: agencyAccess ? "agency" : "owner",
      action: "billing.create_preference",
      targetUid: effectiveUser.uid,
      status: "success",
      metadata: { plan, module: effectiveModule, paymentType, amountToCharge },
    }).catch((error) => console.error("[audit-log]", error?.message || error));
    return NextResponse.json({
      preferenceId: preference.id,
      initPoint: preference.init_point || preference.sandbox_init_point || "",
      sandboxInitPoint: preference.sandbox_init_point || "",
      publicKey: process.env.MERCADOPAGO_PUBLIC_KEY || "",
      plan,
      module: effectiveModule,
      paymentType,
      amountToCharge,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
