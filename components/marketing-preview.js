import Image from "next/image";

export function MarketingPreview() {
  return (
    <div className="preview-frame marketing-demo-frame">
      <div className="marketing-demo-surface">
        <Image
          src="/marketing-demo-mobile.jpeg"
          alt="Vista de Klicor en un celular"
          width={345}
          height={746}
          className="marketing-demo-image"
          priority
        />
      </div>
    </div>
  );
}
