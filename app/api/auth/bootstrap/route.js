import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { sendWelcomeEmail } from "@/lib/mailer";

export async function POST(request) {
  try {
    const { decoded, user } = await verifyRequest(request);
    const body = await request.json().catch(() => ({}));
    const updates = {
      emailVerified: Boolean(decoded.email_verified),
      updatedAt: new Date(),
    };

    if (decoded.email_verified && !user.welcomeEmailSent) {
      await sendWelcomeEmail(user);
      updates.welcomeEmailSent = true;
    }

    if (body.welcome && !user.welcomeEmailSent) {
      await sendWelcomeEmail(user);
      updates.welcomeEmailSent = true;
    }

    await getAdminDb().collection("users").doc(decoded.uid).set(updates, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}