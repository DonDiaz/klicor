import path from "node:path";
import sharp from "sharp";
import { generateBrandedQrBuffer } from "@/lib/branded-qr";

export const QR_COMPARISON_URL = "https://klicor.com/u/demo123";
const QR_COMPARISON_SIZE = 520;
const STYLED_QR_LABEL = "Escan&#233;ame";

function buildScanLabelSvg(width, height, text) {
  const fontSize = Math.round(width * 0.09);

  return Buffer.from(
    `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="#ffffff" />
        <text
          x="50%"
          y="50%"
          text-anchor="middle"
          dominant-baseline="middle"
          fill="#0f172a"
          font-size="${fontSize}"
          font-family="Inter, Manrope, Segoe UI, Arial, sans-serif"
          font-weight="800"
          letter-spacing="-0.03em"
        >
          ${text}
        </text>
      </svg>
    `.trim(),
  );
}

export async function generateClassicComparisonQrBuffer(value = QR_COMPARISON_URL) {
  return generateBrandedQrBuffer(value, { size: QR_COMPARISON_SIZE });
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
      color: "#2563eb",
    },
    cornersDotOptions: {
      type: "dot",
      color: "#2563eb",
    },
    backgroundOptions: {
      color: "#ffffff",
    },
  });

  const svgBuffer = await qr.toBuffer("svg");
  const labelHeight = Math.round(QR_COMPARISON_SIZE * 0.18);
  const qrBuffer = await sharp(svgBuffer, { density: 320 })
    .flatten({ background: "#ffffff" })
    .resize(QR_COMPARISON_SIZE, QR_COMPARISON_SIZE, {
      fit: "contain",
      background: "#ffffff",
    })
    .png()
    .toBuffer();

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
        input: buildScanLabelSvg(QR_COMPARISON_SIZE, labelHeight, STYLED_QR_LABEL),
        left: 0,
        top: QR_COMPARISON_SIZE,
      },
    ])
    .png()
    .toBuffer();
}
