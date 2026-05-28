import { Globe, Save, Share2 } from "lucide-react";
import { buildLandingLayout } from "@/lib/landing-layout";
import { resolveContactCardData } from "@/lib/contact-card";
import { getContrastRatio, hexToRgba, normalizeAppearance } from "@/lib/theme-system";
import { PaymentMethodsCard } from "@/components/payment-methods-card";
import { PublicFloatingActions } from "@/components/public-floating-actions";
import { PublicAssetImage } from "@/components/public-asset-image";
import { FONT_FAMILY_STYLE_MAP } from "@/app/fonts";

const NAME_SIZE_MAP = {
  s: "1.6rem",
  m: "2rem",
  l: "2.35rem",
};

const PREVIEW_NAME_SIZE_MAP = {
  s: "1.22rem",
  m: "1.46rem",
  l: "1.7rem",
};

const NAME_WEIGHT_MAP = {
  regular: 500,
  bold: 700,
};

const RADIUS_MAP = {
  rounded: "14px",
  square: "10px",
};

const AVATAR_RADIUS_MAP = {
  circle: "999px",
  rounded: "24px",
  "soft-square": "16px",
};

const SOCIAL_BRAND_STYLES = {
  whatsapp: "#25D366",
  website: "#0EA5E9",
  facebook: "#1877F2",
  email: "#60A5FA",
  instagram: "#C13584",
  tiktok: "#111827",
  youtube: "#FF0000",
  linkedin: "#0A66C2",
  telegram: "#26A5E4",
  x: "#111827",
  threads: "#111827",
  spotify: "#1DB954",
  twitch: "#9146FF",
  maps: "#4F46E5",
};

function resolveReadableText(background, preferred, fallback) {
  return getContrastRatio(background, preferred) >= 4.5 ? preferred : fallback;
}

function buildPanelStyle(appearance) {
  const alpha = appearance.cardTransparency === "solid" ? 0.96 : 0.74;
  const shadow = appearance.cardShadow === "none"
    ? "none"
    : appearance.cardShadow === "soft"
      ? `0 14px 30px ${hexToRgba("#0B1020", 0.08)}`
      : `0 24px 54px ${hexToRgba("#0B1020", 0.14)}`;

  return {
    background: hexToRgba(appearance.surfaceColor, alpha),
    border: `1px solid ${hexToRgba(appearance.primaryColor, appearance.cardTransparency === "solid" ? 0.12 : 0.18)}`,
    boxShadow: shadow,
    backdropFilter: appearance.cardTransparency === "soft" ? "blur(14px)" : "none",
  };
}

function buildPrimaryButtonStyle(appearance) {
  const textColor = resolveReadableText(appearance.primaryColor, appearance.buttonPrimaryTextColor, appearance.textPrimaryColor);

  if (appearance.buttonStyle === "outline") {
    return {
      background: "transparent",
      color: appearance.primaryColor,
      border: `1px solid ${appearance.primaryColor}`,
      boxShadow: "none",
    };
  }

  if (appearance.buttonStyle === "soft") {
    return {
      background: hexToRgba(appearance.primaryColor, 0.14),
      color: appearance.primaryColor,
      border: `1px solid ${hexToRgba(appearance.primaryColor, 0.2)}`,
      boxShadow: "none",
    };
  }

  return {
    background: appearance.primaryColor,
    color: textColor,
    border: `1px solid ${appearance.primaryColor}`,
    boxShadow: `0 14px 28px ${hexToRgba(appearance.primaryColor, 0.22)}`,
  };
}

function buildSecondaryButtonStyle(appearance) {
  const textColor = resolveReadableText(appearance.secondaryColor, appearance.buttonSecondaryTextColor, appearance.textPrimaryColor);

  return {
    background: appearance.secondaryColor,
    color: textColor,
    border: `1px solid ${hexToRgba(appearance.secondaryColor, 0.92)}`,
    boxShadow: `0 10px 24px ${hexToRgba(appearance.secondaryColor, 0.18)}`,
  };
}

function buildTertiaryButtonStyle(appearance) {
  const textColor = resolveReadableText(appearance.tertiaryColor, appearance.buttonTertiaryTextColor, appearance.textPrimaryColor);

  return {
    background: hexToRgba(appearance.tertiaryColor, 0.28),
    color: textColor,
    border: `1px solid ${hexToRgba(appearance.tertiaryColor, 0.5)}`,
    boxShadow: "none",
  };
}

