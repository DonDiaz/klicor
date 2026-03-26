import Image from "next/image";
import Link from "next/link";
import { Globe, Instagram, MessageCircleMore, Music2, Facebook } from "lucide-react";

const icons = {
  whatsapp: MessageCircleMore,
  instagram: Instagram,
  facebook: Facebook,
  tiktok: Music2,
  website: Globe,
};

const labels = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  website: "Sitio web",
};

export function LandingView({ user }) {
  const links = [
    user.whatsappUrl ? { key: "whatsapp", href: user.whatsappUrl } : null,
    user.links?.instagram ? { key: "instagram", href: user.links.instagram } : null,
    user.links?.facebook ? { key: "facebook", href: user.links.facebook } : null,
    user.links?.tiktok ? { key: "tiktok", href: user.links.tiktok } : null,
    user.links?.website ? { key: "website", href: user.links.website } : null,
  ].filter(Boolean);

  const dark = user.settings?.mode === "dark";
  const cardStyle = {
    background: dark ? "rgba(17,24,39,.88)" : user.settings?.surface || "#fff7ed",
    color: dark ? "#f9fafb" : user.settings?.text || "#1c1917",
    border: `1px solid ${dark ? "rgba(255,255,255,.1)" : "rgba(28,25,23,.08)"}`,
    boxShadow: `0 24px 70px ${user.settings?.accent || "#f97316"}30`,
  };

  return (
    <main className="public-page" style={{ background: `linear-gradient(180deg, ${user.settings?.accent || "#f97316"}22, transparent 38%), linear-gradient(180deg, ${dark ? "#111827" : "#fffdf8"}, ${dark ? "#030712" : "#fff1e6"})` }}>
      <section className="public-card" style={cardStyle}>
        {user.photo ? <Image className="avatar" src={user.photo} alt={user.businessName} width={110} height={110} /> : <div className="avatar" style={{ background: `${user.settings?.accent || "#f97316"}33`, display: "grid", placeItems: "center", fontSize: "2rem", color: user.settings?.accent || "#f97316" }}>{user.businessName?.slice(0,1) || "B"}</div>}
        <div style={{ textAlign: "center" }}>
          <h1 style={{ marginBottom: ".45rem" }}>{user.businessName}</h1>
          <p style={{ marginTop: 0, opacity: .75 }}>@{user.username}</p>
        </div>
        <div className="public-links">
          {links.map((item) => {
            const Icon = icons[item.key];
            return (
              <Link className="public-link" key={item.key} href={`/api/analytics/click?username=${user.username}&button=${item.key}&target=${encodeURIComponent(item.href)}`}>
                <Icon size={18} /> {labels[item.key]}
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
