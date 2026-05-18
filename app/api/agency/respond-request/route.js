import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth";
import { respondAgencyAccessRequest } from "@/lib/agency";

export async function POST(request) {
  try {
    const { user } = await verifyRequest(request);
    const body = await request.json().catch(() => ({}));
    const result = await respondAgencyAccessRequest({
      businessUser: user,
      requestId: body.requestId,
      action: body.action,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
