import { addDays, format, isAfter } from "date-fns";
import { es } from "date-fns/locale";
import { clsx } from "clsx";
import { GRACE_DAYS, HARD_SUSPENSION_DAYS, TRIAL_DAYS, USERNAME_CHANGE_COOLDOWN_DAYS } from "@/lib/constants";

export function cn(...inputs) {
  return clsx(inputs);
}

export function sanitizeSlug(value = "") {
  return value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

export function sanitizePhone(value = "") {
  return value.replace(/\D/g, "");
}

export function normalizeUrl(value = "") {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

export function formatDate(date) {
  if (!date) return "Sin fecha";
  return format(date, "d 'de' MMM yyyy", { locale: es });
}

export function getTrialEnd(startDate = new Date()) {
  return addDays(startDate, TRIAL_DAYS);
}

export function getGraceEnd(date = new Date()) {
  return addDays(date, GRACE_DAYS);
}

export function getCancellationDate(date = new Date()) {
  return addDays(date, HARD_SUSPENSION_DAYS);
}

export function getUsernameChangeDate(date = new Date()) {
  return addDays(date, USERNAME_CHANGE_COOLDOWN_DAYS);
}

export function isExpired(date) {
  return date ? isAfter(new Date(), date) : false;
}

export function buildWhatsappLink(phone, message = "Hola, quiero informacion") {
  const digits = sanitizePhone(phone);
  if (!digits) return "";
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();
  return new Date(value);
}
