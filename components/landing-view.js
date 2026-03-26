import Link from "next/link";
import { Globe } from "lucide-react";
import { LINK_CATALOG_MAP } from "@/lib/link-catalog";

export function LandingView({ user, preview = false }) {
  const links = user.profileLinks || [];

  return (
    <main className={preview ? "preview-page" : "public-page"}>
      <section className="public-card">
        <div className="public-accent-bar" />
        {user.photo ? (
          <img className="avatar" src={user.photo} alt={user.businessName} />
        ) : (
          <div className="avatar" style={{ display: "grid", placeItems: "center", background: "var(--primary-soft)", color: "var(--primary)", fontSize: "2rem" }}>
            {user.businessName?.slice(0, 1) || "L"}
          </div>
        )}

        <div style={{ textAlign: "center" }}>
          <h1 style={{ marginBottom: ".45rem", color: "var(--text-primary)" }}>{user.businessName}</h1>
          <p style={{ marginTop: 0, color: "var(--text-secondary)" }}>@{user.username}</p>
        </div>

        <div className="public-links">
          {links.length ? links.map((item) => {
            const Icon = LINK_CATALOG_MAP[item.type]?.icon || Globe;
            const content = <><Icon size={18} /><span>{item.label}</span></>;

            if (preview) {
              return <div className="public-link" key={item.id}>{content}</div>;
            }

            return (
              <Link className="public-link" key={item.id} href={`/api/analytics/click?username=${user.username}&button=${item.type}&target=${encodeURIComponent(item.url)}`}>
                {content}
              </Link>
            );
          }) : (
            <div className="public-link">
              <Globe size={18} />
              <span>Agrega tus enlaces para ver la vista previa</span>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
