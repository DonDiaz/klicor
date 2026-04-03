import { Globe, Save } from "lucide-react";
import { resolveBusinessIdentityCopy, resolveBusinessLinkLabel, sortLinksByBusinessCategory } from "@/lib/business-categories";
import { resolveContactCardData } from "@/lib/contact-card";
import { LINK_CATALOG_MAP } from "@/lib/link-catalog";
import { hexToRgba, normalizeAppearance } from "@/lib/theme-system";
import { PaymentKeyCard } from "@/components/payment-key-card";

const NAME_SIZE_MAP = {
  s: "1.6rem",
  m: "2rem",
  l: "2.35rem",
};

const NAME_WEIGHT_MAP = {
  regular: 500,
  bold: 700,
};

const SHADOW_MAP = {
  none: "none",
  soft: "0 18px 36px rgba(15, 23, 42, 0.08)",
  medium: "0 28px 60px rgba(15, 23, 42, 0.16)",
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

export function LandingView({ user, preview = false }) {
  const links = user.profileLinks || [];
  const paymentKey = links.find((item) => item.type === "payment_key");
  const visibleLinks = sortLinksByBusinessCategory(
    links.filter((item) => item.type !== "payment_key"),
    user.businessCategory,
  );
  const contactCard = resolveContactCardData(user);
  const businessIdentity = resolveBusinessIdentityCopy(user);
  const paymentQrUrl = user.paymentQrUrl
    ? preview
      ? user.paymentQrUrl
      : `/${user.username}/payment-qr`
    : "";
  const appearance = normalizeAppearance(user.settings);

  const pageBackground = appearance.backgroundStyle === "gradient"
    ? `linear-gradient(180deg, ${appearance.backgroundColor}, ${hexToRgba(appearance.primaryColor, 0.12)} 65%, ${hexToRgba("#22D3EE", 0.12)})`
    : appearance.backgroundColor;

  const cardBackground = appearance.cardTransparency === "soft"
    ? `linear-gradient(180deg, ${hexToRgba(appearance.surfaceColor, 0.9)}, ${hexToRgba(appearance.surfaceColor, 0.82)})`
    : appearance.surfaceColor;

  const cardStyle = {
    background: cardBackground,
    color: appearance.textPrimaryColor,
    border: `1px solid ${hexToRgba(appearance.textSecondaryColor, 0.18)}`,
    boxShadow: SHADOW_MAP[appearance.cardShadow],
  };

  const buttonStyle = appearance.buttonStyle === "outline"
    ? {
        background: "transparent",
        color: appearance.primaryColor,
        border: `1px solid ${appearance.primaryColor}`,
        boxShadow: "none",
      }
    : appearance.buttonStyle === "soft"
      ? {
          background: hexToRgba(appearance.primaryColor, 0.14),
          color: appearance.primaryColor,
          border: `1px solid ${hexToRgba(appearance.primaryColor, 0.2)}`,
          boxShadow: "none",
        }
      : {
          background: appearance.primaryColor,
          color: appearance.buttonTextColor,
          border: `1px solid ${appearance.primaryColor}`,
          boxShadow: `0 14px 28px ${hexToRgba(appearance.primaryColor, 0.22)}`,
        };

  return (
    <main className={preview ? "preview-page" : "public-page"} style={{ background: pageBackground }}>
      <section className="public-card" style={cardStyle}>
        <div className="public-accent-bar" style={{ background: appearance.primaryColor }} />
        {user.photo ? (
          <img
            className="avatar"
            src={user.photo}
            alt={user.businessName}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            style={{ borderRadius: AVATAR_RADIUS_MAP[appearance.avatarShape] }}
          />
        ) : (
          <div
            className="avatar"
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

        <div style={{ textAlign: "center" }}>
          <span className="public-category-label" style={{ color: appearance.primaryColor }}>
            {businessIdentity.categoryLabel}
          </span>
          <h1
            style={{
              marginBottom: ".45rem",
              color: appearance.textPrimaryColor,
              fontSize: NAME_SIZE_MAP[appearance.nameSize],
              fontWeight: NAME_WEIGHT_MAP[appearance.nameWeight],
            }}
          >
            {user.businessName}
          </h1>
          <p className="public-headline" style={{ color: appearance.textPrimaryColor }}>
            {businessIdentity.headline}
          </p>
          <p className="public-subheadline">{businessIdentity.subheadline}</p>
        </div>

        <div className="public-links">
          {paymentKey ? (
            <PaymentKeyCard
              item={paymentKey}
              qrImageUrl={paymentQrUrl}
              preview={preview}
              buttonStyle={buttonStyle}
              buttonRadius={RADIUS_MAP[appearance.buttonRadius]}
            />
          ) : null}

          {visibleLinks.length ? visibleLinks.map((item) => {
            const Icon = LINK_CATALOG_MAP[item.type]?.icon || Globe;
            const content = <><Icon size={18} /><span>{resolveBusinessLinkLabel(item, user.businessCategory)}</span></>;

            if (preview) {
              return <div className="public-link" style={{ ...buttonStyle, borderRadius: RADIUS_MAP[appearance.buttonRadius] }} key={item.id}>{content}</div>;
            }

            return <a className="public-link" style={{ ...buttonStyle, borderRadius: RADIUS_MAP[appearance.buttonRadius] }} key={item.id} href={`/api/analytics/click?username=${user.username}&button=${item.type}&linkId=${encodeURIComponent(item.id)}`}>{content}</a>;
          }) : preview ? (
            <div className="public-link" style={{ ...buttonStyle, borderRadius: RADIUS_MAP[appearance.buttonRadius] }}>
              <Globe size={18} />
              <span>{paymentKey ? "Agrega más enlaces para completar tu página" : "Agrega tus enlaces para ver la vista previa"}</span>
            </div>
          ) : null}
        </div>
      </section>

      {contactCard.shouldShow ? (
        preview ? (
          <div
            className="floating-contact-button is-preview"
            style={{
              background: appearance.primaryColor,
              color: appearance.buttonTextColor,
              boxShadow: `0 20px 44px ${hexToRgba(appearance.primaryColor, 0.32)}`,
            }}
            aria-label="Guardar contacto"
            title="Guardar contacto"
          >
            <Save size={20} />
          </div>
        ) : (
          <a
            className="floating-contact-button"
            style={{
              background: appearance.primaryColor,
              color: appearance.buttonTextColor,
              boxShadow: `0 20px 44px ${hexToRgba(appearance.primaryColor, 0.32)}`,
            }}
            href={`/api/analytics/click?username=${user.username}&button=contact_card`}
            aria-label="Guardar contacto"
            title="Guardar contacto"
          >
            <Save size={20} />
          </a>
        )
      ) : null}
    </main>
  );
}
