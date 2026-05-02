import { resolveCommerceCategoryAsset } from "@/lib/commerce-category-assets";

export function CommerceCategoryAsset({ iconKey, vertical = "", className = "", label = "" }) {
  const asset = resolveCommerceCategoryAsset(iconKey, vertical);

  return (
    <span className={`commerce-category-asset ${className}`.trim()} aria-hidden="true" title={label || asset.label}>
      <span className="commerce-category-asset-glow" />
      <span className="commerce-category-asset-symbol">{asset.symbol}</span>
      {asset.badge ? <span className="commerce-category-asset-badge">{asset.badge}</span> : null}
    </span>
  );
}
