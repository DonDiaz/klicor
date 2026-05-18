import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth";
import { createAgencyAccessRequest } from "@/lib/agency";

export async function POST(request) {
  try {
    const { user } = await verifyRequest(request);
    const body = await request.json().catch(() => ({}));
    const accessRequest = await createAgencyAccessRequest({
      agencyUser: user,
      businessEmail: body.businessEmail,
      message: body.message,
    });
    return NextResponse.json({ request: accessRequest });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
