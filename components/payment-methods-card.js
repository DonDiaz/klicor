"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Copy, Eye, QrCode, X } from "lucide-react";
import {
  resolvePaymentMethodDisplayValue,
  resolvePaymentMethodMeta,
  resolvePaymentMethodTitle,
} from "@/lib/payment-methods";

function PaymentMethodRow({
  method,
  preview,
  copiedValue,
  revealedId,
  onToggleReveal,
  onCopy,
  onOpenQr,
}) {
  const title = resolvePaymentMethodTitle(method);
  const meta = resolvePaymentMethodMeta(method);
  const displayValue = resolvePaymentMethodDisplayValue(method);
  const hasQr = Boolean(method.qrImageUrl);
  const isRevealed = revealedId === method.id;

  return (
    <article className="payment-method-card">
      <div className="payment-method-head">
        <div className="payment-method-title-line">
          <strong>{title}</strong>
          {meta ? <span className="payment-method-pill">{meta}</span> : null}
        </div>

        <div className="payment-method-actions">
          <button
            className="payment-method-icon-button is-view"
            type="button"
            onClick={() => onToggleReveal(method.id)}
            disabled={preview || !displayValue}
            aria-label={isRevealed ? "Ocultar información de pago" : "Ver información de pago"}
          >
            <Eye size={15} />
          </button>
          <button
            className="payment-method-icon-button is-copy"
            type="button"
            onClick={() => onCopy(displayValue)}
            disabled={preview || !displayValue}
            aria-label={copiedValue === displayValue ? "Información copiada" : "Copiar información de pago"}
          >
            <Copy size={15} />
          </button>
          <button
            className="payment-method-icon-button is-qr"
            type="button"
            onClick={() => onOpenQr(method.qrImageUrl)}
            disabled={preview || !hasQr}
            aria-label={hasQr ? "Ver QR oficial" : "QR no disponible"}
          >
            <QrCode size={15} />
          </button>
        </div>
      </div>

      {isRevealed && displayValue ? (
        <div className="payment-method-reveal">
          <span>{displayValue}</span>
        </div>
      ) : null}
    </article>
  );
}

export function PaymentMethodsCard({ methods = [], preview = false, sectionStyle = {} }) {
  const [copiedValue, setCopiedValue] = useState("");
  const [qrOpenUrl, setQrOpenUrl] = useState("");
  const [revealedId, setRevealedId] = useState("");
  const [sectionOpen, setSectionOpen] = useState(preview);

  const normalizedMethods = useMemo(
    () => methods.filter((method) => method?.entityId || method?.accountNumber || method?.brebKey),
    [methods],
  );

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

  if (!normalizedMethods.length) return null;

  return (
    <>
      <section className={`public-section payment-info-accordion${sectionOpen ? " is-open" : ""}`} style={sectionStyle}>
        <button
          className="payment-info-toggle"
          type="button"
          onClick={() => setSectionOpen((current) => !current)}
          aria-expanded={sectionOpen}
        >
          <span className="payment-info-toggle-copy">
            <strong>Información de pagos</strong>
            <span>Elige el método que prefieras para pagar</span>
          </span>
          <ChevronDown size={18} className="payment-info-toggle-icon" />
        </button>

        {sectionOpen ? (
          <div className="payment-methods-shell">
            {normalizedMethods.map((method) => (
              <PaymentMethodRow
                key={method.id}
                method={method}
                preview={preview}
                copiedValue={copiedValue}
                revealedId={revealedId}
                onToggleReveal={(id) => setRevealedId((current) => (current === id ? "" : id))}
                onCopy={handleCopy}
                onOpenQr={(url) => {
                  if (!preview && url) {
                    setQrOpenUrl(url);
                  }
                }}
              />
            ))}
          </div>
        ) : null}
      </section>

      {!preview && qrOpenUrl ? (
        <div className="qr-modal-backdrop" role="dialog" aria-modal="true" aria-label="QR oficial de pago">
          <div className="qr-modal-card">
            <button className="qr-modal-close" type="button" onClick={() => setQrOpenUrl("")} aria-label="Cerrar">
              <X size={18} />
            </button>
            <strong>QR oficial de pago</strong>
            <p>Este es el QR oficial cargado por el negocio para recibir pagos.</p>
            <div className="qr-modal-canvas">
              <img src={qrOpenUrl} alt="QR oficial del negocio" />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
