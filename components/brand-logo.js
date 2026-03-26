"use client";

import clsx from "clsx";

export function BrandLogo({ size = 44, textClassName, lightText = false }) {
  const textColor = lightText ? "var(--dark-text)" : "var(--text-primary)";

  return (
    <div className="brand-logo">
      <svg
        aria-hidden="true"
        className="brand-logo-icon"
        viewBox="0 0 128 128"
        width={size}
        height={size}
      >
        <defs>
          <linearGradient id="linka-mark-gradient" x1="22" y1="16" x2="104" y2="108" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#E879F9" />
            <stop offset="0.52" stopColor="#A78BFA" />
            <stop offset="1" stopColor="#22D3EE" />
          </linearGradient>
          <linearGradient id="linka-surface-gradient" x1="18" y1="14" x2="108" y2="116" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#31105E" />
            <stop offset="1" stopColor="#160D33" />
          </linearGradient>
        </defs>

        <rect x="8" y="8" width="112" height="112" rx="28" fill="url(#linka-surface-gradient)" />
        <path
          d="M69 28.5c7 0 13.4 2.8 18 7.5l4.6 4.6c10 10 10 26.1 0 36.1l-17.6 17.7c-10 10-26.2 10-36.1 0l-.8-.8 11.3-11.3.8.8c3.7 3.7 9.6 3.7 13.2 0l17.6-17.6c3.6-3.7 3.6-9.6 0-13.2L75 47c-3.6-3.6-9.5-3.6-13.2 0L41.6 67.2c-3.6 3.7-3.6 9.6 0 13.2l.7.8-11.2 11.2-.8-.8c-10-10-10-26.1 0-36.1l20.2-20.3c4.7-4.6 11.2-7.2 18.5-7.2Z"
          fill="url(#linka-mark-gradient)"
        />
        <path
          d="M59 99.6c-7 0-13.4-2.8-18-7.5l-4.6-4.6c-10-10-10-26.1 0-36.1L54 33.8c10-10 26.2-10 36.1 0l.8.8-11.3 11.3-.8-.8c-3.7-3.7-9.6-3.7-13.2 0L48 62.8c-3.6 3.7-3.6 9.6 0 13.2l5 5c3.6 3.6 9.5 3.6 13.2 0l20.2-20.2c3.6-3.7 3.6-9.6 0-13.2l-.7-.8 11.2-11.2.8.8c10 10 10 26.1 0 36.1L77.5 92.4c-4.7 4.6-11.2 7.2-18.5 7.2Z"
          fill="url(#linka-mark-gradient)"
          opacity="0.96"
        />
      </svg>

      <span className={clsx("brand-logo-text", textClassName)} style={{ color: textColor }}>
        Linka
      </span>
    </div>
  );
}
