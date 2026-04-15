import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth";
import { isUsernameAvailable } from "@/lib/firestore";
import { sanitizeSlug } from "@/lib/utils";

export async function GET(request) {
  try {
    const { user } = await verifyRequest(request);
    const username = sanitizeSlug(request.nextUrl.searchParams.get("username") || "");

    if (username.length < 3) {
      return NextResponse.json({
        username,
        available: false,
        message: "El usuario debe tener mínimo 3 caracteres.",
      }, { status: 400 });
    }

    const available = await isUsernameAvailable(username, user.uid);

    return NextResponse.json({
      username,
      available,
      message: available
        ? "Este usuario está disponible."
        : "Ese usuario ya está en uso. Prueba con otro.",
    });
  } catch (error) {
    return NextResponse.json({
      error: error.message || "No pudimos validar el usuario.",
    }, { status: 400 });
  }
}
