import clsx from "clsx";
import Image from "next/image";
import { Manrope } from "next/font/google";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
});

export function BrandLogo({ size = 44, textClassName, lightText = false }) {
  const textColor = lightText ? "var(--dark-text)" : "var(--text-primary)";

  return (
    <div className="brand-logo" aria-label="Klicor">
      <Image
        src="/klicor-icon.png"
        alt="Klicor"
        width={size}
        height={size}
        className="brand-logo-icon"
        priority
      />
      <span className={clsx("brand-logo-text", manrope.className, textClassName)} style={{ color: textColor }}>
        KLICOR
      </span>
    </div>
  );
}
