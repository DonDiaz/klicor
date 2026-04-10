import crypto from "node:crypto";
import sharp from "sharp";
import { revalidateTag } from "next/cache";
import {
  addDays,
  endOfDay,
  format,
  isAfter,
  isBefore,
  isSameDay,
  parseISO,
  startOfDay,
} from "date-fns";
import { es } from "date-fns/locale";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb, getAdminStorage } from "@/lib/firebase-admin";
import { getUserByUid } from "@/lib/firestore";
import {
  BOOKING_ACTIVE_STATUS_VALUES,
  BOOKING_MAX_DAYS_AHEAD_LIMIT,
  BOOKING_SLOT_INTERVAL_MINUTES,
  buildBookingPublicUrl,
  formatBookingDateLabel,
  formatBookingDateTimeLabel,
  formatTimeLabel,
  getDayScheduleWindows,
  minutesToTime,
  normalizeBookingConfig,
  normalizeTimeInput,
  normalizeWeeklySchedule,
  timeToMinutes,
} from "@/lib/booking-config";
import {
  bookingAppointmentCreateSchema,
  bookingAppointmentStatusSchema,
  bookingConfigSchema,
  bookingServiceSchema,
  bookingStaffSchema,
} from "@/lib/schemas";
import { buildWhatsappLink, sanitizePhone, sanitizeSlug, toDate } from "@/lib/utils";

const BOOKING_STAFF_IMAGE_WIDTH = 960;
const BOOKING_STAFF_IMAGE_THUMB_SIZE = 320;
const BOOKING_ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const BOOKING_MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

function usersCollection() {
  return getAdminDb().collection("users");
}

function servicesCollection(uid) {
  return usersCollection().doc(uid).collection("bookingServices");
}

function staffCollection(uid) {
  return usersCollection().doc(uid).collection("bookingStaff");
}

function appointmentsCollection(uid) {
  return usersCollection().doc(uid).collection("bookingAppointments");
}

function buildBookingId(prefix) {
  return `${prefix}_${crypto.randomBytes(6).toString("hex")}`;
}

function invalidatePublicBookingCache({ currentUsername = "" } = {}) {
  const slug = sanitizeSlug(currentUsername);
  if (!slug) return;
  revalidateTag(`public-booking:${slug}`);
}

