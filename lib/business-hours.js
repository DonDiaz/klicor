export const BUSINESS_HOURS_TIMEZONE = "America/Bogota";

export const BUSINESS_HOUR_DAY_OPTIONS = [
  { key: "monday", label: "Lunes", shortLabel: "Lun" },
  { key: "tuesday", label: "Martes", shortLabel: "Mar" },
  { key: "wednesday", label: "Miércoles", shortLabel: "Mié" },
  { key: "thursday", label: "Jueves", shortLabel: "Jue" },
  { key: "friday", label: "Viernes", shortLabel: "Vie" },
  { key: "saturday", label: "Sábado", shortLabel: "Sáb" },
  { key: "sunday", label: "Domingo", shortLabel: "Dom" },
];

export const BUSINESS_HOUR_DAY_KEYS = BUSINESS_HOUR_DAY_OPTIONS.map((day) => day.key);

const DEFAULT_OPEN_DAYS = new Set(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]);
const WEEKDAY_KEY_BY_ENGLISH_LABEL = {
  monday: "monday",
  tuesday: "tuesday",
  wednesday: "wednesday",
  thursday: "thursday",
  friday: "friday",
  saturday: "saturday",
  sunday: "sunday",
};

function clampHour(value) {
  return Math.min(23, Math.max(0, Number(value || 0)));
}

function clampMinute(value) {
  return Math.min(59, Math.max(0, Number(value || 0)));
}

export function timeToMinutes(value = "") {
  const match = String(value || "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  return (clampHour(match[1]) * 60) + clampMinute(match[2]);
}

function formatTimeValue(value = "") {
  const minutes = timeToMinutes(value);
  if (minutes === null) return "";
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function formatDisplayTime(value = "") {
  const minutes = timeToMinutes(value);
  if (minutes === null) return "";
  const hour24 = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const suffix = hour24 >= 12 ? "p. m." : "a. m.";
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export function createDefaultBusinessHourDay(dayKey) {
  const isOpen = DEFAULT_OPEN_DAYS.has(dayKey);
  return {
    day: dayKey,
    isOpen,
    mode: dayKey === "saturday" ? "continuous" : "split",
    shifts: dayKey === "saturday"
      ? [{ start: "08:00", end: "13:00" }]
      : [
        { start: "08:00", end: "12:00" },
        { start: "14:00", end: "18:00" },
      ],
  };
}

function normalizeShift(shift = {}, fallback = {}) {
  const start = formatTimeValue(shift.start || fallback.start || "08:00");
  const end = formatTimeValue(shift.end || fallback.end || "18:00");
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);

  if (startMinutes === null || endMinutes === null || startMinutes >= endMinutes) {
    return null;
  }

  return { start, end };
}

function normalizeDay(dayKey, input = {}) {
  const fallback = createDefaultBusinessHourDay(dayKey);
  const mode = ["continuous", "split"].includes(input.mode) ? input.mode : fallback.mode;
  const fallbackShifts = mode === "continuous"
    ? [fallback.shifts[0] || { start: "08:00", end: "18:00" }]
    : [
      fallback.shifts[0] || { start: "08:00", end: "12:00" },
      fallback.shifts[1] || { start: "14:00", end: "18:00" },
    ];
  const rawShifts = Array.isArray(input.shifts) && input.shifts.length ? input.shifts : fallbackShifts;
  const shifts = rawShifts
    .slice(0, mode === "continuous" ? 1 : 2)
    .map((shift, index) => normalizeShift(shift, fallbackShifts[index] || fallbackShifts[0]))
    .filter(Boolean);

  return {
    day: dayKey,
    isOpen: Boolean(input.isOpen ?? fallback.isOpen),
    mode,
    shifts: shifts.length ? shifts : fallbackShifts,
  };
}

export function normalizeBusinessHours(input = {}) {
  const rawDays = Array.isArray(input?.days) ? input.days : [];
  const daysByKey = new Map(rawDays.map((day) => [String(day?.day || ""), day]));

  return {
    enabled: Boolean(input?.enabled),
    timezone: BUSINESS_HOURS_TIMEZONE,
    allowOrdersWhenClosed: false,
    days: BUSINESS_HOUR_DAY_KEYS.map((dayKey) => normalizeDay(dayKey, daysByKey.get(dayKey) || {})),
  };
}

function getNowInTimezone(date, timeZone = BUSINESS_HOURS_TIMEZONE) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const weekday = WEEKDAY_KEY_BY_ENGLISH_LABEL[String(values.weekday || "").toLowerCase()] || "monday";

  return {
    day: weekday,
    minutes: (Number(values.hour || 0) * 60) + Number(values.minute || 0),
  };
}

function getDayIndex(dayKey = "") {
  return BUSINESS_HOUR_DAY_KEYS.indexOf(dayKey);
}

function resolveNextOpening(schedule, currentDayKey, currentMinutes) {
  const currentDayIndex = getDayIndex(currentDayKey);
  if (currentDayIndex < 0) return "";

  for (let offset = 0; offset < 7; offset += 1) {
    const dayIndex = (currentDayIndex + offset) % BUSINESS_HOUR_DAY_KEYS.length;
    const dayKey = BUSINESS_HOUR_DAY_KEYS[dayIndex];
    const day = schedule.days.find((item) => item.day === dayKey);
    if (!day?.isOpen || !day.shifts.length) continue;

    const nextShift = day.shifts.find((shift) => offset > 0 || (timeToMinutes(shift.start) ?? 0) > currentMinutes);
    if (!nextShift) continue;

    const timeLabel = formatDisplayTime(nextShift.start);
    if (offset === 0) return `Abre hoy a las ${timeLabel}`;
    if (offset === 1) return `Abre mañana a las ${timeLabel}`;

    const dayLabel = BUSINESS_HOUR_DAY_OPTIONS.find((item) => item.key === dayKey)?.label?.toLowerCase() || "otro día";
    return `Abre el ${dayLabel} a las ${timeLabel}`;
  }

  return "Horario no disponible";
}

export function getBusinessOpenStatus(input = {}, date = new Date()) {
  const schedule = normalizeBusinessHours(input);

  if (!schedule.enabled) {
    return {
      configured: false,
      isOpen: true,
      label: "Pedidos disponibles",
      detail: "Este negocio aún no configuró horarios de atención.",
      nextOpeningLabel: "",
    };
  }

  const now = getNowInTimezone(date, schedule.timezone);
  const currentDay = schedule.days.find((day) => day.day === now.day);
  const currentShift = currentDay?.isOpen
    ? currentDay.shifts.find((shift) => {
      const start = timeToMinutes(shift.start);
      const end = timeToMinutes(shift.end);
      return start !== null && end !== null && now.minutes >= start && now.minutes < end;
    })
    : null;

  if (currentShift) {
    return {
      configured: true,
      isOpen: true,
      label: "Abierto ahora",
      detail: `Atiende hasta las ${formatDisplayTime(currentShift.end)}.`,
      nextOpeningLabel: "",
    };
  }

  return {
    configured: true,
    isOpen: false,
    label: "Cerrado ahora",
    detail: "Puedes mirar los productos, pero los pedidos se habilitan cuando el negocio abra.",
    nextOpeningLabel: resolveNextOpening(schedule, now.day, now.minutes),
  };
}
