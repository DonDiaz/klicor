import { NextResponse } from "next/server";
import { requireAdmin, verifyRequest } from "@/lib/auth";
import { createDorikaPlace, createDorikaRoute, getDorikaAdminSnapshot } from "@/lib/dorika-firestore";

export async function GET(request) {
  try {
    const auth = await verifyRequest(request);
    requireAdmin(auth);
    return NextResponse.json(await getDorikaAdminSnapshot());
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(request) {
  try {
    const auth = await verifyRequest(request);
    requireAdmin(auth);

    const body = await request.json();
    const action = String(body.action || "").trim();
    let result = null;

    if (action === "create_place") {
      result = await createDorikaPlace(body.payload || {});
    } else if (action === "create_route") {
      result = await createDorikaRoute(body.payload || {});
    } else {
      throw new Error("Acción Dorika no soportada.");
    }

    return NextResponse.json({
      ok: true,
      result,
      snapshot: await getDorikaAdminSnapshot(),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