function normalizeServiceDoc(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    name: String(data.name || "").trim(),
    description: String(data.description || "").trim(),
    durationMinutes: Math.max(Number(data.durationMinutes || 0) || 0, 0),
    price: Number.isFinite(Number(data.price)) ? Math.max(Math.round(Number(data.price)), 0) : null,
    isActive: data.isActive !== false,
    staffIds: Array.isArray(data.staffIds) ? data.staffIds.map((item) => String(item || "").trim()).filter(Boolean) : [],
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function normalizeStaffDoc(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    name: String(data.name || "").trim(),
    roleOrSpecialty: String(data.roleOrSpecialty || "").trim(),
    isActive: data.isActive !== false,
    photoUrl: String(data.photoUrl || "").trim(),
    photoThumbUrl: String(data.photoThumbUrl || data.photoUrl || "").trim(),
    photoPath: String(data.photoPath || "").trim(),
    photoThumbPath: String(data.photoThumbPath || "").trim(),
    serviceIds: Array.isArray(data.serviceIds) ? data.serviceIds.map((item) => String(item || "").trim()).filter(Boolean) : [],
    schedule: normalizeWeeklySchedule(data.schedule),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function normalizeAppointmentDoc(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    businessId: String(data.businessId || "").trim(),
    serviceId: String(data.serviceId || "").trim(),
    staffId: String(data.staffId || "").trim(),
    customerName: String(data.customerName || "").trim(),
    customerPhone: String(data.customerPhone || "").trim(),
    customerNote: String(data.customerNote || "").trim(),
    appointmentDate: String(data.appointmentDate || "").trim(),
    startTime: normalizeTimeInput(data.startTime || "00:00"),
    endTime: normalizeTimeInput(data.endTime || "00:00"),
    startMinutes: Math.max(Number(data.startMinutes || 0) || 0, 0),
    endMinutes: Math.max(Number(data.endMinutes || 0) || 0, 0),
    status: String(data.status || "pending").trim() || "pending",
    channel: String(data.channel || "public").trim() || "public",
    serviceNameSnapshot: String(data.serviceNameSnapshot || "").trim(),
    servicePriceSnapshot: Number.isFinite(Number(data.servicePriceSnapshot)) ? Math.max(Math.round(Number(data.servicePriceSnapshot)), 0) : null,
    serviceDurationSnapshot: Math.max(Number(data.serviceDurationSnapshot || 0) || 0, 0),
    staffNameSnapshot: String(data.staffNameSnapshot || "").trim(),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

async function optimizeBookingStaffPhoto(uid, staffId, file) {
  if (!file) return null;
  if (file.size > BOOKING_MAX_IMAGE_SIZE_BYTES) {
    throw new Error("La foto del profesional debe pesar menos de 5MB.");
  }
  if (!BOOKING_ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Sube la foto en JPG, PNG o WEBP.");
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const image = sharp(inputBuffer).rotate();
  const bucket = getAdminStorage();
  const basePath = `booking-staff/${uid}/${staffId}`;
  const mainPath = `${basePath}/main.webp`;
  const thumbPath = `${basePath}/thumb.webp`;

  const mainBuffer = await image
    .clone()
    .resize({
      width: BOOKING_STAFF_IMAGE_WIDTH,
      height: BOOKING_STAFF_IMAGE_WIDTH,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer();

  const thumbBuffer = await image
    .clone()
    .resize(BOOKING_STAFF_IMAGE_THUMB_SIZE, BOOKING_STAFF_IMAGE_THUMB_SIZE, {
      fit: "cover",
      position: "centre",
    })
    .webp({ quality: 76 })
    .toBuffer();

  await Promise.all([
    bucket.file(mainPath).save(mainBuffer, {
      contentType: "image/webp",
      resumable: false,
      public: true,
    }),
    bucket.file(thumbPath).save(thumbBuffer, {
      contentType: "image/webp",
      resumable: false,
      public: true,
    }),
  ]);

  return {
    photoUrl: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(mainPath)}?alt=media`,
    photoThumbUrl: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(thumbPath)}?alt=media`,
    photoPath: mainPath,
    photoThumbPath: thumbPath,
  };
}

async function removeStoragePaths(paths = []) {
  const bucket = getAdminStorage();
  await Promise.all(paths.filter(Boolean).map(async (path) => {
    try {
      await bucket.file(path).delete({ ignoreNotFound: true });
    } catch {
      // Ignore missing files.
    }
  }));
}

async function ensureBookingOwner(uid, user = null) {
  const owner = user || await getUserByUid(uid);
  if (!owner) throw new Error("Usuario no encontrado.");
  return owner;
}

function resolveBookingConfig(owner = {}) {
  return normalizeBookingConfig(owner.bookingConfig || owner);
}

function assertFutureBookingDate(dateString, config) {
  const date = parseISO(String(dateString || "").trim());
  if (Number.isNaN(date.getTime())) {
    throw new Error("Selecciona una fecha válida.");
  }

  const now = new Date();
  const today = startOfDay(now);
  const maxDate = endOfDay(addDays(today, Math.min(config.maxDaysAhead, BOOKING_MAX_DAYS_AHEAD_LIMIT)));

  if (isBefore(date, today)) {
    throw new Error("No puedes reservar en una fecha pasada.");
  }
  if (isAfter(date, maxDate)) {
    throw new Error("La fecha seleccionada supera el rango permitido.");
  }
  return date;
}

function getScheduleForDay(schedule = [], dayOfWeek = 0) {
  return normalizeWeeklySchedule(schedule).find((item) => item.dayOfWeek === dayOfWeek) || null;
}

function mergeWorkingWindows(businessDay, staffDay) {
  if (!businessDay?.isOpen || !staffDay?.isWorking) return [];

  const businessWindows = getDayScheduleWindows(businessDay);
  const staffWindows = getDayScheduleWindows(staffDay);
  const intersections = [];

  businessWindows.forEach((businessWindow) => {
    staffWindows.forEach((staffWindow) => {
      const startMinutes = Math.max(businessWindow.startMinutes, staffWindow.startMinutes);
      const endMinutes = Math.min(businessWindow.endMinutes, staffWindow.endMinutes);
      if (endMinutes > startMinutes) {
        intersections.push({ startMinutes, endMinutes });
      }
    });
  });

  return intersections;
}

function doesAppointmentOverlap(startMinutes, endMinutes, appointments = []) {
  return appointments.some((appointment) => {
    if (!BOOKING_ACTIVE_STATUS_VALUES.includes(appointment.status)) return false;
    return startMinutes < appointment.endMinutes && endMinutes > appointment.startMinutes;
  });
}

function buildDaySlotOptions({
  date,
  durationMinutes,
  config,
  service,
  selectedStaffId = "",
  staffMembers = [],
  appointmentsByStaff = new Map(),
}) {
  if (!service || !date || !durationMinutes) return [];
  const dayOfWeek = date.getDay();
  const businessDay = getScheduleForDay(config.businessSchedule, dayOfWeek);
  if (!businessDay?.isOpen) return [];

  const now = new Date();
  const minStartMinutes = isSameDay(date, now)
    ? now.getHours() * 60 + now.getMinutes() + Number(config.noticeMinutes || 0)
    : 0;

  const eligibleStaff = staffMembers.filter((staff) => {
    if (!staff?.isActive) return false;
    if (!staff.serviceIds.includes(service.id)) return false;
    if (selectedStaffId && selectedStaffId !== "any" && staff.id !== selectedStaffId) return false;
    const staffDay = getScheduleForDay(staff.schedule, dayOfWeek);
    return mergeWorkingWindows(businessDay, staffDay).length > 0;
  });

  if (!eligibleStaff.length) return [];

  const slotMap = new Map();

  eligibleStaff.forEach((staff) => {
    const staffDay = getScheduleForDay(staff.schedule, dayOfWeek);
    const workingWindows = mergeWorkingWindows(businessDay, staffDay);
    if (!workingWindows.length) return;

    const appointments = appointmentsByStaff.get(staff.id) || [];
    workingWindows.forEach((workingWindow) => {
      for (
        let startMinutes = workingWindow.startMinutes;
        startMinutes + durationMinutes <= workingWindow.endMinutes;
        startMinutes += BOOKING_SLOT_INTERVAL_MINUTES
      ) {
        const endMinutes = startMinutes + durationMinutes;
        if (startMinutes < minStartMinutes) continue;
        if (doesAppointmentOverlap(startMinutes, endMinutes, appointments)) continue;

        const key = minutesToTime(startMinutes);
        const currentSlot = slotMap.get(key) || {
          startTime: key,
          endTime: minutesToTime(endMinutes),
          label: formatTimeLabel(startMinutes),
          availableStaffIds: [],
        };
        currentSlot.availableStaffIds.push(staff.id);
        slotMap.set(key, currentSlot);
      }
    });
  });

  return [...slotMap.values()].sort((left, right) => timeToMinutes(left.startTime) - timeToMinutes(right.startTime));
}

async function getActiveServicesAndStaff(uid) {
  const [servicesSnap, staffSnap] = await Promise.all([
    servicesCollection(uid).orderBy("name").get(),
    staffCollection(uid).orderBy("name").get(),
  ]);

  const services = servicesSnap.docs.map(normalizeServiceDoc);
  const staff = staffSnap.docs.map(normalizeStaffDoc);

  return { services, staff };
}

async function getAppointmentsByDate(uid, dateString, staffIds = []) {
  if (!dateString) return [];

  const snap = await appointmentsCollection(uid)
    .where("appointmentDate", "==", dateString)
    .get();

  let appointments = snap.docs.map(normalizeAppointmentDoc);
  if (staffIds.length === 1) {
    appointments = appointments.filter((appointment) => appointment.staffId === staffIds[0]);
  } else if (staffIds.length > 1) {
    const allowedIds = new Set(staffIds);
    appointments = appointments.filter((appointment) => allowedIds.has(appointment.staffId));
  }

  return appointments.sort((left, right) => left.startMinutes - right.startMinutes);
}

function groupAppointmentsByStaff(appointments = []) {
  return appointments.reduce((map, appointment) => {
    const current = map.get(appointment.staffId) || [];
    current.push(appointment);
    map.set(appointment.staffId, current);
    return map;
  }, new Map());
}

function buildPublicBusinessPayload(owner = {}) {
  return {
    businessName: String(owner.businessName || "Tu negocio").trim(),
    username: String(owner.username || "").trim(),
    usernameLower: String(owner.usernameLower || owner.username || "").trim().toLowerCase(),
    photo: String(owner.photo || "").trim(),
    photoThumb: String(owner.photoThumb || owner.photo || "").trim(),
  };
}

function buildStatusMeta(status = "pending") {
  const map = {
    pending: { label: "Pendiente", tone: "pending" },
    confirmed: { label: "Confirmada", tone: "confirmed" },
    completed: { label: "Completada", tone: "completed" },
    cancelled_by_customer: { label: "Cancelada por cliente", tone: "cancelled" },
    cancelled_by_business: { label: "Cancelada por negocio", tone: "cancelled" },
    no_show: { label: "No asistió", tone: "warning" },
  };
  return map[status] || map.pending;
}

function buildAppointmentSummary(appointment, config) {
  const date = parseISO(appointment.appointmentDate);
  return {
    ...appointment,
    statusMeta: buildStatusMeta(appointment.status),
    dateLabel: formatBookingDateLabel(date),
    timeLabel: formatTimeLabel(appointment.startTime),
    dateTimeLabel: formatBookingDateTimeLabel(date, appointment.startTime),
    priceLabel: appointment.servicePriceSnapshot !== null && appointment.servicePriceSnapshot !== undefined
      ? `$${Number(appointment.servicePriceSnapshot || 0).toLocaleString("es-CO")}`
      : "Sin precio",
    durationLabel: `${appointment.serviceDurationSnapshot} min`,
    whatsappUrl: buildWhatsappLink(
      config.whatsappNumber,
      `Hola, acabo de agendar una cita para ${appointment.serviceNameSnapshot} el ${format(date, "d 'de' MMMM", { locale: es })} a las ${formatTimeLabel(appointment.startTime)}. Mi nombre es ${appointment.customerName}.`,
    ),
  };
}

function computeAgendaSummary({ dateString, config, services, staff, appointments }) {
  const pendingCount = appointments.filter((item) => item.status === "pending").length;
  const confirmedCount = appointments.filter((item) => item.status === "confirmed").length;
  const completedCount = appointments.filter((item) => item.status === "completed").length;
  const appointmentsByStaff = groupAppointmentsByStaff(appointments);
  const date = parseISO(dateString);

  let hasAvailability = false;
  staff.some((member) => {
    if (!member.isActive) return false;
    const eligibleServices = services
      .filter((service) => service.isActive && member.serviceIds.includes(service.id))
      .sort((left, right) => left.durationMinutes - right.durationMinutes);
    const sampleService = eligibleServices[0];
    if (!sampleService) return false;

    const slots = buildDaySlotOptions({
      date,
      durationMinutes: sampleService.durationMinutes,
      config,
      service: sampleService,
      selectedStaffId: member.id,
      staffMembers: [member],
      appointmentsByStaff,
    });

    if (slots.length) {
      hasAvailability = true;
      return true;
    }
    return false;
  });

  return {
    total: appointments.length,
    pendingCount,
    confirmedCount,
    completedCount,
    hasAvailability,
  };
}

function normalizeAppointmentFilters(filters = {}) {
  const date = String(filters.date || format(new Date(), "yyyy-MM-dd")).trim();
  return {
    date,
    staffId: String(filters.staffId || "").trim(),
  };
}

async function resolveServiceAndStaff(uid, { serviceId = "", staffId = "" } = {}) {
  const [serviceSnap, staffSnap] = await Promise.all([
    serviceId ? servicesCollection(uid).doc(serviceId).get() : null,
    staffId && staffId !== "any" ? staffCollection(uid).doc(staffId).get() : null,
  ]);

  const service = serviceSnap?.exists ? normalizeServiceDoc(serviceSnap) : null;
  const staff = staffSnap?.exists ? normalizeStaffDoc(staffSnap) : null;
  return { service, staff };
}

export async function getBookingAdminState(uid, filters = {}, user = null) {
  const owner = await ensureBookingOwner(uid, user);
  const config = resolveBookingConfig(owner);
  const normalizedFilters = normalizeAppointmentFilters(filters);
  const { services, staff } = await getActiveServicesAndStaff(uid);
  const appointments = await getAppointmentsByDate(uid, normalizedFilters.date, normalizedFilters.staffId ? [normalizedFilters.staffId] : []);

  return {
    filters: normalizedFilters,
    config,
    services,
    staff,
    appointments: appointments.map((appointment) => buildAppointmentSummary(appointment, config)),
    summary: computeAgendaSummary({
      dateString: normalizedFilters.date,
      config,
      services,
      staff,
      appointments,
    }),
    publicUrl: owner.usernameLower ? buildBookingPublicUrl(owner.usernameLower) : "",
  };
}

export async function saveBookingConfig(uid, rawInput, user = null) {
  const owner = await ensureBookingOwner(uid, user);
  const parsed = bookingConfigSchema.parse({
    ...rawInput,
    businessSchedule: rawInput.businessSchedule,
  });
  const normalized = normalizeBookingConfig(parsed);

  await usersCollection().doc(uid).set({
    bookingConfig: normalized,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  invalidatePublicBookingCache({ currentUsername: owner.usernameLower || owner.username });
  return normalized;
}

export async function saveBookingService(uid, rawInput, user = null) {
  const owner = await ensureBookingOwner(uid, user);
  const parsed = bookingServiceSchema.parse(rawInput);
  const ref = parsed.id ? servicesCollection(uid).doc(parsed.id) : servicesCollection(uid).doc(buildBookingId("svc"));
  const existingSnap = await ref.get();

  await ref.set({
    name: parsed.name,
    description: parsed.description || "",
    durationMinutes: parsed.durationMinutes,
    price: parsed.price === null || parsed.price === undefined || parsed.price === "" ? null : Math.max(Math.round(Number(parsed.price)), 0),
    isActive: parsed.isActive !== false,
    staffIds: parsed.staffIds,
    createdAt: existingSnap.exists ? existingSnap.data()?.createdAt || FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  const staffSnap = await staffCollection(uid).get();
  await Promise.all(staffSnap.docs.map((doc) => {
    const current = normalizeStaffDoc(doc);
    const shouldInclude = parsed.staffIds.includes(doc.id);
    const hasService = current.serviceIds.includes(ref.id);
    if (shouldInclude && !hasService) {
      return doc.ref.set({
        serviceIds: [...current.serviceIds, ref.id],
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    if (!shouldInclude && hasService) {
      return doc.ref.set({
        serviceIds: current.serviceIds.filter((item) => item !== ref.id),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    return Promise.resolve();
  }));

  invalidatePublicBookingCache({ currentUsername: owner.usernameLower || owner.username });
  return { serviceId: ref.id };
}

export async function toggleBookingService(uid, serviceId, isActive, user = null) {
  const owner = await ensureBookingOwner(uid, user);
  await servicesCollection(uid).doc(serviceId).set({
    isActive: Boolean(isActive),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  invalidatePublicBookingCache({ currentUsername: owner.usernameLower || owner.username });
  return { serviceId };
}

export async function saveBookingStaff(uid, rawInput, assets = {}, user = null) {
  const owner = await ensureBookingOwner(uid, user);
  const parsed = bookingStaffSchema.parse(rawInput);
  const ref = parsed.id ? staffCollection(uid).doc(parsed.id) : staffCollection(uid).doc(buildBookingId("staff"));
  const existingSnap = await ref.get();
  const existing = existingSnap.exists ? normalizeStaffDoc(existingSnap) : null;
  const photoAsset = assets.photo?.size ? await optimizeBookingStaffPhoto(uid, ref.id, assets.photo) : null;

  await ref.set({
    name: parsed.name,
    roleOrSpecialty: parsed.roleOrSpecialty || "",
    isActive: parsed.isActive !== false,
    serviceIds: parsed.serviceIds,
    schedule: normalizeWeeklySchedule(parsed.schedule),
    photoUrl: photoAsset?.photoUrl || existing?.photoUrl || "",
    photoThumbUrl: photoAsset?.photoThumbUrl || existing?.photoThumbUrl || existing?.photoUrl || "",
    photoPath: photoAsset?.photoPath || existing?.photoPath || "",
    photoThumbPath: photoAsset?.photoThumbPath || existing?.photoThumbPath || "",
    createdAt: existingSnap.exists ? existingSnap.data()?.createdAt || FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  const servicesSnap = await servicesCollection(uid).get();
  await Promise.all(servicesSnap.docs.map((doc) => {
    const current = normalizeServiceDoc(doc);
    const shouldInclude = parsed.serviceIds.includes(doc.id);
    const hasStaff = current.staffIds.includes(ref.id);
    if (shouldInclude && !hasStaff) {
      return doc.ref.set({
        staffIds: [...current.staffIds, ref.id],
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    if (!shouldInclude && hasStaff) {
      return doc.ref.set({
        staffIds: current.staffIds.filter((item) => item !== ref.id),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    return Promise.resolve();
  }));

  if (photoAsset && existing) {
    await removeStoragePaths([existing.photoPath, existing.photoThumbPath]);
  }

  invalidatePublicBookingCache({ currentUsername: owner.usernameLower || owner.username });
  return { staffId: ref.id };
}

export async function toggleBookingStaff(uid, staffId, isActive, user = null) {
  const owner = await ensureBookingOwner(uid, user);
  await staffCollection(uid).doc(staffId).set({
    isActive: Boolean(isActive),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  invalidatePublicBookingCache({ currentUsername: owner.usernameLower || owner.username });
  return { staffId };
}

export async function getBookingAvailability(uid, rawInput = {}, user = null) {
  const owner = await ensureBookingOwner(uid, user);
  const config = resolveBookingConfig(owner);
  const { service, staff: selectedStaff } = await resolveServiceAndStaff(uid, rawInput);

  if (!config.enabled) {
    return { availableDates: [], slots: [], date: "", selectedStaffId: selectedStaff?.id || rawInput.staffId || "any" };
  }
  if (!service || service.isActive === false) {
    throw new Error("Selecciona un servicio disponible.");
  }

  const { staff } = await getActiveServicesAndStaff(uid);
  const availableStaff = staff.filter((member) => member.isActive && member.serviceIds.includes(service.id));

  if (rawInput.date) {
    const date = assertFutureBookingDate(rawInput.date, config);
    const appointments = await getAppointmentsByDate(uid, rawInput.date, availableStaff.map((member) => member.id));
    const appointmentsByStaff = groupAppointmentsByStaff(appointments);
    const slots = buildDaySlotOptions({
      date,
      durationMinutes: service.durationMinutes,
      config,
      service,
      selectedStaffId: selectedStaff?.id || rawInput.staffId || "",
      staffMembers: availableStaff,
      appointmentsByStaff,
    });

    return {
      date: rawInput.date,
      availableDates: [],
      slots,
      selectedStaffId: selectedStaff?.id || rawInput.staffId || "any",
    };
  }

  const startDate = startOfDay(new Date());
  const availableDates = [];

  for (let offset = 0; offset <= config.maxDaysAhead; offset += 1) {
    const date = addDays(startDate, offset);
    const dateString = format(date, "yyyy-MM-dd");
    const appointments = await getAppointmentsByDate(uid, dateString, availableStaff.map((member) => member.id));
    const appointmentsByStaff = groupAppointmentsByStaff(appointments);
    const slots = buildDaySlotOptions({
      date,
      durationMinutes: service.durationMinutes,
      config,
      service,
      selectedStaffId: selectedStaff?.id || rawInput.staffId || "",
      staffMembers: availableStaff,
      appointmentsByStaff,
    });

    if (slots.length) {
      availableDates.push({
        date: dateString,
        label: formatBookingDateLabel(date),
      });
    }
  }

  return {
    date: "",
    availableDates,
    slots: [],
    selectedStaffId: selectedStaff?.id || rawInput.staffId || "any",
  };
}

async function chooseAvailableStaffForSlot(uid, {
  dateString,
  service,
  config,
  selectedStaffId = "",
  startTime,
}) {
  const { staff } = await getActiveServicesAndStaff(uid);
  const availableStaff = staff.filter((member) => member.isActive && member.serviceIds.includes(service.id));
  const appointments = await getAppointmentsByDate(uid, dateString, availableStaff.map((member) => member.id));
  const appointmentsByStaff = groupAppointmentsByStaff(appointments);
  const slots = buildDaySlotOptions({
    date: parseISO(dateString),
    durationMinutes: service.durationMinutes,
    config,
    service,
    selectedStaffId,
    staffMembers: availableStaff,
    appointmentsByStaff,
  });
  const slot = slots.find((item) => item.startTime === normalizeTimeInput(startTime));
  if (!slot) {
    throw new Error("Ese horario ya no está disponible. Elige otro.");
  }
  return {
    slot,
    staffId: selectedStaffId && selectedStaffId !== "any"
      ? selectedStaffId
      : slot.availableStaffIds[0],
  };
}

export async function createBookingAppointment(uid, rawInput, options = {}, user = null) {
  const owner = await ensureBookingOwner(uid, user);
  const config = resolveBookingConfig(owner);
  if (!config.enabled) {
    throw new Error("El agendamiento no está activo en este negocio.");
  }

  const parsed = bookingAppointmentCreateSchema.parse(rawInput);
  const date = assertFutureBookingDate(parsed.appointmentDate, config);
  const { service } = await resolveServiceAndStaff(uid, {
    serviceId: parsed.serviceId,
  });

  if (!service || !service.isActive) {
    throw new Error("Selecciona un servicio disponible.");
  }

  const resolvedSlot = await chooseAvailableStaffForSlot(uid, {
    dateString: parsed.appointmentDate,
    service,
    config,
    selectedStaffId: parsed.staffId || "",
    startTime: parsed.startTime,
  });
  const ref = appointmentsCollection(uid).doc(buildBookingId("appt"));
  const status = config.autoConfirmBooking ? "confirmed" : "pending";
  const startMinutes = timeToMinutes(resolvedSlot.slot.startTime);
  const endMinutes = timeToMinutes(resolvedSlot.slot.endTime);
  let assignedStaffName = "";

  await getAdminDb().runTransaction(async (transaction) => {
    const dayAppointmentsSnap = await transaction.get(
      appointmentsCollection(uid).where("appointmentDate", "==", parsed.appointmentDate),
    );
    const dayAppointments = dayAppointmentsSnap.docs.map(normalizeAppointmentDoc);
    const candidateStaffIds = parsed.staffId && parsed.staffId !== "any"
      ? [resolvedSlot.staffId]
      : resolvedSlot.slot.availableStaffIds;

    let assignedStaffId = "";
    let assignedStaff = null;

    for (const candidateStaffId of candidateStaffIds) {
      const staffSnap = await transaction.get(staffCollection(uid).doc(candidateStaffId));
      if (!staffSnap.exists) continue;

      const overlaps = dayAppointments.filter((appointment) => appointment.staffId === candidateStaffId);
      if (doesAppointmentOverlap(startMinutes, endMinutes, overlaps)) {
        continue;
      }

      assignedStaffId = candidateStaffId;
      assignedStaff = normalizeStaffDoc(staffSnap);
      assignedStaffName = assignedStaff.name;
      break;
    }

    if (!assignedStaffId || !assignedStaff) {
      throw new Error("Ese horario acaba de ocuparse. Elige otro.");
    }

    transaction.set(ref, {
      businessId: uid,
      serviceId: service.id,
      staffId: assignedStaffId,
      customerName: parsed.customerName,
      customerPhone: sanitizePhone(parsed.customerPhone),
      customerNote: parsed.customerNote || "",
      appointmentDate: parsed.appointmentDate,
      startTime: resolvedSlot.slot.startTime,
      endTime: resolvedSlot.slot.endTime,
      startMinutes,
      endMinutes,
      status,
      channel: options.channel || "public",
      serviceNameSnapshot: service.name,
      servicePriceSnapshot: service.price,
      serviceDurationSnapshot: service.durationMinutes,
      staffNameSnapshot: assignedStaff.name,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  const savedSnap = await ref.get();
  const appointment = buildAppointmentSummary(normalizeAppointmentDoc(savedSnap), config);

  return {
    appointment,
    summary: {
      service: service.name,
      professional: assignedStaffName || appointment.staffNameSnapshot,
      dateLabel: formatBookingDateLabel(date),
      timeLabel: formatTimeLabel(resolvedSlot.slot.startTime),
      durationLabel: `${service.durationMinutes} min`,
      priceLabel: service.price !== null && service.price !== undefined
        ? `$${Number(service.price || 0).toLocaleString("es-CO")}`
        : "Sin precio",
    },
  };
}

export async function updateBookingAppointmentStatus(uid, rawInput, user = null) {
  await ensureBookingOwner(uid, user);
  const parsed = bookingAppointmentStatusSchema.parse(rawInput);

  await appointmentsCollection(uid).doc(parsed.id).set({
    status: parsed.status,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  return { appointmentId: parsed.id };
}

export async function getPublicBookingBootstrap(owner) {
  const config = resolveBookingConfig(owner);
  if (!config.enabled) return null;

  const { services, staff } = await getActiveServicesAndStaff(owner.uid);
  const activeServices = services.filter((service) => service.isActive && service.staffIds.length);
  const activeServiceIds = new Set(activeServices.map((service) => service.id));
  const activeStaff = staff
    .filter((member) => member.isActive && member.serviceIds.some((serviceId) => activeServiceIds.has(serviceId)))
    .map((member) => ({
      id: member.id,
      name: member.name,
      roleOrSpecialty: member.roleOrSpecialty,
      photoUrl: member.photoUrl,
      photoThumbUrl: member.photoThumbUrl,
      serviceIds: member.serviceIds.filter((serviceId) => activeServiceIds.has(serviceId)),
    }));

  return {
    business: buildPublicBusinessPayload(owner),
    appearance: owner.settings || {},
    route: buildBookingPublicUrl(owner.usernameLower || owner.username),
    config,
    services: activeServices,
    staff: activeStaff,
  };
}

export function buildPublicBookingWhatsappMessage(appointment = {}) {
  return `Hola, acabo de agendar una cita para ${appointment.serviceNameSnapshot} el ${appointment.dateLabel} a las ${appointment.timeLabel}. Mi nombre es ${appointment.customerName}.`;
}
