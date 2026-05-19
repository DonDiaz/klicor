import { NextResponse } from "next/server";
import { buildShareProfileUrl, buildVanityProfileUrl } from "@/lib/public-profile-links";
import { formatDate, toDate } from "@/lib/utils";
import { verifyRequest } from "@/lib/auth";
import { getPendingAgencyRequestsForBusiness } from "@/lib/agency";
import { ensureDorikaCoverDownloadUrl, getAccountView, getAdminSettings } from "@/lib/firestore";
import { createServerTiming } from "@/lib/server-timing";
import { getRequestAppUrl } from "@/lib/env";

const SHARE_LINK_VERSION = "v1";
const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
};

export async function GET(request) {
  const timing = createServerTiming();
  try {
    const auth = await timing.measure("auth", () => verifyRequest(request), "verify");
    const { decoded, user } = auth;
    const [settings, repairedUser, agencyRequests] = await Promise.all([
      timing.measure("settings", () => getAdminSettings(), "admin-settings"),
      timing.measure("dorika-cover", () => ensureDorikaCoverDownloadUrl(user.uid, user), "dorika-cover"),
      timing.measure("agency-requests", () => getPendingAgencyRequestsForBusiness(user.uid), "agency-requests"),
    ]);
    const account = getAccountView(repairedUser);
    const updatedAtMs = toDate(account.updatedAt)?.getTime() || 0;
    const appUrl = getRequestAppUrl(request);

    const payload = {
      user: {
        ...account,
        role: user.role,
        emailVerified: Boolean(decoded.email_verified),
        trialEndsAtLabel: formatDate(account.trialEndsAt),
        expiresAtLabel: formatDate(account.expiresAt),
        agencyRequests,
      },
      settings,
      publicUrl: buildVanityProfileUrl(account.username, appUrl),
      shareUrl: buildShareProfileUrl(account.username, `${SHARE_LINK_VERSION}-${updatedAtMs}`, appUrl),
      stablePublicUrl: account.stablePublicUrl || "",
    };

    return NextResponse.json(payload, {
      headers: timing.headers(payload, NO_STORE_HEADERS),
    });
  } catch (error) {
    const payload = { error: error.message };
    return NextResponse.json(payload, {
      status: 401,
      headers: timing.headers(payload, NO_STORE_HEADERS),
    });
  }
}
