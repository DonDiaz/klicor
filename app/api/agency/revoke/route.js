import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth";
import { revokeAgencyAccess } from "@/lib/agency";

export async function POST(request) {
  try {
    const { user } = await verifyRequest(request);
    return NextResponse.json(await revokeAgencyAccess({ businessUser: user }));
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
