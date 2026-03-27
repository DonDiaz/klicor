import { NextResponse } from "next/server";
import { buildShareProfileUrl } from "@/lib/public-profile-links";
import { profileSchema } from "@/lib/schemas";
import { verifyRequest } from "@/lib/auth";
import { getAccountView, updateUserProfile } from "@/lib/firestore";
import { getAppearanceWarnings } from "@/lib/theme-system";
import { toDate } from "@/lib/utils";

const SHARE_LINK_VERSION = "v1";

export async function POST(request) {
  try {
    const { user } = await verifyRequest(request);
    if (!["trial", "active"].includes(user.status)) {
      return NextResponse.json({ error: "Tu cuenta no tiene permisos de edición" }, { status: 403 });
    }

    const formData = await request.formData();
    const linksJson = formData.get("profileLinks");
    const appearanceJson = formData.get("appearance");

    const parsed = profileSchema.parse({
      businessName: formData.get("businessName"),
      username: formData.get("username"),
      profileLinks: JSON.parse(typeof linksJson === "string" ? linksJson : "[]"),
      appearance: JSON.parse(typeof appearanceJson === "string" ? appearanceJson : "{}"),
    });

    const warnings = getAppearanceWarnings(parsed.appearance);
    if (warnings.length) {
      return NextResponse.json({ error: warnings[0].message }, { status: 400 });
    }

    const photo = formData.get("photo");
    const nextUser = await updateUserProfile(user.uid, parsed, photo?.size ? photo : null);
    const account = getAccountView(nextUser);
    const updatedAtMs = toDate(account.updatedAt)?.getTime() || 0;

    return NextResponse.json({
      user: {
        ...account,
        trialEndsAtLabel: account.trialEndsAt?.toISOString() || null,
        expiresAtLabel: account.expiresAt?.toISOString() || null,
        shareUrl: buildShareProfileUrl(account.username, `${SHARE_LINK_VERSION}-${updatedAtMs}`),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
