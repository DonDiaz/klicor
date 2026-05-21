import { NextResponse } from "next/server";
import { buildShareProfileUrl, buildVanityProfileUrl } from "@/lib/public-profile-links";
import { validateProfileLinksSafety } from "@/lib/link-safety";
import { profileSchema } from "@/lib/schemas";
import { verifyRequest } from "@/lib/auth";
import { assertAgencyCanEditBusiness, recordAgencyEdit } from "@/lib/agency";
import { writeAuditLog } from "@/lib/audit-log";
import { getAccountView, updateUserProfile } from "@/lib/firestore";
import { getAppearanceWarnings } from "@/lib/theme-system";
import { isSystemProfileLink } from "@/lib/system-profile-links";
import { toDate } from "@/lib/utils";
import { getRequestAppUrl } from "@/lib/env";
import { checkDurableRateLimit, durableRateLimitResponse } from "@/lib/durable-rate-limit";

const SHARE_LINK_VERSION = "v1";

function buildBlockedLinkAuditMetadata(error, agencyAccess) {
  let hostname = "";
  try {
    hostname = new URL(error?.linkSafety?.url || "").hostname;
  } catch {
    hostname = "";
  }

  return {
    agencyMode: Boolean(agencyAccess),
    reason: error?.linkSafety?.reason || "unknown",
    linkId: error?.linkSafety?.linkId || "",
    linkType: error?.linkSafety?.linkType || "",
    linkLabel: error?.linkSafety?.linkLabel || "",
    linkHost: hostname,
    urlPreview: error?.linkSafety?.url || "",
  };
}

export async function POST(request) {
  try {
    const { user } = await verifyRequest(request, { checkRevoked: true });
    const formData = await request.formData();
    const targetUid = String(formData.get("targetUid") || "").trim();
    const agencyAccess = targetUid ? await assertAgencyCanEditBusiness(user, targetUid, "publicProfile") : null;
    const effectiveUser = agencyAccess?.business || user;

    if (!agencyAccess && !["trial", "active"].includes(user.status)) {
      return NextResponse.json({ error: "Tu cuenta no tiene permisos de edicion" }, { status: 403 });
    }

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

    if (agencyAccess) {
      parsed.billingProfile = effectiveUser.billingProfile || {};
      if (!agencyAccess.permissions.paymentMethods) parsed.paymentMethods = effectiveUser.paymentMethods || [];
      if (!agencyAccess.permissions.design) {
        parsed.appearance = effectiveUser.settings || {};
        parsed.customThemes = effectiveUser.customThemes || [];
      }
      if (!agencyAccess.permissions.links) parsed.profileLinks = effectiveUser.profileLinks || [];
      if (!agencyAccess.permissions.dorika) parsed.dorikaProfile = effectiveUser.dorikaProfile || {};
    }

    const warnings = getAppearanceWarnings(parsed.appearance);
    if (warnings.length) {
      return NextResponse.json({ error: warnings[0].message }, { status: 400 });
    }

    const editableProfileLinks = parsed.profileLinks.filter((link) => !isSystemProfileLink(link));
    try {
      await validateProfileLinksSafety(editableProfileLinks);
    } catch (error) {
      if (error?.code === "PROFILE_LINK_BLOCKED") {
        writeAuditLog({
          request,
          actor: user,
          role: agencyAccess ? "agency" : user.role || "owner",
          action: "profile.link_blocked",
          targetUid: effectiveUser.uid,
          status: "blocked",
          metadata: buildBlockedLinkAuditMetadata(error, agencyAccess),
        }).catch((auditError) => console.error("[audit-log]", auditError?.message || auditError));
      }
      throw error;
    }

    const photo = formData.get("photo");
    const dorikaCover = formData.get("dorikaCover");
    const canEditPaymentMethods = !agencyAccess || agencyAccess.permissions.paymentMethods;
    const paymentQrImagesByMethod = {};
    if (canEditPaymentMethods) {
      for (const [key, value] of formData.entries()) {
        if (!key.startsWith("paymentQrImage:")) continue;
        const methodId = key.slice("paymentQrImage:".length);
        if (methodId && value?.size) {
          paymentQrImagesByMethod[methodId] = value;
        }
      }
    }
    const hasFileUpload = Boolean(photo?.size || dorikaCover?.size || Object.keys(paymentQrImagesByMethod).length);
    if (hasFileUpload) {
      const uploadRate = await checkDurableRateLimit(request, {
        key: `profile-upload:${effectiveUser.uid}`,
        limit: 40,
        windowMs: 60 * 60_000,
      });
      if (uploadRate.limited) {
        return durableRateLimitResponse(uploadRate, "Demasiadas subidas de imagen. Intenta de nuevo mas tarde.");
      }
    }

    const nextUser = await updateUserProfile(effectiveUser.uid, {
      ...parsed,
      profileLinks: editableProfileLinks,
    }, {
      photo: photo?.size ? photo : null,
      dorikaCover: dorikaCover?.size ? dorikaCover : null,
      paymentQrImagesByMethod,
      removePaymentQrIds: canEditPaymentMethods && typeof removePaymentQrIdsJson === "string"
        ? JSON.parse(removePaymentQrIdsJson)
        : [],
    });
    if (agencyAccess) {
      await recordAgencyEdit(agencyAccess, "profile");
    }
    writeAuditLog({
      request,
      actor: user,
      role: agencyAccess ? "agency" : user.role || "owner",
      action: "profile.update",
      targetUid: effectiveUser.uid,
      status: "success",
      metadata: { agencyMode: Boolean(agencyAccess) },
    }).catch((error) => console.error("[audit-log]", error?.message || error));
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
