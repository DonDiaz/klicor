import { NextResponse } from "next/server";
import {
  QR_COMPARISON_URL,
  generateClassicComparisonQrBuffer,
  generateStyledComparisonQrBuffer,
} from "@/lib/qr-comparison";

export const runtime = "nodejs";

const STYLE_GENERATORS = {
  classic: generateClassicComparisonQrBuffer,
  styled: generateStyledComparisonQrBuffer,
};

function resolveComparisonValue(searchParams) {
  const rawValue = searchParams.get("value")?.trim();
  if (!rawValue) {
    return QR_COMPARISON_URL;
  }

  return rawValue.slice(0, 1024);
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const style = searchParams.get("style") === "styled" ? "styled" : "classic";
    const shouldDownload = searchParams.get("download") === "1";
    const value = resolveComparisonValue(searchParams);
    const generator = STYLE_GENERATORS[style];
    const buffer = await generator(value);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `${shouldDownload ? "attachment" : "inline"}; filename="klicor-qr-${style}.png"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "No se pudo generar el QR de comparación" },
      { status: 400 },
    );
  }
}
