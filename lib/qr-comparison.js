import path from "node:path";
import sharp from "sharp";
import { generateLegacyBrandedQrBuffer } from "@/lib/branded-qr";

export const QR_COMPARISON_URL = "https://klicor.com/u/demo123";
const QR_COMPARISON_SIZE = 520;
const KLICOR_PRIMARY = "#5B21B6";

export async function generateClassicComparisonQrBuffer(value = QR_COMPARISON_URL) {
  return generateLegacyBrandedQrBuffer(value, { size: QR_COMPARISON_SIZE });
}

export async function generateStyledComparisonQrBuffer(value = QR_COMPARISON_URL) {
  const { QRCodeCanvas } = await import("@loskir/styled-qr-code-node");
  const qr = new QRCodeCanvas({
    width: QR_COMPARISON_SIZE,
    height: QR_COMPARISON_SIZE,
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
    .resize(QR_COMPARISON_SIZE, QR_COMPARISON_SIZE, {
      fit: "contain",
      background: "#ffffff",
    })
    .png()
    .toBuffer();
  const labelBuffer = await sharp(labelPath)
    .resize({
      width: QR_COMPARISON_SIZE,
      fit: "contain",
      background: "#ffffff",
    })
    .png()
    .toBuffer();
  const labelMetadata = await sharp(labelBuffer).metadata();
  const labelHeight = labelMetadata.height || Math.round(QR_COMPARISON_SIZE * 0.18);

  return sharp({
    create: {
      width: QR_COMPARISON_SIZE,
      height: QR_COMPARISON_SIZE + labelHeight,
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
        top: QR_COMPARISON_SIZE,
      },
    ])
    .png()
    .toBuffer();
}
