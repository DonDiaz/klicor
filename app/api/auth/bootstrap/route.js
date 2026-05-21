import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { recordUserLegalAcceptance } from "@/lib/firestore";
import { sendWelcomeEmail } from "@/lib/mailer";

function getRequestIp(request) {
  return request.headers.get("x-forwarded-for")
    || request.headers.get("x-vercel-forwarded-for")
    || request.headers.get("x-real-ip")
    || "";
}

function isLegalAcceptanceError(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("terminos") || message.includes("términos") || message.includes("crear tu cuenta") || message.includes("vigentes");
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { decoded, user, claimsUpdated } = await verifyRequest(request, {
      legalAcceptance: body.legalAcceptance,
      requireCurrentLegal: true,
    });
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
    if (body.legalAcceptance?.accepted) {
      await recordUserLegalAcceptance(decoded.uid, body.legalAcceptance, {
        ip: getRequestIp(request),
        userAgent: request.headers.get("user-agent") || "",
      });
    }
    return NextResponse.json({ ok: true, warning, claimsUpdated });
  } catch (error) {
    if (isLegalAcceptanceError(error)) {
      return NextResponse.json(
        { error: error.message, code: "LEGAL_ACCEPTANCE_REQUIRED" },
        { status: 428 },
      );
    }

    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
