"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Copy, Eye, EyeOff, QrCode, X } from "lucide-react";
import {
  resolvePaymentMethodDisplayValue,
  resolvePaymentMethodMeta,
  resolvePaymentMethodTitle,
} from "@/lib/payment-methods";

function PaymentMethodAccordionItem({
  method,
  hasQr,
  preview,
  isOpen,
  isRevealed,
  copiedValue,
  onToggle,
  onToggleReveal,
  onCopy,
  onOpenQr,
}) {
  const title = resolvePaymentMethodTitle(method);
  const meta = resolvePaymentMethodMeta(method);
  const displayValue = resolvePaymentMethodDisplayValue(method);

  return (
    <article className={`payment-method-card${isOpen ? " is-open" : ""}`}>
      <button className="payment-method-toggle" type="button" onClick={onToggle} aria-expanded={isOpen}>
        <span className="payment-method-toggle-copy">
          <strong>{title}</strong>
          {meta ? <span>{meta}</span> : null}
        </span>
        <ChevronDown size={18} className="payment-method-toggle-icon" />
      </button>

      {isOpen ? (
        <div className="payment-method-body">
          <div className="payment-method-actions">
            <button
              className="payment-method-icon-button"
              type="button"
              onClick={onToggleReveal}
              disabled={preview || !displayValue}
              aria-label={isRevealed ? "Ocultar información de pago" : "Ver información de pago"}
            >
              {isRevealed ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
            <button
              className="payment-method-icon-button"
              type="button"
              onClick={onCopy}
              disabled={preview || !displayValue}
              aria-label={copiedValue === displayValue ? "Información copiada" : "Copiar información de pago"}
            >
              <Copy size={15} />
            </button>
            <button
              className={`payment-method-icon-button${!hasQr ? " is-static" : ""}`}
              type="button"
              onClick={onOpenQr}
              disabled={preview || !hasQr}
              aria-label={hasQr ? "Ver QR oficial" : "QR no disponible"}
            >
              <QrCode size={15} />
            </button>
          </div>

          {isRevealed && displayValue ? (
            <div className="payment-method-reveal">
              <span>{displayValue}</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export function PaymentMethodsCard({ methods = [], qrImageUrl = "", preview = false }) {
  const [copiedValue, setCopiedValue] = useState("");
  const [qrOpen, setQrOpen] = useState(false);
  const [openId, setOpenId] = useState("");
  const [revealedId, setRevealedId] = useState("");
  const hasQr = Boolean(qrImageUrl);

  const normalizedMethods = useMemo(() => methods.filter((method) => method?.entityId || method?.accountNumber || method?.brebKey), [methods]);

  useEffect(() => {
    if (!copiedValue) return undefined;
    const timer = window.setTimeout(() => setCopiedValue(""), 1800);
    return () => window.clearTimeout(timer);
  }, [copiedValue]);

  useEffect(() => {
    if (!normalizedMethods.length) {
      setOpenId("");
      return;
    }

    setOpenId((current) => (normalizedMethods.some((method) => method.id === current) ? current : normalizedMethods[0].id));
  }, [normalizedMethods]);

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
      <div className="payment-methods-shell">
        {normalizedMethods.map((method) => {
          const displayValue = resolvePaymentMethodDisplayValue(method);
          const isOpen = openId === method.id;
          const isRevealed = revealedId === method.id;

          return (
            <PaymentMethodAccordionItem
              key={method.id}
              method={method}
              hasQr={hasQr}
              preview={preview}
              isOpen={isOpen}
              isRevealed={isRevealed}
              copiedValue={copiedValue}
              onToggle={() => {
                setOpenId((current) => (current === method.id ? "" : method.id));
                setRevealedId("");
              }}
              onToggleReveal={() => setRevealedId((current) => (current === method.id ? "" : method.id))}
              onCopy={() => handleCopy(displayValue)}
              onOpenQr={() => {
                if (!preview && hasQr) {
                  setQrOpen(true);
                }
              }}
            />
          );
        })}
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
