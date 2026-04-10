import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
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

const DEFAULT_FIRST_WINDOW = {
  startTime: "09:00",
  endTime: "18:00",
};

const DEFAULT_SECOND_WINDOW = {
  secondStartTime: "14:00",
  secondEndTime: "18:00",
};

export const BOOKING_DEFAULT_BUSINESS_SCHEDULE = [
  { dayOfWeek: 1, isOpen: true, shiftMode: "continuous", startTime: "09:00", endTime: "18:00", secondStartTime: "14:00", secondEndTime: "18:00" },
  { dayOfWeek: 2, isOpen: true, shiftMode: "continuous", startTime: "09:00", endTime: "18:00", secondStartTime: "14:00", secondEndTime: "18:00" },
  { dayOfWeek: 3, isOpen: true, shiftMode: "continuous", startTime: "09:00", endTime: "18:00", secondStartTime: "14:00", secondEndTime: "18:00" },
  { dayOfWeek: 4, isOpen: true, shiftMode: "continuous", startTime: "09:00", endTime: "18:00", secondStartTime: "14:00", secondEndTime: "18:00" },
  { dayOfWeek: 5, isOpen: true, shiftMode: "continuous", startTime: "09:00", endTime: "18:00", secondStartTime: "14:00", secondEndTime: "18:00" },
  { dayOfWeek: 6, isOpen: true, shiftMode: "continuous", startTime: "09:00", endTime: "16:00", secondStartTime: "14:00", secondEndTime: "18:00" },
  { dayOfWeek: 0, isOpen: false, shiftMode: "continuous", startTime: "09:00", endTime: "14:00", secondStartTime: "14:00", secondEndTime: "18:00" },
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
  const shiftMode = value?.shiftMode === "split" ? "split" : "continuous";

  return {
    dayOfWeek: ((dayOfWeek % 7) + 7) % 7,
    isOpen: value?.isOpen !== false && value?.isWorking !== false,
    isWorking: value?.isWorking !== false && value?.isOpen !== false,
    shiftMode,
    startTime: normalizeTimeInput(value?.startTime || DEFAULT_FIRST_WINDOW.startTime),
    endTime: normalizeTimeInput(value?.endTime || DEFAULT_FIRST_WINDOW.endTime),
    secondStartTime: normalizeTimeInput(value?.secondStartTime || DEFAULT_SECOND_WINDOW.secondStartTime),
    secondEndTime: normalizeTimeInput(value?.secondEndTime || DEFAULT_SECOND_WINDOW.secondEndTime),
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

export function getDayScheduleWindows(entry = {}) {
  const normalized = normalizeDayScheduleEntry(entry, entry?.dayOfWeek || 0);
  if (!normalized.isOpen || !normalized.isWorking) return [];

  const windows = [];
  const firstStart = timeToMinutes(normalized.startTime);
  const firstEnd = timeToMinutes(normalized.endTime);
  if (firstEnd > firstStart) {
    windows.push({
      startTime: normalized.startTime,
      endTime: normalized.endTime,
      startMinutes: firstStart,
      endMinutes: firstEnd,
    });
  }

  if (normalized.shiftMode === "split") {
    const secondStart = timeToMinutes(normalized.secondStartTime);
    const secondEnd = timeToMinutes(normalized.secondEndTime);
    if (secondEnd > secondStart) {
      windows.push({
        startTime: normalized.secondStartTime,
        endTime: normalized.secondEndTime,
        startMinutes: secondStart,
        endMinutes: secondEnd,
      });
    }
  }

  return windows;
}

export function formatScheduleWindowsLabel(entry = {}) {
  const windows = getDayScheduleWindows(entry);
  if (!windows.length) return "Descanso";
  return windows.map((window) => `${window.startTime} - ${window.endTime}`).join(" / ");
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

export function formatBookingMonthLabel(date) {
  if (!date) return "";
  return format(date, "MMMM yyyy", { locale: es });
}

export function formatBookingDateTimeLabel(date, time = "00:00") {
  if (!date) return "";
  return `${format(date, "EEEE d 'de' MMMM", { locale: es })} · ${formatTimeLabel(time)}`;
}

export function buildBookingCalendarDays(startDate = new Date(), amount = 30) {
  return Array.from({ length: amount }, (_, index) => addDays(startDate, index));
}

export function buildBookingCalendarMonth(viewDate = new Date(), options = {}) {
  const baseMonth = startOfMonth(viewDate);
  const minDate = startOfDay(options.minDate || new Date());
  const maxDate = startOfDay(options.maxDate || addDays(minDate, 30));
  const gridStart = startOfWeek(baseMonth, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(baseMonth), { weekStartsOn: 1 });

  return eachDayOfInterval({ start: gridStart, end: gridEnd }).map((date) => ({
    key: format(date, "yyyy-MM-dd"),
    date,
    dateString: format(date, "yyyy-MM-dd"),
    inMonth: isSameMonth(date, baseMonth),
    isBeforeRange: isBefore(date, minDate),
    isAfterRange: isAfter(date, maxDate),
  }));
}

export function getBookingCalendarBounds(maxDaysAhead = 30, baseDate = new Date()) {
  const minDate = startOfDay(baseDate);
  const maxDate = endOfDay(addDays(minDate, Math.min(Number(maxDaysAhead || 30), BOOKING_MAX_DAYS_AHEAD_LIMIT)));
  return {
    minDate,
    maxDate,
    firstMonth: startOfMonth(minDate),
    lastMonth: startOfMonth(maxDate),
  };
}

export function canMoveBookingMonth(currentMonth, direction, bounds) {
  const nextMonth = direction > 0 ? addMonths(currentMonth, 1) : subMonths(currentMonth, 1);
  if (direction > 0) {
    return !isAfter(startOfMonth(nextMonth), bounds.lastMonth);
  }
  return !isBefore(startOfMonth(nextMonth), bounds.firstMonth);
}

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.round(parsed), min), max);
}
