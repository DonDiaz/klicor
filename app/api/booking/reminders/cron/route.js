import { NextResponse } from "next/server";
import { runBookingReminderSweep } from "@/lib/booking-firestore";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
};

async function handleReminderSweep(request) {
  try {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
    }

    const actions = await runBookingReminderSweep();
    return NextResponse.json({ ok: true, actions }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400, headers: NO_STORE_HEADERS });
  }
}

export async function GET(request) {
  return handleReminderSweep(request);
}

export async function POST(request) {
  return handleReminderSweep(request);
}