function buildSocialStyle(appearance, type) {
  if (appearance.socialStyle === "icons") {
    const brandColor = SOCIAL_BRAND_STYLES[type] || appearance.primaryColor;

    return {
      color: brandColor,
      borderColor: hexToRgba(brandColor, 0.18),
      background: hexToRgba(appearance.surfaceColor, appearance.cardTransparency === "solid" ? 0.94 : 0.68),
      boxShadow: appearance.cardShadow === "none"
        ? "none"
        : `0 12px 28px ${hexToRgba(brandColor, 0.12)}`,
    };
  }

  const socialAccent = getContrastRatio(appearance.surfaceColor, appearance.primaryColor) >= 3
    ? appearance.primaryColor
    : appearance.secondaryColor;

  const isDarkPreset = appearance.presetId === "midnight";

  return {
    color: isDarkPreset ? appearance.secondaryColor : socialAccent,
    borderColor: hexToRgba(isDarkPreset ? appearance.secondaryColor : socialAccent, isDarkPreset ? 0.32 : 0.16),
    background: isDarkPreset
      ? hexToRgba("#FFFFFF", 0.08)
      : hexToRgba(appearance.surfaceColor, appearance.cardTransparency === "solid" ? 0.9 : 0.58),
    boxShadow: appearance.cardShadow === "none"
      ? "none"
      : appearance.cardShadow === "soft"
        ? `0 10px 24px ${hexToRgba("#0B1020", 0.06)}`
        : `0 16px 32px ${hexToRgba("#0B1020", 0.1)}`,
  };
}

function renderAction({ item, preview, buttonStyle, buttonRadius, user, className = "public-link" }) {
  const Icon = item.icon || Globe;
  const content = (
    <>
      <Icon size={18} />
      <span>{item.displayLabel}</span>
    </>
  );

  if (preview) {
    return (
      <div className={className} style={{ ...buttonStyle, borderRadius: buttonRadius }} key={item.id}>
        {content}
      </div>
    );
  }

  if (item.systemAction && item.url) {
    return (
      <a
        className={className}
        style={{ ...buttonStyle, borderRadius: buttonRadius }}
        key={item.id}
        href={item.url}
      >
        {content}
      </a>
    );
  }

  return (
    <a
      className={className}
      style={{ ...buttonStyle, borderRadius: buttonRadius }}
      key={item.id}
      href={`/api/analytics/click?username=${user.username}&button=${item.type}&linkId=${encodeURIComponent(item.id)}`}
    >
      {content}
    </a>
  );
}

