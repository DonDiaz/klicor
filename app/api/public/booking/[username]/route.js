import { NextResponse } from "next/server";
import { formatApiError } from "@/lib/api-errors";
import { createBookingAppointment, getBookingAvailability } from "@/lib/booking-firestore";
import { getAdminAuth } from "@/lib/firebase-admin";
import { getUserByUsername } from "@/lib/firestore";
import { getPublicBookingBootstrapByUsername } from "@/lib/public-booking";
import { checkRateLimit, rateLimitHeaders, rateLimitResponse } from "@/lib/rate-limit";
import { createServerTiming } from "@/lib/server-timing";

async function readCustomerAuth(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    throw new Error("Inicia sesion con Google para enviar la cita.");
  }

  const decoded = await getAdminAuth().verifyIdToken(token);
  if (!decoded?.uid || !decoded?.email) {
    throw new Error("No pudimos validar tu cuenta de Google.");
  }

  return {
    uid: decoded.uid,
    email: decoded.email || "",
    emailVerified: Boolean(decoded.email_verified),
    name: decoded.name || "",
    photoURL: decoded.picture || "",
    provider: decoded.firebase?.sign_in_provider || "",
  };
}

export async function GET(request, { params }) {
  const timing = createServerTiming();
  const rate = checkRateLimit(request, {
    key: "public-booking-read",
    limit: 120,
    windowMs: 60_000,
  });
  if (rate.limited) return rateLimitResponse(rate);

  try {
    const { username } = await params;
    const owner = await timing.measure("owner", () => getUserByUsername(username), "public-booking-owner");
    if (!owner) {
      const payload = { error: "No encontramos ese negocio." };
      return NextResponse.json(payload, {
        status: 404,
        headers: timing.headers(payload, rateLimitHeaders(rate)),
      });
    }

    const { searchParams } = new URL(request.url);
    const serviceId = String(searchParams.get("serviceId") || "").trim();
    const date = String(searchParams.get("date") || "").trim();
    const staffId = String(searchParams.get("staffId") || "").trim();

    if (!serviceId) {
      const data = await timing.measure(
        "bootstrap",
        () => getPublicBookingBootstrapByUsername(username),
        "public-booking-bootstrap",
      );

      if (!data) {
        const payload = { error: "Este negocio no tiene agenda activa." };
        return NextResponse.json(payload, {
          status: 404,
          headers: timing.headers(payload, rateLimitHeaders(rate)),
        });
      }

      const payload = { data };
      return NextResponse.json(payload, {
        headers: timing.headers(payload, rateLimitHeaders(rate)),
      });
    }

    const availability = await timing.measure(
      "availability",
      () => getBookingAvailability(owner.uid, {
        serviceId,
        staffId,
        date,
        scanDays: date ? undefined : 30,
        availableDatesLimit: date ? undefined : 21,
      }, owner),
      date ? "booking-slots" : "booking-dates",
    );
    const payload = { data: availability };
    return NextResponse.json(payload, {
      headers: timing.headers(payload, rateLimitHeaders(rate)),
    });
  } catch (error) {
    const payload = { error: formatApiError(error, "No pudimos cargar la agenda pública.") };
    return NextResponse.json(payload, {
      status: 400,
      headers: timing.headers(payload, rateLimitHeaders(rate)),
    });
  }
}

export async function POST(request, { params }) {
  const timing = createServerTiming();
  const rate = checkRateLimit(request, {
    key: "public-booking-create",
    limit: 12,
    windowMs: 60_000,
  });
  if (rate.limited) return rateLimitResponse(rate, "Demasiados intentos de agenda. Intenta de nuevo en unos segundos.");

  try {
    const { username } = await params;
    const owner = await timing.measure("owner", () => getUserByUsername(username), "public-booking-owner");
    if (!owner) {
      const payload = { error: "No encontramos ese negocio." };
      return NextResponse.json(payload, {
        status: 404,
        headers: timing.headers(payload, rateLimitHeaders(rate)),
      });
    }

    const customerAuth = await timing.measure("customer", () => readCustomerAuth(request), "customer-auth");
    const body = await timing.measure("json", () => request.json(), "parse-json");
    const result = await timing.measure(
      "mutation",
      () => createBookingAppointment(owner.uid, body, { channel: "public", customerAuth }, owner),
      "create-booking",
    );

    const payload = { ok: true, result };
    return NextResponse.json(payload, {
      headers: timing.headers(payload, rateLimitHeaders(rate)),
    });
  } catch (error) {
    const payload = { error: formatApiError(error, "No pudimos agendar la cita.") };
    return NextResponse.json(payload, {
      status: 400,
      headers: timing.headers(payload, rateLimitHeaders(rate)),
    });
  }
}
