import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth";
import { getAgencyDashboard } from "@/lib/agency";
import { getRequestAppUrl } from "@/lib/env";

export async function GET(request) {
  try {
    const { user } = await verifyRequest(request);
    return NextResponse.json(await getAgencyDashboard(user, { baseUrl: getRequestAppUrl(request) }));
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}
