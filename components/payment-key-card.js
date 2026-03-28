"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Copy, QrCode, X } from "lucide-react";
import { PaymentKeyIcon } from "@/lib/link-catalog";

export function PaymentKeyCard({ item, qrImageUrl = "", preview = false, buttonStyle = {}, buttonRadius = "14px" }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(preview);
  const [qrOpen, setQrOpen] = useState(false);
  const hasQr = Boolean(qrImageUrl);

  useEffect(() => {
    if (preview) {
      setExpanded(true);
    }
  }, [preview]);

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

  function handleToggle() {
    if (preview) return;
    setExpanded((current) => !current);
  }

  return (
    <>
      <div className="payment-key-shell">
        <button
          className="public-link payment-key-toggle"
          style={{ ...buttonStyle, borderRadius: buttonRadius }}
          type="button"
          onClick={handleToggle}
          aria-expanded={expanded}
        >
          <span className="payment-key-toggle-copy">
            <PaymentKeyIcon size={18} />
            <span>{item.label || "Llave Bre-B"}</span>
          </span>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {expanded ? (
          <section className="payment-key-card">
            <div className="payment-key-head">
              <div>
                <strong>{item.label || "Llave Bre-B"}</strong>
                <p>Usa esta llave en Nequi, Daviplata o tu app bancaria.</p>
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
                  {hasQr ? (
                    <div className="public-link" style={{ ...buttonStyle, borderRadius: buttonRadius }}>
                      <QrCode size={18} />
                      <span>Ver QR</span>
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <button className="public-link payment-key-action" style={{ ...buttonStyle, borderRadius: buttonRadius }} type="button" onClick={handleCopy}>
                    <Copy size={18} />
                    <span>{copied ? "Llave copiada" : "Copiar llave"}</span>
                  </button>
                  {hasQr ? (
                    <button className="public-link payment-key-action" style={{ ...buttonStyle, borderRadius: buttonRadius }} type="button" onClick={() => setQrOpen(true)}>
                      <QrCode size={18} />
                      <span>Ver QR</span>
                    </button>
                  ) : null}
                </>
              )}
            </div>
          </section>
        ) : null}
      </div>

      {!preview && qrOpen && hasQr ? (
        <div className="qr-modal-backdrop" role="dialog" aria-modal="true" aria-label="QR oficial de pago">
          <div className="qr-modal-card">
            <button className="qr-modal-close" type="button" onClick={() => setQrOpen(false)} aria-label="Cerrar">
              <X size={18} />
            </button>
            <strong>{item.label || "Llave Bre-B"}</strong>
            <p>Este es el QR oficial cargado por el negocio para recibir pagos.</p>
            <div className="qr-modal-canvas">
              <img src={qrImageUrl} alt={`QR oficial de ${item.label || "llave"}`} />
            </div>
            <code className="payment-key-code">{item.value}</code>
          </div>
        </div>
      ) : null}
    </>
  );
}
