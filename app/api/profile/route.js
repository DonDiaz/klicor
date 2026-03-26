import { NextResponse } from "next/server";
import { profileSchema } from "@/lib/schemas";
import { verifyRequest } from "@/lib/auth";
import { getAccountView, updateUserProfile } from "@/lib/firestore";

export async function POST(request) {
  try {
    const { user } = await verifyRequest(request);
    if (!["trial", "active"].includes(user.status)) {
      return NextResponse.json({ error: "Tu cuenta no tiene permisos de edicion" }, { status: 403 });
    }

    const formData = await request.formData();
    const linksJson = formData.get("profileLinks");
    const parsed = profileSchema.parse({
      businessName: formData.get("businessName"),
      username: formData.get("username"),
      profileLinks: JSON.parse(typeof linksJson === "string" ? linksJson : "[]"),
      accent: formData.get("accent"),
      surface: formData.get("surface"),
      text: formData.get("text"),
      mode: formData.get("mode"),
    });

    const photo = formData.get("photo");
    const nextUser = await updateUserProfile(user.uid, parsed, photo?.size ? photo : null);
    const account = getAccountView(nextUser);

    return NextResponse.json({
      user: {
        ...account,
        trialEndsAtLabel: account.trialEndsAt?.toISOString() || null,
        expiresAtLabel: account.expiresAt?.toISOString() || null,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
