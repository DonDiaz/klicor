"use client";

import { useEffect, useState } from "react";
import { Copy, Landmark, QrCode, X } from "lucide-react";
import { PaymentKeyIcon } from "@/lib/link-catalog";
import { resolvePaymentMethodSubtitle, resolvePaymentMethodTitle } from "@/lib/payment-methods";

function PaymentValueRow({ icon: Icon, label, value, preview = false, onCopy, copied }) {
  if (!value) return null;

  return (
    <div className="payment-method-row-copy">
      <span className="payment-method-row-copy-label">
        <Icon size={16} />
        <span>{label}</span>
      </span>
      <span className="payment-method-row-copy-value">{value}</span>
      <button className="payment-method-icon-button" type="button" onClick={onCopy} disabled={preview} aria-label={copied ? `${label} copiado` : `Copiar ${label.toLowerCase()}`}>
        <Copy size={15} />
      </button>
    </div>
  );
}

export function PaymentMethodsCard({ methods = [], qrImageUrl = "", preview = false, cardStyle = {} }) {
  const [copiedValue, setCopiedValue] = useState("");
  const [qrOpen, setQrOpen] = useState(false);
  const hasQr = Boolean(qrImageUrl);

  useEffect(() => {
    if (!copiedValue) return undefined;
    const timer = window.setTimeout(() => setCopiedValue(""), 1800);
    return () => window.clearTimeout(timer);
  }, [copiedValue]);

  async function handleCopy(value) {
    if (preview || !value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(value);
    } catch {
      setCopiedValue("");
    }
  }

  if (!methods.length) return null;

  return (
    <>
      <div className="payment-methods-shell">
        {methods.map((method) => (
          <article className="payment-method-card" style={cardStyle} key={method.id}>
            <div className="payment-method-head">
              <div>
                <strong>{resolvePaymentMethodTitle(method)}</strong>
                <p>{resolvePaymentMethodSubtitle(method)}</p>
              </div>
              {hasQr ? (
                preview ? (
                  <span className="payment-method-icon-button is-static" aria-hidden="true">
                    <QrCode size={15} />
                  </span>
                ) : (
                  <button className="payment-method-icon-button" type="button" onClick={() => setQrOpen(true)} aria-label="Ver QR oficial">
                    <QrCode size={15} />
                  </button>
                )
              ) : null}
            </div>

            <div className="payment-method-body">
              <PaymentValueRow
                icon={Landmark}
                label="Cuenta"
                value={method.accountNumber}
                preview={preview}
                onCopy={() => handleCopy(method.accountNumber)}
                copied={copiedValue === method.accountNumber}
              />
              <PaymentValueRow
                icon={PaymentKeyIcon}
                label="Llave Bre-B"
                value={method.brebKey}
                preview={preview}
                onCopy={() => handleCopy(method.brebKey)}
                copied={copiedValue === method.brebKey}
              />
            </div>
          </article>
        ))}
      </div>

      {!preview && qrOpen && hasQr ? (
        <div className="qr-modal-backdrop" role="dialog" aria-modal="true" aria-label="QR oficial de pago">
          <div className="qr-modal-card">
            <button className="qr-modal-close" type="button" onClick={() => setQrOpen(false)} aria-label="Cerrar">
              <X size={18} />
            </button>
            <strong>QR oficial de pago</strong>
            <p>Este es el QR oficial cargado por el negocio para recibir pagos.</p>
            <div className="qr-modal-canvas">
              <img src={qrImageUrl} alt="QR oficial del negocio" />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
