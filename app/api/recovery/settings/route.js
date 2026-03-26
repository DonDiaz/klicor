import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth";
import { getAccountView, resendBackupEmailVerification, saveRecoverySettings } from "@/lib/firestore";
import { sendBackupEmailVerification } from "@/lib/mailer";
import { recoverySchema } from "@/lib/schemas";

function buildVerificationUrl(uid, token) {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${baseUrl}/recovery/verify?uid=${encodeURIComponent(uid)}&token=${encodeURIComponent(token)}`;
}

export async function POST(request) {
  try {
    const { user } = await verifyRequest(request);
    const body = await request.json();
    const parsed = recoverySchema.parse(body);
    const result = await saveRecoverySettings(user.uid, parsed);

    if (result.verification) {
      await sendBackupEmailVerification({
        to: result.verification.email,
        businessName: result.user.businessName,
        verificationUrl: buildVerificationUrl(user.uid, result.verification.token),
        expiresAt: result.verification.expiresAt,
      });
    }

    const account = getAccountView(result.user);
    return NextResponse.json({
      user: {
        backupEmail: account.backupEmail || "",
        backupEmailVerified: Boolean(account.backupEmailVerified),
        recoveryPhone: account.recoveryPhone || "",
        recoveryPhoneVerified: Boolean(account.recoveryPhoneVerified),
        backupEmailVerificationExpiresAt: account.backupEmailVerificationExpiresAt?.toISOString() || null,
      },
      verificationSent: Boolean(result.verification),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(request) {
  try {
    const { user } = await verifyRequest(request);
    const verification = await resendBackupEmailVerification(user.uid);

    await sendBackupEmailVerification({
      to: verification.email,
      businessName: verification.businessName,
      verificationUrl: buildVerificationUrl(user.uid, verification.token),
      expiresAt: verification.expiresAt,
    });

    return NextResponse.json({ resent: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
