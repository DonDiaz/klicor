import Image from "next/image";

export function MarketingPreview() {
  return (
    <div className="preview-frame marketing-demo-frame">
      <div className="marketing-demo-stage">
        <Image
          src="/marketing-demo-qr.png"
          alt="QR de Klicor"
          width={400}
          height={500}
          className="marketing-demo-qr"
          priority
        />
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
    </div>
  );
}
