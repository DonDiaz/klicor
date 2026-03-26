import Link from "next/link";
import { Globe } from "lucide-react";
import { LINK_CATALOG_MAP } from "@/lib/link-catalog";

function hexToRgba(hex, alpha) {
  const safe = hex?.replace("#", "") || "f97316";
  const full = safe.length === 3 ? safe.split("").map((char) => char + char).join("") : safe;
  const int = Number.parseInt(full, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function LandingView({ user, preview = false }) {
  const links = user.profileLinks || [];
  const dark = user.settings?.mode === "dark";
  const accent = user.settings?.accent || "#f97316";
  const surface = user.settings?.surface || "#fff7ed";
  const text = user.settings?.text || "#1c1917";
  const titleText = user.settings?.titleText || text;
  const buttonText = user.settings?.buttonText || "#ffffff";
  const opacity = Number(user.settings?.buttonOpacity ?? 0.92);
  const cardStyle = {
    background: dark ? "linear-gradient(180deg, rgba(17,24,39,.96), rgba(15,23,42,.92))" : `linear-gradient(180deg, ${surface}, #ffffff)`,
    color: dark ? "#f9fafb" : text,
    border: `1px solid ${dark ? "rgba(255,255,255,.1)" : "rgba(28,25,23,.08)"}`,
    boxShadow: `0 24px 70px ${hexToRgba(accent, 0.2)}`,
  };
  const buttonStyle = {
    background: `linear-gradient(135deg, ${hexToRgba(accent, opacity)}, ${hexToRgba(accent, Math.max(opacity - 0.12, 0.2))})`,
    color: buttonText,
    border: `1px solid ${hexToRgba(accent, Math.min(opacity + 0.05, 1))}`,
    boxShadow: `0 14px 30px ${hexToRgba(accent, 0.28)}`,
  };
  const pageBackground = dark
    ? `radial-gradient(circle at top, ${hexToRgba(accent, 0.26)}, transparent 30%), linear-gradient(180deg, #111827, #030712)`
    : `radial-gradient(circle at top, ${hexToRgba(accent, 0.18)}, transparent 28%), linear-gradient(180deg, #fffdf8, ${surface})`;

  return (
    <main className={preview ? "preview-page" : "public-page"} style={{ background: pageBackground }}>
      <section className="public-card" style={cardStyle}>
        <div className="public-accent-bar" style={{ background: `linear-gradient(90deg, ${accent}, ${hexToRgba(accent, 0.55)})` }} />
        {user.photo ? (
          <img className="avatar" src={user.photo} alt={user.businessName} />
        ) : (
          <div className="avatar" style={{ background: hexToRgba(accent, 0.18), display: "grid", placeItems: "center", fontSize: "2rem", color: accent }}>
            {user.businessName?.slice(0, 1) || "B"}
          </div>
        )}
        <div style={{ textAlign: "center" }}>
          <h1 style={{ marginBottom: ".45rem", color: titleText }}>{user.businessName}</h1>
          <p style={{ marginTop: 0, opacity: 0.75 }}>@{user.username}</p>
        </div>
        <div className="public-links">
          {links.length ? links.map((item) => {
            const Icon = LINK_CATALOG_MAP[item.type]?.icon || Globe;
            const content = <><Icon size={18} /> <span>{item.label}</span></>;

            if (preview) {
              return <div className="public-link" style={buttonStyle} key={item.id}>{content}</div>;
            }

            return (
              <Link className="public-link" style={buttonStyle} key={item.id} href={`/api/analytics/click?username=${user.username}&button=${item.type}&target=${encodeURIComponent(item.url)}`}>
                {content}
              </Link>
            );
          }) : <div className="public-link" style={buttonStyle}><Globe size={18} /> <span>Agrega tus enlaces para ver la vista previa</span></div>}
        </div>
      </section>
    </main>
  );
}
