import { NextResponse } from "next/server";
import { trackClick } from "@/lib/firestore";

export async function GET(request) {
  const username = request.nextUrl.searchParams.get("username");
  const button = request.nextUrl.searchParams.get("button") || "unknown";
  const target = request.nextUrl.searchParams.get("target") || "/";

  if (username) {
    await trackClick(username, button);
  }

  return NextResponse.redirect(target);
}
