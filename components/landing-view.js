import Link from "next/link";
import { Globe } from "lucide-react";
import { LINK_CATALOG_MAP } from "@/lib/link-catalog";

export function LandingView({ user, preview = false }) {
  const links = user.profileLinks || [];
  const dark = user.settings?.mode === "dark";
  const accent = user.settings?.accent || "#f97316";
  const surface = user.settings?.surface || "#fff7ed";
  const text = user.settings?.text || "#1c1917";
  const cardStyle = {
    background: dark ? "linear-gradient(180deg, rgba(17,24,39,.96), rgba(15,23,42,.92))" : `linear-gradient(180deg, ${surface}, #ffffff)`,
    color: dark ? "#f9fafb" : text,
    border: `1px solid ${dark ? "rgba(255,255,255,.1)" : "rgba(28,25,23,.08)"}`,
    boxShadow: `0 24px 70px ${accent}35`,
  };
  const buttonStyle = {
    background: dark
      ? `linear-gradient(135deg, ${accent}, ${accent}cc)`
      : `linear-gradient(135deg, ${accent}, ${accent}dd)`,
    color: "#ffffff",
    border: `1px solid ${accent}`,
    boxShadow: `0 14px 30px ${accent}33`,
  };
  const pageBackground = dark
    ? `radial-gradient(circle at top, ${accent}40, transparent 30%), linear-gradient(180deg, #111827, #030712)`
    : `radial-gradient(circle at top, ${accent}30, transparent 28%), linear-gradient(180deg, #fffdf8, ${surface})`;

  return (
    <main className={preview ? "preview-page" : "public-page"} style={{ background: pageBackground }}>
      <section className="public-card" style={cardStyle}>
        <div className="public-accent-bar" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88)` }} />
        {user.photo ? <img className="avatar" src={user.photo} alt={user.businessName} /> : <div className="avatar" style={{ background: `${accent}33`, display: "grid", placeItems: "center", fontSize: "2rem", color: accent }}>{user.businessName?.slice(0, 1) || "B"}</div>}
        <div style={{ textAlign: "center" }}>
          <h1 style={{ marginBottom: ".45rem" }}>{user.businessName}</h1>
          <p style={{ marginTop: 0, opacity: 0.75 }}>@{user.username}</p>
        </div>
        <div className="public-links">
          {links.length ? links.map((item) => {
            const Icon = LINK_CATALOG_MAP[item.type]?.icon || Globe;
            const content = <><Icon size={18} /> {item.label}</>;

            if (preview) {
              return <div className="public-link" style={buttonStyle} key={item.id}>{content}</div>;
            }

            return (
              <Link className="public-link" style={buttonStyle} key={item.id} href={`/api/analytics/click?username=${user.username}&button=${item.type}&target=${encodeURIComponent(item.url)}`}>
                {content}
              </Link>
            );
          }) : <div className="public-link" style={buttonStyle}><Globe size={18} /> Agrega tus enlaces para ver la vista previa</div>}
        </div>
      </section>
    </main>
  );
}
