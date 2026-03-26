import { Copy, QrCode, Smartphone, Zap } from "lucide-react";

export function MarketingPreview() {
  return (
    <div className="mockup-card">
      <div className="mockup-screen">
        <div className="mockup-topbar">
          <div className="logo-mark" style={{ color: "var(--dark-text)" }}>
            <span className="logo-badge" style={{ width: 34, height: 34, borderRadius: 10 }}>L</span>
            <span>Linka</span>
          </div>
          <div className="mockup-mini-card">
            <strong style={{ display: "block", marginBottom: 6 }}>Tu página lista</strong>
            <span style={{ color: "var(--text-secondary)" }}>Publica, comparte y vende desde un solo link.</span>
          </div>
        </div>

        <div className="mockup-metrics">
          <div className="mockup-mini-card">
            <span className="pill" style={{ background: "rgba(34,211,238,.14)", color: "var(--accent)", borderColor: "rgba(34,211,238,.18)" }}>
              <Zap size={14} /> Activa en minutos
            </span>
          </div>
          <div className="grid-3">
            <div className="mockup-mini-card">
              <QrCode size={18} />
              <p style={{ margin: "0.65rem 0 0", color: "var(--dark-text)" }}>QR automático</p>
            </div>
            <div className="mockup-mini-card">
              <Copy size={18} />
              <p style={{ margin: "0.65rem 0 0", color: "var(--dark-text)" }}>URL única</p>
            </div>
            <div className="mockup-mini-card">
              <Smartphone size={18} />
              <p style={{ margin: "0.65rem 0 0", color: "var(--dark-text)" }}>Vista móvil</p>
            </div>
          </div>
        </div>

        <div className="mockup-links">
          <div className="mockup-link"><span>WhatsApp</span><span>↗</span></div>
          <div className="mockup-link"><span>Instagram</span><span>↗</span></div>
          <div className="mockup-link"><span>Sitio web</span><span>↗</span></div>
        </div>
      </div>
    </div>
  );
}
