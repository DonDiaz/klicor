"use client";

import { Share2 } from "lucide-react";

export function PublicFloatingActions({ businessName = "Klicor", shareLabel = "Compartir" }) {
  async function handleShare() {
    if (typeof window === "undefined") return;

    const payload = {
      title: businessName,
      text: `Mira ${businessName} en Klicor`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch {
      // Ignoramos cancelaciones o bloqueos del navegador.
    }
  }

  return (
    <button
      className="floating-contact-button floating-share-live"
      type="button"
      onClick={handleShare}
      aria-label={shareLabel}
      title={shareLabel}
    >
      <Share2 size={20} />
    </button>
  );
}
