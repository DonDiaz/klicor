import path from "node:path";
import QRCode from "qrcode";
import sharp from "sharp";

export const STABLE_QR_VERSION = "stable-logo-v1";

function buildLogoPlate(size) {
  const radius = Math.round(size * 0.24);
  const stroke = Math.max(2, Math.round(size * 0.035));
  return Buffer.from(
    `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <rect
          x="0"
          y="0"
          width="${size}"
          height="${size}"
          rx="${radius}"
          fill="white"
        />
        <rect
          x="${stroke / 2}"
          y="${stroke / 2}"
          width="${size - stroke}"
          height="${size - stroke}"
          rx="${Math.max(0, radius - stroke / 2)}"
          fill="none"
          stroke="rgba(15,23,42,0.08)"
          stroke-width="${stroke}"
        />
      </svg>
    `.trim(),
  );
}

export async function generateBrandedQrBuffer(value, { size = 400 } = {}) {
  const qrBuffer = await QRCode.toBuffer(value, {
    type: "png",
    width: size,
    errorCorrectionLevel: "H",
    margin: 2,
  });

  const plateSize = Math.round(size * 0.24);
  const logoSize = Math.round(size * 0.16);
  const plateLeft = Math.round((size - plateSize) / 2);
  const plateTop = Math.round((size - plateSize) / 2);
  const logoLeft = Math.round((size - logoSize) / 2);
  const logoTop = Math.round((size - logoSize) / 2);
  const logoPath = path.join(process.cwd(), "public", "klicor-icon.png");

  const logoBuffer = await sharp(logoPath)
    .resize(logoSize, logoSize, { fit: "cover" })
    .png()
    .toBuffer();

  return sharp(qrBuffer)
    .composite([
      {
        input: buildLogoPlate(plateSize),
        left: plateLeft,
        top: plateTop,
      },
      {
        input: logoBuffer,
        left: logoLeft,
        top: logoTop,
      },
    ])
    .png()
    .toBuffer();
}
