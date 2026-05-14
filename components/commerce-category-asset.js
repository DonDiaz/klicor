import { resolveCommerceCategoryAsset } from "@/lib/commerce-category-assets";

export function CommerceCategoryAsset({ iconKey, vertical = "", className = "", label = "" }) {
  const asset = resolveCommerceCategoryAsset(iconKey, vertical);

  return (
    <span className={`commerce-category-asset ${className}`.trim()} aria-hidden="true" title={label || asset.label}>
      <img className="commerce-category-asset-image" src={asset.assetUrl} alt="" loading="lazy" />
    </span>
  );
}
