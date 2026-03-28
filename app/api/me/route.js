import { NextResponse } from "next/server";
import { buildShareProfileUrl, buildVanityProfileUrl } from "@/lib/public-profile-links";
import { formatDate, toDate } from "@/lib/utils";
import { verifyRequest, requireAdmin } from "@/lib/auth";
import { getAccountView, getAdminSettings } from "@/lib/firestore";
import { getAdminDb } from "@/lib/firebase-admin";

const SHARE_LINK_VERSION = "v1";

export async function GET(request) {
  try {
    const auth = await verifyRequest(request);
    const { decoded, user } = auth;
    const settings = await getAdminSettings();
    const account = getAccountView(user);
    const updatedAtMs = toDate(account.updatedAt)?.getTime() || 0;
    let adminUsers = [];

    if (user.role === "admin") {
      requireAdmin(auth);
      const usersSnap = await getAdminDb().collection("users").orderBy("createdAt", "desc").limit(25).get();
      adminUsers = usersSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          uid: data.uid,
          businessName: data.businessName,
          email: data.email,
          status: data.status,
          plan: data.plan,
          expiresAtLabel: formatDate(toDate(data.expiresAt)),
        };
      });
    }

    return NextResponse.json({
      user: {
        ...account,
        role: user.role,
        emailVerified: Boolean(decoded.email_verified),
        trialEndsAtLabel: formatDate(account.trialEndsAt),
        expiresAtLabel: formatDate(account.expiresAt),
      },
      settings,
      publicUrl: buildVanityProfileUrl(account.username),
      shareUrl: buildShareProfileUrl(account.username, `${SHARE_LINK_VERSION}-${updatedAtMs}`),
      stablePublicUrl: account.stablePublicUrl || "",
      adminUsers,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
