import { NextResponse } from "next/server";
import {
  deleteAdminUserAccount,
  extendAdminUserAccess,
  getAdminUserDetail,
  registerAdminManualPayment,
  updateAdminUserAccess,
  updateAdminUserDetails,
} from "@/lib/admin-panel";
import { requireAdmin, verifyRequest } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { getRequestAppUrl } from "@/lib/env";
import {
  adminManualPaymentSchema,
  adminUserAccessSchema,
  adminUserDetailsSchema,
  adminUserExtensionSchema,
} from "@/lib/schemas";

export async function GET(request, { params }) {
  try {
    const auth = await verifyRequest(request);
    requireAdmin(auth);
    return NextResponse.json(await getAdminUserDetail(params.uid, { baseUrl: getRequestAppUrl(request) }));
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const auth = await verifyRequest(request);
    requireAdmin(auth);
    const baseUrl = getRequestAppUrl(request);
    const body = await request.json();
    const action = String(body?.action || "").trim().toLowerCase();
    const audit = (status = "success", metadata = {}) => writeAuditLog({
      request,
      actor: auth.user,
      role: "admin",
      action: `admin.users.${action || "unknown"}`,
      targetUid: params.uid,
      status,
      metadata,
    }).catch((error) => console.error("[audit-log]", error?.message || error));

    if (action === "save_details") {
      const parsed = adminUserDetailsSchema.parse(body);
      const result = await updateAdminUserDetails(params.uid, parsed, auth.user, { baseUrl });
      audit();
      return NextResponse.json(result);
    }

    if (action === "set_access") {
      const parsed = adminUserAccessSchema.parse(body);
      const result = await updateAdminUserAccess(params.uid, parsed, auth.user, { baseUrl });
      audit("success", { status: parsed.status, plan: parsed.plan });
      return NextResponse.json(result);
    }

    if (action === "extend_access") {
      const parsed = adminUserExtensionSchema.parse(body);
      const result = await extendAdminUserAccess(params.uid, parsed.days, auth.user, { baseUrl });
      audit("success", { days: parsed.days });
      return NextResponse.json(result);
    }

    if (action === "register_payment") {
      const parsed = adminManualPaymentSchema.parse(body);
      const result = await registerAdminManualPayment(params.uid, parsed, auth.user, { baseUrl });
      audit("success", { amount: parsed.amount, plan: parsed.plan });
      return NextResponse.json(result);
    }

    if (action === "delete_user") {
      const result = await deleteAdminUserAccount(params.uid, auth.user);
      audit();
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Acción administrativa no soportada" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
