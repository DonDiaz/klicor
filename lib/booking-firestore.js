import crypto from "node:crypto";
import sharp from "sharp";
import { revalidateTag } from "next/cache";
import {
  addDays,
  endOfDay,
  format,
  isAfter,
  isBefore,
} from "date-fns";
import { es } from "date-fns/locale";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb, getAdminStorage } from "@/lib/firebase-admin";
import { getAppUrl } from "@/lib/env";
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
  bookingAppointmentScheduleSchema,
  bookingAppointmentStatusSchema,
  bookingConfigSchema,
  bookingServiceSchema,
  bookingStaffSchema,
} from "@/lib/schemas";
import { buildWhatsappLink, sanitizePhone, sanitizeSlug, toDate } from "@/lib/utils";
import {
  sendBookingBusinessNotification,
  sendBookingCustomerConfirmation,
  sendBookingCustomerReminder,
  sendBookingCustomerUpdate,
} from "@/lib/mailer";
import { canUseModule, getPlanLimit } from "@/lib/plans";

const BOOKING_STAFF_IMAGE_WIDTH = 960;
const BOOKING_STAFF_IMAGE_THUMB_SIZE = 320;
const BOOKING_ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const BOOKING_MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const BOOKING_REMINDER_SWEEP_WINDOW_MINUTES = 20;
const BOOKING_DEFAULT_AVAILABLE_DATES_LIMIT = 21;
const BOOKING_MIN_LEAD_TIME_MINUTES = 30;

function buildPublicStorageUrl(path = "") {
  const bucket = process.env.FIREBASE_STORAGE_BUCKET;
  const cleanPath = String(path || "").trim();
  if (!bucket || !cleanPath) return "";
  return `https://storage.googleapis.com/${bucket}/${cleanPath.split("/").map(encodeURIComponent).join("/")}`;
}

