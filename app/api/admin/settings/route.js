import { NextResponse } from "next/server";
import { verifyRequest, requireAdmin } from "@/lib/auth";
import { getAdminSettings, updateBillingPrice } from "@/lib/firestore";
import { priceSchema } from "@/lib/schemas";

export async function POST(request) {
  try {
    const auth = await verifyRequest(request);
    requireAdmin(auth);
    const body = await request.json();
    const parsed = priceSchema.parse(body);
    await updateBillingPrice(parsed.annualPrice);
    return NextResponse.json({ settings: await getAdminSettings() });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
