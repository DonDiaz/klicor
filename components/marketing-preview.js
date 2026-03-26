import { QrCode, Smartphone, WalletCards } from "lucide-react";

export function MarketingPreview() {
  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <div className="stack">
        <div className="panel">
          <div className="pill"><Smartphone size={16} /> Landing publica lista en minutos</div>
          <h3 style={{ marginBottom: ".3rem" }}>Una pagina elegante para tu negocio</h3>
          <p className="muted">Comparte WhatsApp, Instagram, TikTok, web y un QR listo para imprimir.</p>
        </div>
        <div className="grid-3">
          <div className="kpi"><WalletCards size={18} /><h4>Pago anual</h4><p className="muted">Mercado Pago integrado con activacion automatica.</p></div>
          <div className="kpi"><QrCode size={18} /><h4>QR en PNG</h4><p className="muted">400px, listo para descargar y poner en tu local.</p></div>
          <div className="kpi"><Smartphone size={18} /><h4>Boton WhatsApp</h4><p className="muted">Abre la app desde el movil usando wa.me.</p></div>
        </div>
      </div>
    </div>
  );
}
