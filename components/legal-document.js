import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export function LegalDocument({ badge = "Legal", title, intro, sections = [], actions = [] }) {
  return (
    <main className="shell page-shell">
      <div className="stack" style={{ gap: "1.5rem", maxWidth: "920px", margin: "0 auto" }}>
        <BrandLogo />
        <article className="card" style={{ padding: "clamp(1.25rem, 3vw, 2.25rem)", display: "grid", gap: "1.25rem" }}>
          <div className="stack" style={{ gap: ".65rem" }}>
            <span className="pill">{badge}</span>
            <h1 className="section-title" style={{ fontSize: "clamp(1.8rem, 4vw, 2.55rem)" }}>{title}</h1>
            <p className="section-copy">{intro}</p>
          </div>

          <div className="stack" style={{ gap: "1.25rem" }}>
            {sections.map((section) => (
              <section key={section.title} className="stack" style={{ gap: ".55rem" }}>
                <h2 className="section-title" style={{ fontSize: "1.12rem" }}>{section.title}</h2>
                {section.body.map((paragraph) => (
                  <p className="section-copy" key={paragraph}>{paragraph}</p>
                ))}
              </section>
            ))}
          </div>

          <div className="actions">
            <Link className="btn btn-secondary" href="/">Volver al inicio</Link>
            {actions.map((action) => (
              <Link className="btn btn-secondary" href={action.href} key={action.href}>{action.label}</Link>
            ))}
          </div>
        </article>
      </div>
    </main>
  );
}
