import Link from "next/link";
import { Globe } from "lucide-react";
import { LINK_CATALOG_MAP } from "@/lib/link-catalog";
import { hexToRgba, normalizeAppearance } from "@/lib/theme-system";

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
          <img className="avatar" src={user.photo} alt={user.businessName} style={{ borderRadius: AVATAR_RADIUS_MAP[appearance.avatarShape] }} />
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
          <p style={{ marginTop: 0, color: appearance.textSecondaryColor }}>@{user.username}</p>
        </div>

        <div className="public-links">
          {links.length ? links.map((item) => {
            const Icon = LINK_CATALOG_MAP[item.type]?.icon || Globe;
            const content = <><Icon size={18} /><span>{item.label}</span></>;

            if (preview) {
              return <div className="public-link" style={{ ...buttonStyle, borderRadius: RADIUS_MAP[appearance.buttonRadius] }} key={item.id}>{content}</div>;
            }

            return (
              <Link className="public-link" style={{ ...buttonStyle, borderRadius: RADIUS_MAP[appearance.buttonRadius] }} key={item.id} href={`/api/analytics/click?username=${user.username}&button=${item.type}&target=${encodeURIComponent(item.url)}`}>
                {content}
              </Link>
            );
          }) : (
            <div className="public-link" style={{ ...buttonStyle, borderRadius: RADIUS_MAP[appearance.buttonRadius] }}>
              <Globe size={18} />
              <span>Agrega tus enlaces para ver la vista previa</span>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
