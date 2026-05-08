import { NextResponse } from "next/server";
import { buildShareProfileUrl, buildVanityProfileUrl } from "@/lib/public-profile-links";
import { formatDate, toDate } from "@/lib/utils";
import { verifyRequest } from "@/lib/auth";
import { ensureDorikaCoverDownloadUrl, getAccountView, getAdminSettings } from "@/lib/firestore";
import { createServerTiming } from "@/lib/server-timing";

const SHARE_LINK_VERSION = "v1";

export async function GET(request) {
  const timing = createServerTiming();
  try {
    const auth = await timing.measure("auth", () => verifyRequest(request), "verify");
    const { decoded, user } = auth;
    const settings = await timing.measure("settings", () => getAdminSettings(), "admin-settings");
    const repairedUser = await timing.measure("dorika-cover", () => ensureDorikaCoverDownloadUrl(user.uid, user), "dorika-cover");
    const account = getAccountView(repairedUser);
    const updatedAtMs = toDate(account.updatedAt)?.getTime() || 0;

    const payload = {
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
    };

    return NextResponse.json(payload, {
      headers: timing.headers(payload),
    });
  } catch (error) {
    const payload = { error: error.message };
    return NextResponse.json(payload, {
      status: 401,
      headers: timing.headers(payload),
    });
  }
}
