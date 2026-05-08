import { resolveCommerceCategoryAsset } from "@/lib/commerce-category-assets";

function ShoeVector({ visual }) {
  const upper = visual?.upper || "#f8fafc";
  const sole = visual?.sole || "#e5e7eb";
  const accent = visual?.accent || "#6d28d9";
  const type = visual?.type || "sneaker";
  const isBoot = type.includes("boot");
  const isHeel = type.includes("heel") || type === "stiletto" || type === "wedge";
  const isSandal = type.includes("sandal") || type === "flip_flop";
  const isFlat = type === "flat" || type === "loafer" || type === "formal";
  const isBaby = type === "baby" || type === "kids" || type === "school";
  const soleHeight = type.includes("platform") ? 9 : 6;

  return (
    <svg className="commerce-category-asset-svg" viewBox="0 0 64 64" role="presentation" focusable="false">
      <ellipse cx="32" cy="52" rx="22" ry="5" fill="rgba(15,23,42,0.14)" />
      {isBoot ? (
        <>
          <path d="M20 11h17c3 0 5 2 5 5v23h-24V14c0-2 1-3 2-3Z" fill={upper} />
          <path d="M18 36h23c4 0 7 2 10 6l4 5c1 2 0 4-3 4H16c-4 0-6-2-5-5l4-7c1-2 2-3 3-3Z" fill={upper} />
          <path d="M14 48h39c2 0 3 1 3 3s-2 4-5 4H14c-4 0-6-2-5-5 1-1 2-2 5-2Z" fill={sole} />
          <path d="M24 15h10M24 21h10M23 28h13" stroke={accent} strokeWidth="2.2" strokeLinecap="round" />
        </>
      ) : isHeel ? (
        <>
          <path d="M14 35c9-1 17-6 25-15 4-4 8-3 11 1l4 6c2 3 0 7-4 7H30c-4 0-8 2-11 5l-3 3c-3 2-6-4-2-7Z" fill={upper} />
          <path d="M18 43h34c3 0 5 1 5 3s-2 4-5 4H16c-3 0-5-1-5-3s3-4 7-4Z" fill={sole} />
          <path d="M45 48l5 11M25 42l-5 15" stroke={accent} strokeWidth={type === "stiletto" ? "2" : "4"} strokeLinecap="round" />
          <path d="M38 23l8 10" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
        </>
      ) : isSandal ? (
        <>
          <path d="M13 40c10 3 22 3 38 0 3-1 6 1 6 4 0 3-2 5-6 5H16c-5 0-8-3-6-6 1-2 2-3 3-3Z" fill={sole} />
          <path d="M18 38c6-8 15-11 27-10M22 43c8-5 17-6 27-3" stroke={upper} strokeWidth="6" strokeLinecap="round" />
          <path d="M31 30l7 17M39 30l-8 17" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d={isFlat ? "M12 35c8-3 16-5 25-11 4-3 8-2 12 2l6 7c3 4 1 9-5 9H17c-5 0-9-4-5-7Z" : "M12 35c8 0 15-5 23-15 4-5 9-5 13-1l8 9c4 5 1 12-6 12H18c-5 0-9-2-6-5Z"} fill={upper} />
          <path d={`M14 ${42 - soleHeight / 2}h38c4 0 6 2 6 5s-3 5-8 5H15c-5 0-8-2-8-5s3-5 7-5Z`} fill={sole} />
          {isBaby ? <circle cx="25" cy="34" r="4" fill={accent} /> : null}
          <path d="M27 28h14M24 33h18M21 38h20" stroke={accent} strokeWidth="2.4" strokeLinecap="round" opacity="0.9" />
          <path d="M48 23l6 7" stroke="rgba(255,255,255,0.72)" strokeWidth="3" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export function CommerceCategoryAsset({ iconKey, vertical = "", className = "", label = "" }) {
  const asset = resolveCommerceCategoryAsset(iconKey, vertical);

  return (
    <span className={`commerce-category-asset ${className}`.trim()} aria-hidden="true" title={label || asset.label}>
      <span className="commerce-category-asset-glow" />
      {asset.assetUrl ? (
        <img className="commerce-category-asset-image" src={asset.assetUrl} alt="" loading="lazy" />
      ) : asset.visual?.family === "shoe" ? (
        <ShoeVector visual={asset.visual} />
      ) : (
        <span className="commerce-category-asset-symbol">{asset.symbol}</span>
      )}
      {asset.badge ? <span className="commerce-category-asset-badge">{asset.badge}</span> : null}
    </span>
  );
}
