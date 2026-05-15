import { NextResponse } from "next/server";
import { buildShareProfileUrl, buildVanityProfileUrl } from "@/lib/public-profile-links";
import { validateProfileLinksSafety } from "@/lib/link-safety";
import { profileSchema } from "@/lib/schemas";
import { verifyRequest } from "@/lib/auth";
import { getAccountView, updateUserProfile } from "@/lib/firestore";
import { getAppearanceWarnings } from "@/lib/theme-system";
import { isSystemProfileLink } from "@/lib/system-profile-links";
import { toDate } from "@/lib/utils";
import { getRequestAppUrl } from "@/lib/env";

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
    const customThemesJson = formData.get("customThemes");
    const contactCardJson = formData.get("contactCard");
    const billingProfileJson = formData.get("billingProfile");
    const businessHoursJson = formData.get("businessHours");
    const dorikaProfileJson = formData.get("dorikaProfile");
    const paymentMethodsJson = formData.get("paymentMethods");
    const removePaymentQrIdsJson = formData.get("removePaymentQrIds");

    const parsed = profileSchema.parse({
      businessName: formData.get("businessName"),
      username: formData.get("username"),
      businessCategory: formData.get("businessCategory"),
      businessType: formData.get("businessType") || "",
      businessHeadline: formData.get("businessHeadline"),
      businessSubheadline: formData.get("businessSubheadline"),
      profileLinks: JSON.parse(typeof linksJson === "string" ? linksJson : "[]"),
      paymentMethods: JSON.parse(typeof paymentMethodsJson === "string" ? paymentMethodsJson : "[]"),
      appearance: JSON.parse(typeof appearanceJson === "string" ? appearanceJson : "{}"),
      customThemes: JSON.parse(typeof customThemesJson === "string" ? customThemesJson : "[]"),
      contactCard: typeof contactCardJson === "string"
        ? JSON.parse(contactCardJson)
        : { enabled: false, name: "", title: "", whatsappLinkId: "", phone: "" },
      billingProfile: typeof billingProfileJson === "string"
        ? JSON.parse(billingProfileJson)
        : {
          legalName: "",
          documentType: "nit",
          documentNumber: "",
          verificationDigit: "",
          taxResponsibility: "",
          billingEmail: "",
          billingPhone: "",
          address: "",
          city: "",
          department: "",
          country: "Colombia",
        },
      businessHours: typeof businessHoursJson === "string"
        ? JSON.parse(businessHoursJson)
        : {},
      dorikaProfile: typeof dorikaProfileJson === "string"
        ? JSON.parse(dorikaProfileJson)
        : {},
    });

    const warnings = getAppearanceWarnings(parsed.appearance);
    if (warnings.length) {
      return NextResponse.json({ error: warnings[0].message }, { status: 400 });
    }

    const editableProfileLinks = parsed.profileLinks.filter((link) => !isSystemProfileLink(link));

    await validateProfileLinksSafety(editableProfileLinks);

    const photo = formData.get("photo");
    const paymentQrImagesByMethod = {};
    for (const [key, value] of formData.entries()) {
      if (!key.startsWith("paymentQrImage:")) continue;
      const methodId = key.slice("paymentQrImage:".length);
      if (methodId && value?.size) {
        paymentQrImagesByMethod[methodId] = value;
      }
    }

    const nextUser = await updateUserProfile(user.uid, {
      ...parsed,
      profileLinks: editableProfileLinks,
    }, {
      photo: photo?.size ? photo : null,
      dorikaCover: formData.get("dorikaCover")?.size ? formData.get("dorikaCover") : null,
      paymentQrImagesByMethod,
      removePaymentQrIds: typeof removePaymentQrIdsJson === "string"
        ? JSON.parse(removePaymentQrIdsJson)
        : [],
    });
    const account = getAccountView(nextUser);
    const updatedAtMs = toDate(account.updatedAt)?.getTime() || 0;
    const appUrl = getRequestAppUrl(request);

    return NextResponse.json({
      user: {
        ...account,
        trialEndsAtLabel: account.trialEndsAt?.toISOString() || null,
        expiresAtLabel: account.expiresAt?.toISOString() || null,
        publicUrl: buildVanityProfileUrl(account.username, appUrl),
        shareUrl: buildShareProfileUrl(account.username, `${SHARE_LINK_VERSION}-${updatedAtMs}`, appUrl),
        stablePublicUrl: account.stablePublicUrl || "",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