export async function runBookingReminderSweep(now = new Date()) {
  const today = getBogotaDateString(0, now);
  const tomorrow = getBogotaDateString(1, now);
  const usersSnap = await usersCollection()
    .where("bookingConfig.reminderEnabled", "==", true)
    .get();
  const actions = [];
  const stats = {
    usersMatched: usersSnap.size,
    usersEligible: 0,
    appointmentsScanned: 0,
    skippedInactiveOwner: 0,
    skippedStatus: 0,
    skippedAlreadyHandled: 0,
    skippedAlreadySent: 0,
    skippedAlreadySkipped: 0,
    skippedMissingEmail: 0,
    skippedOutsideWindow: 0,
    remindersSent: 0,
    window: {
      fromDate: today,
      toDate: tomorrow,
      sweepLateToleranceMinutes: BOOKING_REMINDER_SWEEP_WINDOW_MINUTES,
    },
  };

  for (const userDoc of usersSnap.docs) {
    const owner = { id: userDoc.id, uid: userDoc.id, ...userDoc.data() };
    const config = resolveBookingConfig(owner);
    if (!config.enabled || !config.reminderEnabled || !canUseModule(owner, "booking")) {
      stats.skippedInactiveOwner += 1;
      continue;
    }
    stats.usersEligible += 1;

    const reminderMinutes = Number(config.reminderMinutesBefore || 60);
    const appointmentsSnap = await appointmentsCollection(owner.uid)
      .where("appointmentDate", ">=", today)
      .where("appointmentDate", "<=", tomorrow)
      .get();
    stats.appointmentsScanned += appointmentsSnap.size;

    for (const appointmentDoc of appointmentsSnap.docs) {
      const data = appointmentDoc.data();
      if (data.status !== "confirmed") {
        stats.skippedStatus += 1;
        continue;
      }
      if (data.reminderSentAt) {
        stats.skippedAlreadyHandled += 1;
        stats.skippedAlreadySent += 1;
        continue;
      }
      if (data.reminderSkippedAt) {
        stats.skippedAlreadyHandled += 1;
        stats.skippedAlreadySkipped += 1;
        continue;
      }

      const appointment = buildAppointmentSummary(normalizeAppointmentDoc(appointmentDoc), config);
      if (!appointment.customerEmail) {
        await appointmentDoc.ref.set({
          reminderSkippedAt: FieldValue.serverTimestamp(),
          reminderSkipReason: "missing_customer_email",
        }, { merge: true });
        stats.skippedMissingEmail += 1;
        actions.push({ uid: owner.uid, appointmentId: appointment.id, action: "skipped_missing_email" });
        continue;
      }

      const startsAtMs = bookingDateTimeToUtcMs(appointment.appointmentDate, appointment.startTime);
      const minutesUntil = Math.round((startsAtMs - now.getTime()) / 60000);
      if (minutesUntil > reminderMinutes || minutesUntil < -BOOKING_REMINDER_SWEEP_WINDOW_MINUTES) {
        stats.skippedOutsideWindow += 1;
        continue;
      }

      const summary = buildMailSummaryFromAppointment(appointment);
      await notifyCustomerReminder({ owner, appointment, summary });
      await appointmentDoc.ref.set({
        reminderSentAt: FieldValue.serverTimestamp(),
        reminderMinutesBefore: reminderMinutes,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      stats.remindersSent += 1;
      actions.push({ uid: owner.uid, appointmentId: appointment.id, action: "reminder_sent" });
    }
  }

  return { actions, stats };
}

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

function customersCollection(uid) {
  return usersCollection().doc(uid).collection("bookingCustomers");
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
    photoPath: String(data.photoPath || "").trim(),
    photoThumbPath: String(data.photoThumbPath || "").trim(),
    photoUrl: String(data.photoPath ? buildPublicStorageUrl(data.photoPath) : data.photoUrl || data.photo || "").trim(),
    photoThumbUrl: String(data.photoThumbPath ? buildPublicStorageUrl(data.photoThumbPath) : data.photoThumbUrl || data.photoThumb || data.photoUrl || data.photo || "").trim(),
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
    photoPath: String(data.photoPath || "").trim(),
    photoThumbPath: String(data.photoThumbPath || "").trim(),
    photoUrl: String(data.photoPath ? buildPublicStorageUrl(data.photoPath) : data.photoUrl || data.photo || "").trim(),
    photoThumbUrl: String(data.photoThumbPath ? buildPublicStorageUrl(data.photoThumbPath) : data.photoThumbUrl || data.photoThumb || data.photoUrl || data.photo || "").trim(),
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
    customerUid: String(data.customerUid || "").trim(),
    customerEmail: String(data.customerEmail || "").trim().toLowerCase(),
    customerEmailVerified: Boolean(data.customerEmailVerified || false),
    customerPhotoURL: String(data.customerPhotoURL || "").trim(),
    customerAuthProvider: String(data.customerAuthProvider || "").trim(),
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
    }),
    bucket.file(thumbPath).save(thumbBuffer, {
      contentType: "image/webp",
      resumable: false,
    }),
  ]);
  await Promise.all([
    bucket.file(mainPath).makePublic(),
    bucket.file(thumbPath).makePublic(),
  ]);

  return {
    photoUrl: buildPublicStorageUrl(mainPath),
    photoThumbUrl: buildPublicStorageUrl(thumbPath),
    photoPath: mainPath,
    photoThumbPath: thumbPath,
  };
}