export function LandingView({ user, preview = false }) {
  const layout = buildLandingLayout(user);
  const contactCard = resolveContactCardData(user);
  const appearance = normalizeAppearance(user.settings);
  const panelStyle = buildPanelStyle(appearance);
  const primaryButtonStyle = buildPrimaryButtonStyle(appearance);
  const secondaryButtonStyle = buildSecondaryButtonStyle(appearance);
  const tertiaryButtonStyle = buildTertiaryButtonStyle(appearance);
  const fontFamily = FONT_FAMILY_STYLE_MAP[appearance.fontFamily] || FONT_FAMILY_STYLE_MAP.inter;

  const pageBackground = appearance.backgroundColor;

  const shellStyle = {
    color: appearance.textPrimaryColor,
    background: "transparent",
    border: "none",
    boxShadow: "none",
  };

  const buttonRadius = RADIUS_MAP[appearance.buttonRadius];
  const nameSize = preview ? PREVIEW_NAME_SIZE_MAP[appearance.nameSize] : NAME_SIZE_MAP[appearance.nameSize];

  return (
    <main
      className={`${preview ? "public-page preview-page" : "public-page"} ${appearance.socialStyle === "icons" ? "public-page-social-icons" : ""}`}
      style={{ background: pageBackground, fontFamily }}
    >
      <section className={`public-card public-business-card${preview ? "" : " public-card-live"}`} style={shellStyle}>
        <div className="public-hero">
          <div className="public-accent-bar" style={{ background: appearance.primaryColor }} />
          {user.photo ? (
            <span className="avatar-shell" style={{ borderRadius: AVATAR_RADIUS_MAP[appearance.avatarShape] }}>
              <PublicAssetImage
                className="avatar-image"
                src={user.photoThumb || user.photo}
                alt={user.businessName}
                width={128}
                height={128}
                sizes="128px"
                loading={preview ? "lazy" : "eager"}
                fetchPriority={preview ? undefined : "high"}
              />
            </span>
          ) : (
            <div
              className="avatar-shell"
              style={{
                display: "grid",
                placeItems: "center",
                borderRadius: AVATAR_RADIUS_MAP[appearance.avatarShape],
                background: hexToRgba(appearance.primaryColor, 0.12),
                color: appearance.primaryColor,
                fontSize: "2rem",
              }}
            >
              {user.businessName?.slice(0, 1) || "L"}
            </div>
          )}

          <div className="public-hero-copy">
            <h1
              style={{
                marginBottom: ".2rem",
                color: appearance.textPrimaryColor,
                fontSize: nameSize,
                fontWeight: NAME_WEIGHT_MAP[appearance.nameWeight],
              }}
            >
              {user.businessName}
            </h1>
            <p className="public-headline" style={{ color: appearance.textPrimaryColor }}>
              {layout.identity.headline}
            </p>
            <p className="public-subheadline">{layout.identity.subheadline}</p>
          </div>
        </div>

        <div className="public-content-stack">
          <div className="public-main-actions">
            {layout.priorityOneActions.length ? layout.priorityOneActions.map((item) =>
              renderAction({
                item,
                preview,
                buttonStyle: primaryButtonStyle,
                buttonRadius,
                user,
                className: "public-link public-link-priority-1",
              }),
            ) : preview ? (
              <div className="public-link public-link-priority-1" style={{ ...primaryButtonStyle, borderRadius: buttonRadius }}>
                <Globe size={18} />
                <span>Agrega tus enlaces para ver la estructura principal</span>
              </div>
            ) : null}
          </div>

          {layout.priorityTwoActions.length ? (
            <div className="public-priority-two-actions">
              {layout.priorityTwoActions.map((item) =>
                renderAction({
                  item,
                  preview,
                  buttonStyle: secondaryButtonStyle,
                  buttonRadius,
                  user,
                  className: "public-link public-link-priority-2",
                }),
              )}
            </div>
          ) : null}

          {layout.priorityThreeActions.length ? (
            <div className="public-secondary-actions public-priority-three-actions">
              {layout.priorityThreeActions.map((item) =>
                renderAction({
                  item,
                  preview,
                  buttonStyle: tertiaryButtonStyle,
                  buttonRadius,
                  user,
                  className: "public-link public-link-secondary public-link-priority-3",
                }),
              )}
            </div>
          ) : null}

          {layout.paymentMethods.length ? (
            <PaymentMethodsCard
              methods={layout.paymentMethods}
              preview={preview}
              sectionStyle={panelStyle}
            />
          ) : null}

          {layout.socialLinks.length ? (
            <section className="public-section public-section-social" style={panelStyle}>
              <div className="public-section-head">
                <strong>Nuestros canales</strong>
              </div>
              <div className={`public-social-strip ${appearance.socialStyle === "icons" ? "is-brand-icons" : ""}`}>
                {layout.socialLinks.map((item) => {
                  const Icon = item.icon || Globe;
                  const socialStyle = buildSocialStyle(appearance, item.type);
                  const socialClassName = `public-social-link ${appearance.socialStyle === "icons" ? "is-brand-icon" : ""}`;

                  if (preview) {
                    return (
                      <div
                        key={item.id}
                        className={socialClassName}
                        style={socialStyle}
                      >
                        <Icon size={20} />
                      </div>
                    );
                  }

                  return (
                    <a
                      key={item.id}
                      className={socialClassName}
                      style={socialStyle}
                      href={`/api/analytics/click?username=${user.username}&button=${item.type}&linkId=${encodeURIComponent(item.id)}`}
                      aria-label={item.displayLabel}
                      title={item.displayLabel}
                    >
                      <Icon size={20} />
                    </a>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>
      </section>

      {preview ? (
        <div
          className="floating-actions-preview"
          style={{
            color: resolveReadableText(appearance.primaryColor, appearance.buttonPrimaryTextColor, appearance.textPrimaryColor),
          }}
        >
          {contactCard.shouldShow ? (
            <div
              className="floating-contact-button is-preview"
              style={{
                background: appearance.primaryColor,
                color: resolveReadableText(appearance.primaryColor, appearance.buttonPrimaryTextColor, appearance.textPrimaryColor),
                boxShadow: `0 20px 44px ${hexToRgba(appearance.primaryColor, 0.32)}`,
              }}
              aria-label="Guardar contacto"
              title="Guardar contacto"
            >
              <Save size={20} />
            </div>
          ) : null}
          <div
            className="floating-contact-button is-preview"
            style={{
              background: appearance.primaryColor,
              color: resolveReadableText(appearance.primaryColor, appearance.buttonPrimaryTextColor, appearance.textPrimaryColor),
              boxShadow: `0 20px 44px ${hexToRgba(appearance.primaryColor, 0.32)}`,
            }}
            aria-label="Compartir"
            title="Compartir"
          >
            <Share2 size={20} />
          </div>
        </div>
      ) : (
        <div className="floating-actions-live">
          {contactCard.shouldShow ? (
            <a
              className="floating-contact-button floating-contact-live"
              style={{
                background: appearance.primaryColor,
                color: resolveReadableText(appearance.primaryColor, appearance.buttonPrimaryTextColor, appearance.textPrimaryColor),
                boxShadow: `0 20px 44px ${hexToRgba(appearance.primaryColor, 0.32)}`,
              }}
              href={`/api/analytics/click?username=${user.username}&button=contact_card`}
              aria-label="Guardar contacto"
              title="Guardar contacto"
            >
              <Save size={20} />
            </a>
          ) : null}
          <PublicFloatingActions
            businessName={user.businessName}
            shareLabel="Compartir"
            style={{
              background: appearance.primaryColor,
              color: resolveReadableText(appearance.primaryColor, appearance.buttonPrimaryTextColor, appearance.textPrimaryColor),
              boxShadow: `0 20px 44px ${hexToRgba(appearance.primaryColor, 0.32)}`,
            }}
          />
        </div>
      )}
    </main>
  );
}
