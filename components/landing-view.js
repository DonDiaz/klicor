import Link from "next/link";
import { Globe } from "lucide-react";
import { LINK_CATALOG_MAP } from "@/lib/link-catalog";

export function LandingView({ user, preview = false }) {
  const links = user.profileLinks || [];
  const dark = user.settings?.mode === "dark";
  const cardStyle = {
    background: dark ? "rgba(17,24,39,.88)" : user.settings?.surface || "#fff7ed",
    color: dark ? "#f9fafb" : user.settings?.text || "#1c1917",
    border: `1px solid ${dark ? "rgba(255,255,255,.1)" : "rgba(28,25,23,.08)"}`,
    boxShadow: `0 24px 70px ${user.settings?.accent || "#f97316"}30`,
  };

  return (
    <main className={preview ? "preview-page" : "public-page"} style={{ background: `linear-gradient(180deg, ${user.settings?.accent || "#f97316"}22, transparent 38%), linear-gradient(180deg, ${dark ? "#111827" : "#fffdf8"}, ${dark ? "#030712" : "#fff1e6"})` }}>
      <section className="public-card" style={cardStyle}>
        {user.photo ? <img className="avatar" src={user.photo} alt={user.businessName} /> : <div className="avatar" style={{ background: `${user.settings?.accent || "#f97316"}33`, display: "grid", placeItems: "center", fontSize: "2rem", color: user.settings?.accent || "#f97316" }}>{user.businessName?.slice(0, 1) || "B"}</div>}
        <div style={{ textAlign: "center" }}>
          <h1 style={{ marginBottom: ".45rem" }}>{user.businessName}</h1>
          <p style={{ marginTop: 0, opacity: 0.75 }}>@{user.username}</p>
        </div>
        <div className="public-links">
          {links.length ? links.map((item) => {
            const Icon = LINK_CATALOG_MAP[item.type]?.icon || Globe;
            const content = <><Icon size={18} /> {item.label}</>;

            if (preview) {
              return <div className="public-link" key={item.id}>{content}</div>;
            }

            return (
              <Link className="public-link" key={item.id} href={`/api/analytics/click?username=${user.username}&button=${item.type}&target=${encodeURIComponent(item.url)}`}>
                {content}
              </Link>
            );
          }) : <div className="public-link"><Globe size={18} /> Agrega tus enlaces para ver la vista previa</div>}
        </div>
      </section>
    </main>
  );
}
