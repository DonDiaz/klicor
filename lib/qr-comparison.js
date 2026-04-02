import path from "node:path";
import { generateBrandedQrBuffer } from "@/lib/branded-qr";

export const QR_COMPARISON_URL = "https://klicor.com/u/demo123";

export async function generateClassicComparisonQrBuffer(value = QR_COMPARISON_URL) {
  return generateBrandedQrBuffer(value, { size: 520 });
}

export async function generateStyledComparisonQrBuffer(value = QR_COMPARISON_URL) {
  const { QRCodeCanvas } = await import("@loskir/styled-qr-code-node");
  const qr = new QRCodeCanvas({
    width: 520,
    height: 520,
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

  return qr.toBuffer("png");
}
