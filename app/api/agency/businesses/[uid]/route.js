import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth";
import { assertAgencyBusinessAccess, canAgencyEditBusinessStatus } from "@/lib/agency";
import { buildShareProfileUrl, buildVanityProfileUrl } from "@/lib/public-profile-links";
import { ensureDorikaCoverDownloadUrl, getAccountView, getAdminSettings } from "@/lib/firestore";
import { getRequestAppUrl } from "@/lib/env";
import { formatDate, toDate } from "@/lib/utils";

const SHARE_LINK_VERSION = "v1";

export async function GET(request, { params }) {
  try {
    const { decoded, user } = await verifyRequest(request);
    const { uid } = await params;
    const access = await assertAgencyBusinessAccess(user, uid, "publicProfile");
    const settings = await getAdminSettings();
    const repairedUser = await ensureDorikaCoverDownloadUrl(access.business.uid, access.business);
    const account = getAccountView(repairedUser);
    const updatedAtMs = toDate(account.updatedAt)?.getTime() || 0;
    const appUrl = getRequestAppUrl(request);

    return NextResponse.json({
      agency: access.agency,
      permissions: access.permissions,
      canEdit: canAgencyEditBusinessStatus(account.status),
      user: {
        ...account,
        role: "user",
        emailVerified: Boolean(decoded.email_verified),
        trialEndsAtLabel: formatDate(account.trialEndsAt),
        expiresAtLabel: formatDate(account.expiresAt),
        agencyRequests: [],
      },
      settings,
      publicUrl: buildVanityProfileUrl(account.username, appUrl),
      shareUrl: buildShareProfileUrl(account.username, `${SHARE_LINK_VERSION}-${updatedAtMs}`, appUrl),
      stablePublicUrl: account.stablePublicUrl || "",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}