async function optimizeBookingServicePhoto(uid, serviceId, file) {
  if (!file || !file.size) return null;
  if (file.size > BOOKING_MAX_IMAGE_SIZE_BYTES) {
    throw new Error("La imagen no puede superar 5 MB.");
  }
  if (!BOOKING_ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Usa una imagen JPG, PNG o WebP.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const bucket = getAdminStorage();
  const basePath = `booking-services/${uid}/${serviceId}`;
  const mainPath = `${basePath}/photo.webp`;
  const thumbPath = `${basePath}/thumb.webp`;
  const mainBuffer = await sharp(buffer)
    .rotate()
    .resize({
      width: BOOKING_STAFF_IMAGE_WIDTH,
      height: BOOKING_STAFF_IMAGE_WIDTH,
      fit: "cover",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer();
  const thumbBuffer = await sharp(buffer)
    .rotate()
    .resize(BOOKING_STAFF_IMAGE_THUMB_SIZE, BOOKING_STAFF_IMAGE_THUMB_SIZE, { fit: "cover" })
    .webp({ quality: 78 })
    .toBuffer();

  await Promise.all([
    bucket.file(mainPath).save(mainBuffer, { contentType: "image/webp", resumable: false }),
    bucket.file(thumbPath).save(thumbBuffer, { contentType: "image/webp", resumable: false }),
  ]);
  await Promise.all([
    bucket.file(mainPath).makePublic(),
    bucket.file(thumbPath).makePublic(),
  ]);

  return {
    photoUrl: buildPublicStorageUrl(mainPath),
    photoThumbUrl: buildPublicStorageUrl(thumbPath),
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
  const date = parseBookingDateString(String(dateString || "").trim());
  if (Number.isNaN(date.getTime())) {
    throw new Error("Selecciona una fecha válida.");
  }

  const today = parseBookingDateString(getBogotaDateString());
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
  const dayOfWeek = date.getUTCDay();
  const businessDay = getScheduleForDay(config.businessSchedule, dayOfWeek);
  if (!businessDay?.isOpen) return [];

  const now = getBogotaNowParts();
  const dateString = format(date, "yyyy-MM-dd");
  const leadTimeMinutes = Math.max(Number(config.noticeMinutes || 0), BOOKING_MIN_LEAD_TIME_MINUTES);
  const minStartMinutes = dateString === now.dateString
    ? now.minutes + leadTimeMinutes
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

function filterAvailableStaffForService(staff = [], serviceId = "", selectedStaffId = "") {
  return staff.filter((member) => {
    if (!member) return false;
    if (!member.isActive) return false;
    if (!member.serviceIds.includes(serviceId)) return false;
    if (selectedStaffId && selectedStaffId !== "any" && member.id !== selectedStaffId) return false;
    return true;
  });
}

async function getAvailableStaffForService(uid, serviceId = "", selectedStaffId = "", selectedStaff = null) {
  if (selectedStaffId && selectedStaffId !== "any") {
    let member = selectedStaff;
    if (!member) {
      const staffSnap = await staffCollection(uid).doc(selectedStaffId).get();
      member = staffSnap.exists ? normalizeStaffDoc(staffSnap) : null;
    }
    return filterAvailableStaffForService([member], serviceId, selectedStaffId);
  }

  const { staff } = await getActiveServicesAndStaff(uid);
  return filterAvailableStaffForService(staff, serviceId);
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

async function getAppointmentsByDateRange(uid, startDateString, endDateString, staffIds = []) {
  if (!startDateString || !endDateString) return [];

  const snap = await appointmentsCollection(uid)
    .where("appointmentDate", ">=", startDateString)
    .where("appointmentDate", "<=", endDateString)
    .get();

  let appointments = snap.docs.map(normalizeAppointmentDoc);
  if (staffIds.length === 1) {
    appointments = appointments.filter((appointment) => appointment.staffId === staffIds[0]);
  } else if (staffIds.length > 1) {
    const allowedIds = new Set(staffIds);
    appointments = appointments.filter((appointment) => allowedIds.has(appointment.staffId));
  }

  return appointments.sort((left, right) => (
    left.appointmentDate.localeCompare(right.appointmentDate) || left.startMinutes - right.startMinutes
  ));
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
    businessCategory: String(owner.businessCategory || owner.dorikaProfile?.category || "").trim(),
    businessType: String(owner.businessType || owner.dorikaProfile?.businessType || "").trim(),
    username: String(owner.username || "").trim(),
    usernameLower: String(owner.usernameLower || owner.username || "").trim().toLowerCase(),
    photo: String(owner.photo || "").trim(),
    photoThumb: String(owner.photoThumb || owner.photo || "").trim(),
  };
}

function buildStatusMeta(status = "pending") {
  const map = {
    pending: { label: "Solicitud pendiente", tone: "pending" },
    confirmed: { label: "Confirmada", tone: "confirmed" },
    completed: { label: "Completada", tone: "completed" },
    cancelled_by_customer: { label: "Cancelada por cliente", tone: "cancelled" },
    cancelled_by_business: { label: "Cancelada por negocio", tone: "cancelled" },
    no_show: { label: "No asistió", tone: "warning" },
  };
  return map[status] || map.pending;
}

function buildAppointmentSummary(appointment, config) {
  const date = parseBookingDateString(appointment.appointmentDate);
  const formattedDate = format(date, "d 'de' MMMM", { locale: es });
  const formattedTime = formatTimeLabel(appointment.startTime);
  const whatsappMessage = appointment.status === "confirmed"
    ? `Hola, tengo una cita confirmada para ${appointment.serviceNameSnapshot} el ${formattedDate} a las ${formattedTime}. Mi nombre es ${appointment.customerName}.`
    : `Hola, envié una solicitud de cita para ${appointment.serviceNameSnapshot} el ${formattedDate} a las ${formattedTime}. Mi nombre es ${appointment.customerName}.`;

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
      whatsappMessage,
    ),
  };
}

function getBookingPublicUrl(owner = {}) {
  const route = buildBookingPublicUrl(owner.usernameLower || owner.username);
  return route ? `${getAppUrl()}${route}` : "";
}

function getBookingDashboardUrl() {
  return `${getAppUrl()}/dashboard`;
}

function getBogotaNowParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date).reduce((map, part) => {
    map[part.type] = part.value;
    return map;
  }, {});

  return {
    dateString: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: (Number(parts.hour || 0) * 60) + Number(parts.minute || 0),
  };
}

function getBogotaDateString(offsetDays = 0, baseDate = new Date()) {
  const shifted = new Date(baseDate.getTime() + (offsetDays * 24 * 60 * 60 * 1000));
  return getBogotaNowParts(shifted).dateString;
}

function parseBookingDateString(dateString = "") {
  const [year, month, day] = String(dateString || "").split("-").map(Number);
  if (!year || !month || !day) return new Date(Number.NaN);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function bookingDateTimeToUtcMs(dateString = "", time = "00:00") {
  const [year, month, day] = String(dateString || "").split("-").map(Number);
  const [hours, minutes] = normalizeTimeInput(time).split(":").map(Number);
  if (!year || !month || !day) return 0;
  return Date.UTC(year, month - 1, day, hours + 5, minutes);
}

function buildMailSummaryFromAppointment(appointment = {}) {
  return {
    service: appointment.serviceNameSnapshot,
    professional: appointment.staffNameSnapshot,
    dateLabel: appointment.dateLabel,
    timeLabel: appointment.timeLabel,
    durationLabel: appointment.durationLabel,
    priceLabel: appointment.priceLabel,
  };
}

async function safelySendBookingEmail(task, context = {}) {
  try {
    const result = await task();
    if (result?.skipped) {
      const reason = result.reason || "skipped";
      console.warn("[booking-email]", reason, context);
      return { ok: false, skipped: true, reason };
    }
    return {
      ok: true,
      id: result?.data?.id || result?.id || "",
    };
  } catch (error) {
    const message = error?.message || String(error);
    console.error("[booking-email]", message, context);
    return { ok: false, skipped: false, reason: message };
  }
}

async function upsertBookingCustomer(uid, appointment = {}, customerAuth = {}) {
  if (!customerAuth?.uid) return;

  await customersCollection(uid).doc(customerAuth.uid).set({
    uid: customerAuth.uid,
    name: appointment.customerName || customerAuth.name || "",
    email: customerAuth.email || appointment.customerEmail || "",
    emailVerified: Boolean(customerAuth.emailVerified),
    photoURL: customerAuth.photoURL || "",
    authProvider: customerAuth.provider || appointment.customerAuthProvider || "",
    phone: appointment.customerPhone || "",
    lastAppointmentId: appointment.id || "",
    lastAppointmentAt: appointment.appointmentDate || "",
    updatedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

async function notifyBusinessAboutNewBooking({ owner, config, appointment, summary, mode }) {
  if (config.notifyBusinessOnRequest === false) return { ok: false, skipped: true, reason: "business_notification_disabled" };
  if (!owner?.email) return { ok: false, skipped: true, reason: "missing_business_email" };

  return safelySendBookingEmail(() => sendBookingBusinessNotification({
    to: owner.email,
    businessName: owner.businessName || "Tu negocio",
    appointment,
    summary,
    dashboardUrl: getBookingDashboardUrl(),
    mode,
  }), { type: "business_notification", appointmentId: appointment?.id, uid: owner?.uid });
}

async function notifyCustomerConfirmed({ owner, config, appointment, summary }) {
  if (config.notifyCustomerOnConfirmation === false) return { ok: false, skipped: true, reason: "customer_confirmation_disabled" };
  if (!appointment?.customerEmail) return { ok: false, skipped: true, reason: "missing_customer_email" };

  return safelySendBookingEmail(() => sendBookingCustomerConfirmation({
    to: appointment.customerEmail,
    businessName: owner.businessName || "el negocio",
    appointment,
    summary,
    publicUrl: getBookingPublicUrl(owner),
  }), { type: "customer_confirmation", appointmentId: appointment?.id, uid: owner?.uid });
}

async function notifyCustomerReminder({ owner, appointment, summary }) {
  if (!appointment?.customerEmail) return { ok: false, skipped: true, reason: "missing_customer_email" };

  return safelySendBookingEmail(() => sendBookingCustomerReminder({
    to: appointment.customerEmail,
    businessName: owner.businessName || "el negocio",
    appointment,
    summary,
    publicUrl: getBookingPublicUrl(owner),
  }), { type: "customer_reminder", appointmentId: appointment?.id, uid: owner?.uid });
}

async function notifyCustomerUpdated({ owner, config, appointment, summary, updateType }) {
  if (config.notifyCustomerOnConfirmation === false) return { ok: false, skipped: true, reason: "customer_update_disabled" };
  if (!appointment?.customerEmail) return { ok: false, skipped: true, reason: "missing_customer_email" };

  return safelySendBookingEmail(() => sendBookingCustomerUpdate({
    to: appointment.customerEmail,
    businessName: owner.businessName || "el negocio",
    appointment,
    summary,
    publicUrl: getBookingPublicUrl(owner),
    updateType,
  }), { type: `customer_${updateType}`, appointmentId: appointment?.id, uid: owner?.uid });
}

function computeAgendaSummary({ dateString, config, services, staff, appointments }) {
  const pendingCount = appointments.filter((item) => item.status === "pending").length;
  const confirmedCount = appointments.filter((item) => item.status === "confirmed").length;
  const completedCount = appointments.filter((item) => item.status === "completed").length;
  const appointmentsByStaff = groupAppointmentsByStaff(appointments);
  const date = parseBookingDateString(dateString);

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
    ownerUid: uid,
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

  const ref = usersCollection().doc(uid);
  await ref.set({
    bookingConfig: normalized,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  invalidatePublicBookingCache({ currentUsername: owner.usernameLower || owner.username });
  const savedSnap = await ref.get();
  const saved = savedSnap.exists ? savedSnap.data() : {};
  return normalizeBookingConfig(saved.bookingConfig || saved);
}

export async function saveBookingService(uid, rawInput, assets = {}, user = null) {
  const owner = await ensureBookingOwner(uid, user);
  const parsed = bookingServiceSchema.parse(rawInput);
  const ref = parsed.id ? servicesCollection(uid).doc(parsed.id) : servicesCollection(uid).doc(buildBookingId("svc"));
  const existingSnap = await ref.get();
  const existing = existingSnap.exists ? normalizeServiceDoc(existingSnap) : null;
  if (!existing) {
    const maxServices = getPlanLimit(owner.plan || owner.status, "bookingServices");
    const existingCount = (await servicesCollection(uid).count().get()).data().count || 0;
    if (existingCount >= maxServices) {
      throw new Error(`Tu plan permite hasta ${maxServices} servicios.`);
    }
  }
  const photoAsset = assets.photo?.size ? await optimizeBookingServicePhoto(uid, ref.id, assets.photo) : null;

  await ref.set({
    name: parsed.name,
    description: parsed.description || "",
    durationMinutes: parsed.durationMinutes,
    price: parsed.price === null || parsed.price === undefined || parsed.price === "" ? null : Math.max(Math.round(Number(parsed.price)), 0),
    isActive: parsed.isActive !== false,
    staffIds: parsed.staffIds,
    photoUrl: photoAsset?.photoUrl || existing?.photoUrl || "",
    photoThumbUrl: photoAsset?.photoThumbUrl || existing?.photoThumbUrl || existing?.photoUrl || "",
    photoPath: photoAsset?.photoPath || existing?.photoPath || "",
    photoThumbPath: photoAsset?.photoThumbPath || existing?.photoThumbPath || "",
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

  if (photoAsset && existing) {
    await removeStoragePaths([
      existing.photoPath !== photoAsset.photoPath ? existing.photoPath : "",
      existing.photoThumbPath !== photoAsset.photoThumbPath ? existing.photoThumbPath : "",
    ]);
  }

  invalidatePublicBookingCache({ currentUsername: owner.usernameLower || owner.username });
  return { serviceId: ref.id };
}

export async function toggleBookingService(uid, serviceId, isActive, user = null) {
  const owner = await ensureBookingOwner(uid, user);
  const id = String(serviceId || "").trim();
  if (!id) throw new Error("Selecciona un servicio.");

  const ref = servicesCollection(uid).doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new Error("No encontramos ese servicio.");
  }

  await ref.set({
    isActive: Boolean(isActive),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  invalidatePublicBookingCache({ currentUsername: owner.usernameLower || owner.username });
  return { serviceId: id };
}

export async function saveBookingStaff(uid, rawInput, assets = {}, user = null) {
  const owner = await ensureBookingOwner(uid, user);
  const parsed = bookingStaffSchema.parse(rawInput);
  const ref = parsed.id ? staffCollection(uid).doc(parsed.id) : staffCollection(uid).doc(buildBookingId("staff"));
  const existingSnap = await ref.get();
  const existing = existingSnap.exists ? normalizeStaffDoc(existingSnap) : null;
  if (!existing) {
    const maxStaff = getPlanLimit(owner.plan || owner.status, "bookingStaff");
    const existingCount = (await staffCollection(uid).count().get()).data().count || 0;
    if (existingCount >= maxStaff) {
      throw new Error(`Tu plan permite hasta ${maxStaff} profesionales.`);
    }
  }
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
    await removeStoragePaths([
      existing.photoPath !== photoAsset.photoPath ? existing.photoPath : "",
      existing.photoThumbPath !== photoAsset.photoThumbPath ? existing.photoThumbPath : "",
    ]);
  }

  invalidatePublicBookingCache({ currentUsername: owner.usernameLower || owner.username });
  return { staffId: ref.id };
}

export async function toggleBookingStaff(uid, staffId, isActive, user = null) {
  const owner = await ensureBookingOwner(uid, user);
  const id = String(staffId || "").trim();
  if (!id) throw new Error("Selecciona un profesional.");

  const ref = staffCollection(uid).doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new Error("No encontramos ese profesional.");
  }

  await ref.set({
    isActive: Boolean(isActive),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  invalidatePublicBookingCache({ currentUsername: owner.usernameLower || owner.username });
  return { staffId: id };
}

export async function deleteBookingStaff(uid, staffId, user = null) {
  const owner = await ensureBookingOwner(uid, user);
  const id = String(staffId || "").trim();
  if (!id) {
    throw new Error("Selecciona un profesional.");
  }

  const staffRef = staffCollection(uid).doc(id);
  const staffSnap = await staffRef.get();
  if (!staffSnap.exists) {
    throw new Error("No encontramos ese profesional.");
  }
  const current = normalizeStaffDoc(staffSnap);
  const activeAppointmentsSnap = await appointmentsCollection(uid)
    .where("staffId", "==", id)
    .where("status", "in", BOOKING_ACTIVE_STATUS_VALUES)
    .limit(1)
    .get();

  if (!activeAppointmentsSnap.empty) {
    throw new Error("Este profesional tiene citas o solicitudes activas. Reprográmalas o cancélalas antes de eliminarlo.");
  }

  const servicesSnap = await servicesCollection(uid).get();
  await Promise.all(servicesSnap.docs.map((doc) => {
    const service = normalizeServiceDoc(doc);
    if (!service.staffIds.includes(id)) return Promise.resolve();
    return doc.ref.set({
      staffIds: service.staffIds.filter((item) => item !== id),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  }));

  await staffRef.delete();
  await removeStoragePaths([current.photoPath, current.photoThumbPath]);
  invalidatePublicBookingCache({ currentUsername: owner.usernameLower || owner.username });
  return { staffId: id };
}

export async function getBookingStaffActiveAppointments(uid, staffId, user = null) {
  const owner = await ensureBookingOwner(uid, user);
  const config = resolveBookingConfig(owner);
  const id = String(staffId || "").trim();
  if (!id) {
    throw new Error("Selecciona un profesional.");
  }

  const snap = await appointmentsCollection(uid)
    .where("staffId", "==", id)
    .where("status", "in", BOOKING_ACTIVE_STATUS_VALUES)
    .get();

  return snap.docs
    .map(normalizeAppointmentDoc)
    .sort((left, right) => (
      `${left.appointmentDate} ${left.startTime}`.localeCompare(`${right.appointmentDate} ${right.startTime}`)
    ))
    .map((appointment) => buildAppointmentSummary(appointment, config));
}

export async function getBookingAvailability(uid, rawInput = {}, user = null) {
  const owner = await ensureBookingOwner(uid, user);
  const config = resolveBookingConfig(owner);
  const { service, staff: selectedStaff } = await resolveServiceAndStaff(uid, rawInput);

  if (!config.enabled || !canUseModule(owner, "booking")) {
    return { availableDates: [], slots: [], date: "", selectedStaffId: selectedStaff?.id || rawInput.staffId || "any" };
  }
  if (!service || service.isActive === false) {
    throw new Error("Selecciona un servicio disponible.");
  }

  const selectedStaffId = selectedStaff?.id || rawInput.staffId || "";
  const availableStaff = await getAvailableStaffForService(uid, service.id, selectedStaffId, selectedStaff);

  if (rawInput.date) {
    const date = assertFutureBookingDate(rawInput.date, config);
    const appointments = (await getAppointmentsByDate(uid, rawInput.date, availableStaff.map((member) => member.id)))
      .filter((appointment) => appointment.id !== rawInput.excludeAppointmentId);
    const appointmentsByStaff = groupAppointmentsByStaff(appointments);
    const slots = buildDaySlotOptions({
      date,
      durationMinutes: service.durationMinutes,
      config,
      service,
      selectedStaffId,
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

  const startDate = parseBookingDateString(getBogotaDateString());
  const availableDates = [];
  const availableDatesLimit = Math.min(
    Math.max(Number(rawInput.availableDatesLimit || BOOKING_DEFAULT_AVAILABLE_DATES_LIMIT), 1),
    BOOKING_MAX_DAYS_AHEAD_LIMIT,
  );
  let firstAvailableDate = "";
  let firstAvailableSlots = [];
  const scanDays = Math.min(
    config.maxDaysAhead,
    Math.max(Number(rawInput.scanDays || config.maxDaysAhead), 1),
    BOOKING_MAX_DAYS_AHEAD_LIMIT,
  );
  const endDate = addDays(startDate, scanDays);
  const appointmentsInRange = (await getAppointmentsByDateRange(
    uid,
    format(startDate, "yyyy-MM-dd"),
    format(endDate, "yyyy-MM-dd"),
    availableStaff.map((member) => member.id),
  )).filter((appointment) => appointment.id !== rawInput.excludeAppointmentId);
  const appointmentsByDate = appointmentsInRange.reduce((map, appointment) => {
    const current = map.get(appointment.appointmentDate) || [];
    current.push(appointment);
    map.set(appointment.appointmentDate, current);
    return map;
  }, new Map());

  for (let offset = 0; offset <= scanDays; offset += 1) {
    const date = addDays(startDate, offset);
    const dateString = format(date, "yyyy-MM-dd");
    const appointments = appointmentsByDate.get(dateString) || [];
    const appointmentsByStaff = groupAppointmentsByStaff(appointments);
    const slots = buildDaySlotOptions({
      date,
      durationMinutes: service.durationMinutes,
      config,
      service,
      selectedStaffId,
      staffMembers: availableStaff,
      appointmentsByStaff,
    });

    if (slots.length) {
      if (!firstAvailableDate) {
        firstAvailableDate = dateString;
        firstAvailableSlots = slots;
      }
      availableDates.push({
        date: dateString,
        label: formatBookingDateLabel(date),
      });
      if (availableDates.length >= availableDatesLimit) break;
    }
  }

  return {
    date: firstAvailableDate,
    availableDates,
    slots: firstAvailableSlots,
    selectedStaffId: selectedStaff?.id || rawInput.staffId || "any",
  };
}

async function chooseAvailableStaffForSlot(uid, {
  dateString,
  service,
  config,
  selectedStaffId = "",
  startTime,
  excludeAppointmentId = "",
}) {
  const availableStaff = await getAvailableStaffForService(uid, service.id, selectedStaffId);
  const appointments = (await getAppointmentsByDate(uid, dateString, availableStaff.map((member) => member.id)))
    .filter((appointment) => appointment.id !== excludeAppointmentId);
  const appointmentsByStaff = groupAppointmentsByStaff(appointments);
  const slots = buildDaySlotOptions({
    date: parseBookingDateString(dateString),
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
  if (!config.enabled || !canUseModule(owner, "booking")) {
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
  const customerAuth = options.customerAuth || {};
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
      customerUid: customerAuth.uid || "",
      customerEmail: String(customerAuth.email || "").trim().toLowerCase(),
      customerEmailVerified: Boolean(customerAuth.emailVerified || false),
      customerPhotoURL: customerAuth.photoURL || "",
      customerAuthProvider: customerAuth.provider || "",
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
  const summary = {
    service: service.name,
    professional: assignedStaffName || appointment.staffNameSnapshot,
    dateLabel: formatBookingDateLabel(date),
    timeLabel: formatTimeLabel(resolvedSlot.slot.startTime),
    durationLabel: `${service.durationMinutes} min`,
    priceLabel: service.price !== null && service.price !== undefined
      ? `$${Number(service.price || 0).toLocaleString("es-CO")}`
      : "Sin precio",
  };

  await upsertBookingCustomer(uid, appointment, customerAuth);

  if (options.channel === "public") {
    const emailDelivery = {};
    emailDelivery.businessNotification = await notifyBusinessAboutNewBooking({
      owner,
      config,
      appointment,
      summary,
      mode: status,
    });

    if (status === "confirmed") {
      emailDelivery.customerConfirmation = await notifyCustomerConfirmed({ owner, config, appointment, summary });
    }

    await ref.set({
      emailDelivery,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  return {
    appointment,
    summary,
  };
}

export async function updateBookingAppointmentStatus(uid, rawInput, user = null) {
  const owner = await ensureBookingOwner(uid, user);
  const config = resolveBookingConfig(owner);
  const parsed = bookingAppointmentStatusSchema.parse(rawInput);
  const ref = appointmentsCollection(uid).doc(parsed.id);
  const currentSnap = await ref.get();
  const currentAppointment = currentSnap.exists ? normalizeAppointmentDoc(currentSnap) : null;
  if (!currentAppointment) {
    throw new Error("No encontramos esa cita.");
  }

  await ref.set({
    status: parsed.status,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  const savedSnap = await ref.get();
  if (savedSnap.exists) {
    const appointment = buildAppointmentSummary(normalizeAppointmentDoc(savedSnap), config);
    const summary = buildMailSummaryFromAppointment(appointment);

    if (parsed.status === "confirmed" && currentAppointment?.status !== "confirmed") {
      const delivery = await notifyCustomerConfirmed({ owner, config, appointment, summary });
      await ref.set({
        "emailDelivery.customerConfirmation": delivery,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    } else if (parsed.status === "cancelled_by_business" || parsed.status === "cancelled_by_customer") {
      const delivery = await notifyCustomerUpdated({ owner, config, appointment, summary, updateType: "cancelled" });
      await ref.set({
        "emailDelivery.customerUpdate": delivery,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
  }

  return { appointmentId: parsed.id };
}

export async function updateBookingAppointmentSchedule(uid, rawInput, user = null) {
  const owner = await ensureBookingOwner(uid, user);
  const config = resolveBookingConfig(owner);
  if (!config.enabled) {
    throw new Error("El agendamiento no está activo en este negocio.");
  }

  const parsed = bookingAppointmentScheduleSchema.parse(rawInput);
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
    excludeAppointmentId: parsed.id,
  });
  const ref = appointmentsCollection(uid).doc(parsed.id);
  const startMinutes = timeToMinutes(resolvedSlot.slot.startTime);
  const endMinutes = timeToMinutes(resolvedSlot.slot.endTime);
  let assignedStaffName = "";

  await getAdminDb().runTransaction(async (transaction) => {
    const currentSnap = await transaction.get(ref);
    if (!currentSnap.exists) {
      throw new Error("No encontramos esa cita.");
    }

    const dayAppointmentsSnap = await transaction.get(
      appointmentsCollection(uid).where("appointmentDate", "==", parsed.appointmentDate),
    );
    const dayAppointments = dayAppointmentsSnap.docs
      .map(normalizeAppointmentDoc)
      .filter((appointment) => appointment.id !== parsed.id);
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
      serviceNameSnapshot: service.name,
      servicePriceSnapshot: service.price,
      serviceDurationSnapshot: service.durationMinutes,
      staffNameSnapshot: assignedStaff.name,
      rescheduledAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  });

  const savedSnap = await ref.get();
  const appointment = buildAppointmentSummary(normalizeAppointmentDoc(savedSnap), config);
  const summary = {
    service: service.name,
    professional: assignedStaffName || appointment.staffNameSnapshot,
    dateLabel: formatBookingDateLabel(date),
    timeLabel: formatTimeLabel(resolvedSlot.slot.startTime),
    durationLabel: `${service.durationMinutes} min`,
    priceLabel: service.price !== null && service.price !== undefined
      ? `$${Number(service.price || 0).toLocaleString("es-CO")}`
      : "Sin precio",
  };

  const delivery = await notifyCustomerUpdated({ owner, config, appointment, summary, updateType: "rescheduled" });
  await ref.set({
    "emailDelivery.customerUpdate": delivery,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  return {
    appointment,
    summary,
  };
}

export async function getPublicBookingBootstrap(owner) {
  const config = resolveBookingConfig(owner);
  if (!config.enabled || !canUseModule(owner, "booking")) return null;

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
  if (appointment.status === "confirmed") {
    return `Hola, tengo una cita confirmada para ${appointment.serviceNameSnapshot} el ${appointment.dateLabel} a las ${appointment.timeLabel}. Mi nombre es ${appointment.customerName}.`;
  }

  return `Hola, envié una solicitud de cita para ${appointment.serviceNameSnapshot} el ${appointment.dateLabel} a las ${appointment.timeLabel}. Mi nombre es ${appointment.customerName}.`;
}
