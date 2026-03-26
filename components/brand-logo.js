"use client";

import clsx from "clsx";
import Image from "next/image";

export function BrandLogo({ size = 44, textClassName, lightText = false }) {
  const textColor = lightText ? "var(--dark-text)" : "var(--text-primary)";

  return (
    <div className="brand-logo">
      <Image
        src="/linka-icon.png"
        alt="Linka"
        width={size}
        height={size}
        className="brand-logo-icon"
        priority
      />
      <span className={clsx("brand-logo-text", textClassName)} style={{ color: textColor }}>
        Linka
      </span>
    </div>
  );
}
