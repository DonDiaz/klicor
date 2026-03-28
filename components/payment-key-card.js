"use client";

import { useEffect, useState } from "react";
import { Copy, QrCode, X } from "lucide-react";

export function PaymentKeyCard({ item, preview = false, buttonStyle = {}, buttonRadius = "14px" }) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    if (!qrOpen || preview || !item?.value) return undefined;

    let active = true;

    import("qrcode")
      .then(({ default: QRCode }) => QRCode.toDataURL(item.value, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 480,
      }))
      .then((nextUrl) => {
        if (active) setQrDataUrl(nextUrl);
      })
      .catch(() => {
        if (active) setQrDataUrl("");
      });

    return () => {
      active = false;
    };
  }, [item?.value, preview, qrOpen]);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = window.setTimeout(() => setCopied(false), 2200);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function handleCopy() {
    if (preview || !item?.value) return;
    try {
      await navigator.clipboard.writeText(item.value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <section className="payment-key-card">
        <div className="payment-key-head">
          <div>
            <strong>{item.label || "Llave Bre-B"}</strong>
            <p>Usa esta llave en tu app bancaria o billetera.</p>
          </div>
        </div>

        <div className="payment-key-value">
          {item.value}
        </div>

        <div className="payment-key-actions">
          {preview ? (
            <>
              <div className="public-link" style={{ ...buttonStyle, borderRadius: buttonRadius }}>
                <Copy size={18} />
                <span>Copiar llave</span>
              </div>
              <div className="public-link" style={{ ...buttonStyle, borderRadius: buttonRadius }}>
                <QrCode size={18} />
                <span>Mostrar QR</span>
              </div>
            </>
          ) : (
            <>
              <button className="public-link payment-key-action" style={{ ...buttonStyle, borderRadius: buttonRadius }} type="button" onClick={handleCopy}>
                <Copy size={18} />
                <span>{copied ? "Llave copiada" : "Copiar llave"}</span>
              </button>
              <button className="public-link payment-key-action" style={{ ...buttonStyle, borderRadius: buttonRadius }} type="button" onClick={() => setQrOpen(true)}>
                <QrCode size={18} />
                <span>Mostrar QR</span>
              </button>
            </>
          )}
        </div>
      </section>

      {!preview && qrOpen ? (
        <div className="qr-modal-backdrop" role="dialog" aria-modal="true" aria-label="QR de la llave">
          <div className="qr-modal-card">
            <button className="qr-modal-close" type="button" onClick={() => setQrOpen(false)} aria-label="Cerrar">
              <X size={18} />
            </button>
            <strong>{item.label || "Llave Bre-B"}</strong>
            <p>Escanea este QR o copia la llave manualmente en tu app de pagos.</p>
            <div className="qr-modal-canvas">
              {qrDataUrl ? <img src={qrDataUrl} alt={`QR de ${item.label || "llave"}`} /> : <span>Generando QR...</span>}
            </div>
            <code className="payment-key-code">{item.value}</code>
          </div>
        </div>
      ) : null}
    </>
  );
}
