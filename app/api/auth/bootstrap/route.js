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
    let warning = null;
    const shouldSendWelcome = !user.welcomeEmailSent && (Boolean(decoded.email_verified) || Boolean(body.welcome));

    if (shouldSendWelcome) {
      try {
        await sendWelcomeEmail(user);
        updates.welcomeEmailSent = true;
      } catch (error) {
        warning = error.message || "No pudimos enviar el correo de bienvenida.";
      }
    }

    await getAdminDb().collection("users").doc(decoded.uid).set(updates, { merge: true });
    return NextResponse.json({ ok: true, warning });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
