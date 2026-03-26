import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { runBillingSweep } from "@/lib/firestore";
import { sendSuspensionEmail, sendUpcomingExpiryEmail } from "@/lib/mailer";
import { toDate } from "@/lib/utils";

export async function GET(request) {
  try {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const actions = await runBillingSweep();
    const usersSnap = await getAdminDb().collection("users").where("status", "in", ["active", "grace_period", "suspended", "trial"]).get();

    for (const doc of usersSnap.docs) {
      const user = doc.data();
      const expiresAt = toDate(user.expiresAt || user.trialEndsAt);
      if (expiresAt) {
        const diff = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (diff === 3 && !user.expiryReminderSentAt) {
          await sendUpcomingExpiryEmail({ ...user, expiresAt });
          await doc.ref.set({ expiryReminderSentAt: new Date() }, { merge: true });
        }
      }
      if (user.status === "suspended" && !user.suspensionEmailSentAt) {
        await sendSuspensionEmail(user);
        await doc.ref.set({ suspensionEmailSentAt: new Date() }, { merge: true });
      }
    }

    return NextResponse.json({ ok: true, actions });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}