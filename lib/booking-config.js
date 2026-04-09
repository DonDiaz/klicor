import { addDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { sanitizePhone } from "@/lib/utils";

export const BOOKING_ROUTE_SEGMENT = "agenda";
export const BOOKING_SLOT_INTERVAL_MINUTES = 15;
export const BOOKING_MAX_DAYS_AHEAD_LIMIT = 120;
export const BOOKING_NOTICE_MINUTES_LIMIT = 24 * 60;
export const BOOKING_STATUS_VALUES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled_by_customer",
  "cancelled_by_business",
  "no_show",
];

export const BOOKING_ACTIVE_STATUS_VALUES = [
  "pending",
  "confirmed",
];

export const BOOKING_DAY_OPTIONS = [
  { value: 1, label: "Lunes", shortLabel: "Lun" },
  { value: 2, label: "Martes", shortLabel: "Mar" },
  { value: 3, label: "Miércoles", shortLabel: "Mié" },
  { value: 4, label: "Jueves", shortLabel: "Jue" },
  { value: 5, label: "Viernes", shortLabel: "Vie" },
  { value: 6, label: "Sábado", shortLabel: "Sáb" },
  { value: 0, label: "Domingo", shortLabel: "Dom" },
];

export const BOOKING_DEFAULT_BUSINESS_SCHEDULE = [
  { dayOfWeek: 1, isOpen: true, startTime: "09:00", endTime: "18:00" },
  { dayOfWeek: 2, isOpen: true, startTime: "09:00", endTime: "18:00" },
  { dayOfWeek: 3, isOpen: true, startTime: "09:00", endTime: "18:00" },
  { dayOfWeek: 4, isOpen: true, startTime: "09:00", endTime: "18:00" },
  { dayOfWeek: 5, isOpen: true, startTime: "09:00", endTime: "18:00" },
  { dayOfWeek: 6, isOpen: true, startTime: "09:00", endTime: "16:00" },
  { dayOfWeek: 0, isOpen: false, startTime: "09:00", endTime: "14:00" },
];

export function buildBookingPublicUrl(username = "") {
  const slug = String(username || "").trim().toLowerCase();
  if (!slug) return "";
  return `/${slug}/${BOOKING_ROUTE_SEGMENT}`;
}

export function normalizeDayScheduleEntry(value = {}, fallbackDay = 0) {
  const dayOfWeek = Number.isInteger(Number(value?.dayOfWeek))
    ? Number(value.dayOfWeek)
    : fallbackDay;
  return {
    dayOfWeek: ((dayOfWeek % 7) + 7) % 7,
    isOpen: value?.isOpen !== false && value?.isWorking !== false,
    isWorking: value?.isWorking !== false && value?.isOpen !== false,
    startTime: normalizeTimeInput(value?.startTime || "09:00"),
    endTime: normalizeTimeInput(value?.endTime || "18:00"),
  };
}

export function normalizeWeeklySchedule(value = [], fallback = BOOKING_DEFAULT_BUSINESS_SCHEDULE) {
  const source = Array.isArray(value) && value.length ? value : fallback;
  const map = new Map();

  source.forEach((item, index) => {
    const normalized = normalizeDayScheduleEntry(item, fallback[index]?.dayOfWeek ?? index);
    map.set(normalized.dayOfWeek, normalized);
  });

  return BOOKING_DAY_OPTIONS.map((day) => normalizeDayScheduleEntry(map.get(day.value), day.value));
}

export function normalizeBookingConfig(raw = {}) {
  const source = raw?.bookingConfig && typeof raw.bookingConfig === "object"
    ? raw.bookingConfig
    : raw;

  return {
    enabled: Boolean(source.bookingEnabled ?? source.enabled ?? false),
    allowStaffSelection: source.allowStaffSelection !== false,
    autoConfirmBooking: Boolean(source.autoConfirmBooking ?? false),
    whatsappNumber: sanitizePhone(source.whatsappNumber || source.bookingWhatsappNumber || ""),
    noticeMinutes: clampNumber(source.noticeMinutes ?? source.bookingNoticeMinutes, 0, BOOKING_NOTICE_MINUTES_LIMIT, 60),
    maxDaysAhead: clampNumber(source.maxDaysAhead ?? source.bookingMaxDaysAhead, 1, BOOKING_MAX_DAYS_AHEAD_LIMIT, 30),
    businessSchedule: normalizeWeeklySchedule(source.businessSchedule, BOOKING_DEFAULT_BUSINESS_SCHEDULE),
  };
}

export function normalizeTimeInput(value = "09:00") {
  const match = String(value || "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return "09:00";
  const hours = Math.min(Math.max(Number(match[1]), 0), 23);
  const minutes = Math.min(Math.max(Number(match[2]), 0), 59);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function timeToMinutes(value = "00:00") {
  const [hours, minutes] = normalizeTimeInput(value).split(":").map(Number);
  return (hours * 60) + minutes;
}

export function minutesToTime(value = 0) {
  const normalized = Math.max(Math.round(Number(value || 0)), 0);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function formatTimeLabel(value = "00:00") {
  const minutes = typeof value === "number" ? value : timeToMinutes(value);
  const period = minutes >= 720 ? "PM" : "AM";
  const normalizedHours = Math.floor(minutes / 60) % 24;
  const displayHours = normalizedHours % 12 || 12;
  const displayMinutes = minutes % 60;
  return `${displayHours}:${String(displayMinutes).padStart(2, "0")} ${period}`;
}

export function formatBookingDateLabel(date) {
  if (!date) return "";
  return format(date, "d 'de' MMMM", { locale: es });
}

export function formatBookingDateTimeLabel(date, time = "00:00") {
  if (!date) return "";
  return `${format(date, "EEEE d 'de' MMMM", { locale: es })} · ${formatTimeLabel(time)}`;
}

export function buildBookingCalendarDays(startDate = new Date(), amount = 30) {
  return Array.from({ length: amount }, (_, index) => addDays(startDate, index));
}

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.round(parsed), min), max);
}
