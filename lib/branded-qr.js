import path from "node:path";
import QRCode from "qrcode";
import sharp from "sharp";

const KLICOR_PRIMARY = "#5B21B6";

export const STABLE_QR_VERSION = "stable-styled-v1";

function buildLogoPlate(size) {
  const radius = Math.round(size * 0.3);
  const stroke = Math.max(2, Math.round(size * 0.028));
  return Buffer.from(
    `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <rect
          x="0"
          y="0"
          width="${size}"
          height="${size}"
          rx="${radius}"
          fill="rgba(255,255,255,0.98)"
        />
        <rect
          x="${stroke / 2}"
          y="${stroke / 2}"
          width="${size - stroke}"
          height="${size - stroke}"
          rx="${Math.max(0, radius - stroke / 2)}"
          fill="none"
          stroke="rgba(15,23,42,0.06)"
          stroke-width="${stroke}"
        />
      </svg>
    `.trim(),
  );
}

export async function generateLegacyBrandedQrBuffer(value, { size = 400 } = {}) {
  const qrBuffer = await QRCode.toBuffer(value, {
    type: "png",
    width: size,
    errorCorrectionLevel: "H",
    margin: 2,
  });

  const plateSize = Math.round(size * 0.21);
  const logoSize = Math.round(size * 0.12);
  const plateLeft = Math.round((size - plateSize) / 2);
  const plateTop = Math.round((size - plateSize) / 2);
  const logoLeft = Math.round((size - logoSize) / 2);
  const logoTop = Math.round((size - logoSize) / 2);
  const logoPath = path.join(process.cwd(), "public", "klicor-icon.png");

  const logoBuffer = await sharp(logoPath)
    .trim()
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

export async function generateBrandedQrBuffer(value, { size = 400 } = {}) {
  const { QRCodeCanvas } = await import("@loskir/styled-qr-code-node");
  const qr = new QRCodeCanvas({
    width: size,
    height: size,
    data: value,
    margin: 12,
    image: path.join(process.cwd(), "public", "klicor-icon.png"),
    qrOptions: {
      errorCorrectionLevel: "H",
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: 0.26,
      margin: 8,
    },
    dotsOptions: {
      type: "rounded",
      color: "#0f172a",
    },
    cornersSquareOptions: {
      type: "extra-rounded",
      color: KLICOR_PRIMARY,
    },
    cornersDotOptions: {
      type: "dot",
      color: KLICOR_PRIMARY,
    },
    backgroundOptions: {
      color: "#ffffff",
    },
  });

  const svgBuffer = await qr.toBuffer("svg");
  const labelPath = path.join(process.cwd(), "public", "klicor-scan-label.png");
  const qrBuffer = await sharp(svgBuffer, { density: 320 })
    .flatten({ background: "#ffffff" })
    .resize(size, size, {
      fit: "contain",
      background: "#ffffff",
    })
    .png()
    .toBuffer();
  const labelBuffer = await sharp(labelPath)
    .resize({
      width: size,
      fit: "contain",
      background: "#ffffff",
    })
    .png()
    .toBuffer();
  const labelMetadata = await sharp(labelBuffer).metadata();
  const labelHeight = labelMetadata.height || Math.round(size * 0.18);

  return sharp({
    create: {
      width: size,
      height: size + labelHeight,
      channels: 4,
      background: "#ffffff",
    },
  })
    .composite([
      {
        input: qrBuffer,
        left: 0,
        top: 0,
      },
      {
        input: labelBuffer,
        left: 0,
        top: size,
      },
    ])
    .png()
    .toBuffer();
}
