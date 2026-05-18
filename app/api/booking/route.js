import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth";
import { formatApiError } from "@/lib/api-errors";
import { createServerTiming } from "@/lib/server-timing";
import { assertModuleAccess } from "@/lib/plans";
import { assertAgencyCanEditBusiness } from "@/lib/agency";
import {
  createBookingAppointment,
  deleteBookingStaff,
  getBookingAdminState,
  getBookingStaffActiveAppointments,
  getBookingAvailability,
  saveBookingConfig,
  saveBookingService,
  saveBookingStaff,
  toggleBookingService,
  toggleBookingStaff,
  updateBookingAppointmentSchedule,
  updateBookingAppointmentStatus,
} from "@/lib/booking-firestore";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
};
const AGENCY_BOOKING_ACTIONS = new Set([
  "save_config",
  "save_service",
  "toggle_service",
  "save_staff",
  "toggle_staff",
  "delete_staff",
]);

function parsePayload(formData) {
  const raw = formData.get("payload");
  if (typeof raw !== "string" || !raw.trim()) return {};
  return JSON.parse(raw);
}

export async function GET(request) {
  const timing = createServerTiming();

  try {
    const { user } = await timing.measure("auth", () => verifyRequest(request), "verify");
    const { searchParams } = new URL(request.url);
    const targetUid = String(searchParams.get("targetUid") || "").trim();
    const agencyAccess = targetUid ? await timing.measure("agency", () => assertAgencyCanEditBusiness(user, targetUid, "booking"), "agency") : null;
    const effectiveUser = agencyAccess?.business || user;
    assertModuleAccess(effectiveUser, "booking");
    const view = String(searchParams.get("view") || "state").trim().toLowerCase();

    if (view === "availability") {
      const availability = await timing.measure(
        "availability",
        () => getBookingAvailability(effectiveUser.uid, {
          serviceId: String(searchParams.get("serviceId") || "").trim(),
          staffId: String(searchParams.get("staffId") || "").trim(),
          date: String(searchParams.get("date") || "").trim(),
          excludeAppointmentId: String(searchParams.get("excludeAppointmentId") || "").trim(),
        }, effectiveUser),
        "booking-availability",
      );

      const payload = { availability };
      return NextResponse.json(payload, { headers: timing.headers(payload, NO_STORE_HEADERS) });
    }

    if (view === "staff-blockers") {
      const appointments = await timing.measure(
        "staff-blockers",
        () => getBookingStaffActiveAppointments(
          effectiveUser.uid,
          String(searchParams.get("staffId") || "").trim(),
          effectiveUser,
        ),
        "booking-staff-blockers",
      );
      const payload = { appointments };
      return NextResponse.json(payload, { headers: timing.headers(payload, NO_STORE_HEADERS) });
    }

    const state = await timing.measure(
      "state",
      () => getBookingAdminState(effectiveUser.uid, {
        date: String(searchParams.get("date") || "").trim(),
        staffId: String(searchParams.get("staffId") || "").trim(),
      }, effectiveUser),
      "booking-state",
    );
    const payload = { state };
    return NextResponse.json(payload, { headers: timing.headers(payload, NO_STORE_HEADERS) });
  } catch (error) {
    const payload = { error: formatApiError(error, "No pudimos cargar la agenda.") };
    return NextResponse.json(payload, {
      status: 400,
      headers: timing.headers(payload, NO_STORE_HEADERS),
    });
  }
}

export async function POST(request) {
  const timing = createServerTiming();

  try {
    const { user } = await timing.measure("auth", () => verifyRequest(request), "verify");
    const formData = await timing.measure("formdata", () => request.formData(), "parse");
    const targetUid = String(formData.get("targetUid") || "").trim();
    const agencyAccess = targetUid ? await timing.measure("agency", () => assertAgencyCanEditBusiness(user, targetUid, "booking"), "agency") : null;
    const effectiveUser = agencyAccess?.business || user;
    assertModuleAccess(effectiveUser, "booking");
    const action = String(formData.get("action") || "").trim();
    if (agencyAccess && !AGENCY_BOOKING_ACTIONS.has(action)) {
      throw new Error("La agencia solo puede configurar agenda, servicios y profesionales. Las citas las gestiona el dueño.");
    }
    const payload = parsePayload(formData);
    const photo = formData.get("photo");

    let result = null;

    switch (action) {
      case "save_config":
        result = await timing.measure("mutation", () => saveBookingConfig(effectiveUser.uid, payload, effectiveUser), action);
        break;
      case "save_service":
        result = await timing.measure("mutation", () => saveBookingService(effectiveUser.uid, payload, {
          photo: photo?.size ? photo : null,
        }, effectiveUser), action);
        break;
      case "toggle_service":
        result = await timing.measure("mutation", () => toggleBookingService(effectiveUser.uid, payload.serviceId, payload.isActive, effectiveUser), action);
        break;
      case "save_staff":
        result = await timing.measure("mutation", () => saveBookingStaff(effectiveUser.uid, payload, {
          photo: photo?.size ? photo : null,
        }, effectiveUser), action);
        break;
      case "toggle_staff":
        result = await timing.measure("mutation", () => toggleBookingStaff(effectiveUser.uid, payload.staffId, payload.isActive, effectiveUser), action);
        break;
      case "delete_staff":
        result = await timing.measure("mutation", () => deleteBookingStaff(effectiveUser.uid, payload.staffId, effectiveUser), action);
        break;
      case "create_appointment":
        result = await timing.measure("mutation", () => createBookingAppointment(effectiveUser.uid, payload, { channel: "admin" }, effectiveUser), action);
        break;
      case "update_appointment_status":
        result = await timing.measure("mutation", () => updateBookingAppointmentStatus(effectiveUser.uid, payload, effectiveUser), action);
        break;
      case "reschedule_appointment":
        result = await timing.measure("mutation", () => updateBookingAppointmentSchedule(effectiveUser.uid, payload, effectiveUser), action);
        break;
      default:
        throw new Error("Acción de agenda no soportada.");
    }

    const payloadResponse = { ok: true, result };
    return NextResponse.json(payloadResponse, {
      headers: timing.headers(payloadResponse, NO_STORE_HEADERS),
    });
  } catch (error) {
    const payloadResponse = { error: formatApiError(error, "No pudimos guardar los cambios de agenda.") };
    return NextResponse.json(payloadResponse, {
      status: 400,
      headers: timing.headers(payloadResponse, NO_STORE_HEADERS),
    });
  }
}
