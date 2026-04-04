import { NextResponse } from "next/server";
import {
  extendAdminUserAccess,
  getAdminUserDetail,
  registerAdminManualPayment,
  updateAdminUserAccess,
  updateAdminUserDetails,
} from "@/lib/admin-panel";
import { requireAdmin, verifyRequest } from "@/lib/auth";
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
    return NextResponse.json(await getAdminUserDetail(params.uid));
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const auth = await verifyRequest(request);
    requireAdmin(auth);
    const body = await request.json();
    const action = String(body?.action || "").trim().toLowerCase();

    if (action === "save_details") {
      const parsed = adminUserDetailsSchema.parse(body);
      return NextResponse.json(await updateAdminUserDetails(params.uid, parsed, auth.user));
    }

    if (action === "set_access") {
      const parsed = adminUserAccessSchema.parse(body);
      return NextResponse.json(await updateAdminUserAccess(params.uid, parsed, auth.user));
    }

    if (action === "extend_access") {
      const parsed = adminUserExtensionSchema.parse(body);
      return NextResponse.json(await extendAdminUserAccess(params.uid, parsed.days, auth.user));
    }

    if (action === "register_payment") {
      const parsed = adminManualPaymentSchema.parse(body);
      return NextResponse.json(await registerAdminManualPayment(params.uid, parsed, auth.user));
    }

    return NextResponse.json({ error: "Acción administrativa no soportada" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
