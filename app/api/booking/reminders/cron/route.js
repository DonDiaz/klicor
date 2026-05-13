import { NextResponse } from "next/server";
import { runBookingReminderSweep } from "@/lib/booking-firestore";

export async function GET(request) {
  try {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const actions = await runBookingReminderSweep();
    return NextResponse.json({ ok: true, actions });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
