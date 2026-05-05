"use client";

import { useEffect, useMemo, useState } from "react";
import { addMonths, startOfMonth, subMonths } from "date-fns";
import { CheckCircle2, ChevronLeft, ChevronRight, CloudSun, LoaderCircle, MessageCircle, Moon, Sun } from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import {
  canMoveBookingMonth,
  formatBookingDateLabel,
  formatBookingMonthLabel,
  formatTimeLabel,
  getBookingCalendarBounds,
} from "@/lib/booking-config";
import { buildWhatsappLink } from "@/lib/utils";
import {
  BookingServiceCard,
  BookingStaffCard,
  BookingStepper,
  BookingTimeChip,
} from "@/components/booking-ui";

const PUBLIC_STEPS = [
  { id: "service", label: "Servicio" },
  { id: "staff", label: "Profesional" },
  { id: "schedule", label: "Fecha y hora" },
  { id: "data", label: "Tus datos" },
];

const PUBLIC_STEP_TITLES = [
  "Elige un servicio",
  "Elige profesional",
  "Selecciona fecha y hora",
  "Tus datos",
];

const TIME_PERIODS = [
  { id: "morning", label: "Mañana", icon: Sun, start: 0, end: 12 * 60 },
  { id: "afternoon", label: "Tarde", icon: CloudSun, start: 12 * 60, end: 18 * 60 },
  { id: "night", label: "Noche", icon: Moon, start: 18 * 60, end: 24 * 60 },
];

const BOOKING_RESULT_COPY = {
  confirmed: {
    summaryTitle: "Resumen de la cita",
    submitLabel: "Confirmar cita",
    submittingLabel: "Confirmando cita...",
    successTitle: "Cita confirmada",
    successMessage: "Tu cita quedó agendada. Si necesitas ajustar algo, puedes seguir la conversación por WhatsApp.",
    whatsappLabel: "Hablar por WhatsApp",
  },
  pending: {
    summaryTitle: "Resumen de la solicitud",
    submitLabel: "Enviar solicitud",
    submittingLabel: "Enviando solicitud...",
    successTitle: "Solicitud enviada",
    successMessage: "El negocio revisará tu solicitud y te confirmará pronto por WhatsApp.",
    whatsappLabel: "Escribir por WhatsApp",
  },
};

const PUBLIC_THEME_VERTICALS = {
  barber: {
    id: "barber",
    kicker: "Barberia",
    primary: "#d7a642",
    primarySoft: "rgba(215, 166, 66, 0.18)",
    page: "#050607",
    surface: "#0d0f11",
    surfaceSoft: "#111417",
    card: "rgba(255, 255, 255, 0.045)",
    chip: "rgba(255, 255, 255, 0.065)",
    input: "rgba(255, 255, 255, 0.055)",
    border: "rgba(215, 166, 66, 0.26)",
    text: "#f8fafc",
    muted: "#a7b0ba",
    buttonText: "#090909",
    glow: "rgba(215, 166, 66, 0.2)",
  },
  beauty: {
    id: "beauty",
    kicker: "Salon de belleza",
    primary: "#df5b98",
    primarySoft: "rgba(223, 91, 152, 0.16)",
    page: "#fff7fb",
    surface: "#ffffff",
    surfaceSoft: "#fff1f7",
    card: "rgba(255, 255, 255, 0.92)",
    chip: "#fff7fb",
    input: "#ffffff",
    border: "rgba(223, 91, 152, 0.2)",
    text: "#17131a",
    muted: "#706676",
    buttonText: "#ffffff",
    glow: "rgba(223, 91, 152, 0.2)",
  },
  clinic: {
    id: "clinic",
    kicker: "Agenda profesional",
    primary: "#0f63df",
    primarySoft: "rgba(15, 99, 223, 0.14)",
    page: "#f6f9ff",
    surface: "#ffffff",
    surfaceSoft: "#edf5ff",
    card: "rgba(255, 255, 255, 0.92)",
    chip: "#f8fbff",
    input: "#ffffff",
    border: "rgba(15, 99, 223, 0.18)",
    text: "#101827",
    muted: "#526174",
    buttonText: "#ffffff",
    glow: "rgba(15, 99, 223, 0.18)",
  },
};

const BEAUTY_TYPES = new Set(["beauty_salon", "nails", "spa", "aesthetics", "massage"]);
const CLINIC_TYPES = new Set(["dental", "medical_office", "psychology", "physical_therapy", "nutrition"]);

function resolvePublicTheme(business = {}, appearance = {}) {
  const type = String(business.businessType || appearance.businessType || "").toLowerCase();
  const category = String(business.businessCategory || appearance.businessCategory || "").toLowerCase();
  const name = String(business.businessName || "").toLowerCase();

  if (type === "barber_shop" || name.includes("barber") || name.includes("barberia") || name.includes("barbería")) {
    return PUBLIC_THEME_VERTICALS.barber;
  }
  if (BEAUTY_TYPES.has(type) || name.includes("salon") || name.includes("belleza") || name.includes("estil")) {
    return PUBLIC_THEME_VERTICALS.beauty;
  }
  if (CLINIC_TYPES.has(type) || category === "health_wellness" || name.includes("clinic") || name.includes("clinica") || name.includes("clínica") || name.includes("consultorio")) {
    return PUBLIC_THEME_VERTICALS.clinic;
  }
  return PUBLIC_THEME_VERTICALS.clinic;
}

function money(value, currency = "COP") {
  if (value === null || value === undefined || value === "") return "Sin precio";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function validateBookingDetails(selection) {
  if (!String(selection.customerName || "").trim() || String(selection.customerName || "").trim().length < 2) {
    return "Escribe tu nombre completo.";
  }

  const phoneDigits = String(selection.customerPhone || "").replace(/\D/g, "");
  if (phoneDigits.length < 7) {
    return "Ingresa un teléfono válido.";
  }

  return "";
}

function timeToMinutesValue(value = "") {
  const [hours = "0", minutes = "0"] = String(value || "").split(":");
  return (Number(hours) || 0) * 60 + (Number(minutes) || 0);
}

function groupSlotsByPeriod(slots = []) {
  return TIME_PERIODS.reduce((groups, period) => {
    groups[period.id] = slots.filter((slot) => {
      const minutes = timeToMinutesValue(slot.startTime);
      return minutes >= period.start && minutes < period.end;
    });
    return groups;
  }, {});
}

function getFirstAvailablePeriod(groups = {}) {
  return TIME_PERIODS.find((period) => groups[period.id]?.length)?.id || TIME_PERIODS[0].id;
}

export function BookingPublicView({ bootstrap }) {
  const business = bootstrap?.business || {};
  const appearance = bootstrap?.appearance || {};
  const config = bootstrap?.config || {};
  const services = Array.isArray(bootstrap?.services) ? bootstrap.services : [];
  const staff = Array.isArray(bootstrap?.staff) ? bootstrap.staff : [];
  const currency = bootstrap?.config?.currency || "COP";
  const [stepIndex, setStepIndex] = useState(0);
  const [selection, setSelection] = useState({
    serviceId: "",
    staffId: "any",
    appointmentDate: "",
    startTime: "",
    customerName: "",
    customerPhone: "",
    customerNote: "",
  });
  const [availabilityDates, setAvailabilityDates] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [activeTimePeriod, setActiveTimePeriod] = useState(TIME_PERIODS[0].id);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()));
  const bookingMode = config.autoConfirmBooking === true ? "confirmed" : "pending";
  const bookingCopy = BOOKING_RESULT_COPY[bookingMode];
  const publicTheme = useMemo(() => resolvePublicTheme(business, appearance), [appearance, business]);

  const selectedService = useMemo(
    () => services.find((item) => item.id === selection.serviceId) || null,
    [services, selection.serviceId],
  );
  const eligibleStaff = useMemo(
    () => staff.filter((item) => (selectedService ? item.serviceIds?.includes(selectedService.id) : false)),
    [selectedService, staff],
  );
  const selectedStaff = useMemo(
    () => staff.find((item) => item.id === selection.staffId) || null,
    [staff, selection.staffId],
  );
  const calendarBounds = useMemo(
    () => getBookingCalendarBounds(config.maxDaysAhead || 30),
    [config.maxDaysAhead],
  );
  const visibleAvailabilityDates = useMemo(() => availabilityDates.filter((item) => {
    const date = new Date(`${item.date}T00:00:00`);
    return date.getMonth() === calendarMonth.getMonth() && date.getFullYear() === calendarMonth.getFullYear();
  }), [availabilityDates, calendarMonth]);
  const slotsByPeriod = useMemo(() => groupSlotsByPeriod(slots), [slots]);

  const rootStyle = useMemo(() => ({
    "--booking-primary": publicTheme.primary,
    "--booking-primary-soft": publicTheme.primarySoft,
    "--booking-page": publicTheme.page,
    "--booking-surface": publicTheme.surface,
    "--booking-surface-soft": publicTheme.surfaceSoft,
    "--booking-card": publicTheme.card,
    "--booking-chip": publicTheme.chip,
    "--booking-input": publicTheme.input,
    "--booking-border": publicTheme.border,
    "--booking-text": publicTheme.text,
    "--booking-muted": publicTheme.muted,
    "--booking-button-text": publicTheme.buttonText,
    "--booking-glow": publicTheme.glow,
  }), [publicTheme]);

  useEffect(() => {
    if (!selection.appointmentDate) return;
    setCalendarMonth(startOfMonth(new Date(`${selection.appointmentDate}T00:00:00`)));
  }, [selection.appointmentDate]);

  useEffect(() => {
    if (selection.appointmentDate || !availabilityDates.length) return;
    setCalendarMonth(startOfMonth(new Date(`${availabilityDates[0].date}T00:00:00`)));
  }, [availabilityDates, selection.appointmentDate]);

  async function loadDates(nextServiceId, nextStaffId = "any") {
    setLoadingDates(true);
    setError("");
    try {
      const response = await apiFetch(`/api/public/booking/${business.usernameLower || business.username}?serviceId=${encodeURIComponent(nextServiceId)}&staffId=${encodeURIComponent(nextStaffId || "any")}`);
      const nextDates = Array.isArray(response.data?.availableDates) ? response.data.availableDates : [];
      setAvailabilityDates(nextDates);
      return nextDates;
    } catch (nextError) {
      setError(nextError.message);
      setAvailabilityDates([]);
      return [];
    } finally {
      setLoadingDates(false);
    }
  }

  async function loadSlots(nextDate, nextServiceId = selection.serviceId, nextStaffId = selection.staffId || "any") {
    if (!nextServiceId) return;
    setLoadingSlots(true);
    setError("");
    try {
      const response = await apiFetch(`/api/public/booking/${business.usernameLower || business.username}?serviceId=${encodeURIComponent(nextServiceId)}&staffId=${encodeURIComponent(nextStaffId || "any")}&date=${encodeURIComponent(nextDate)}`);
      const nextSlots = Array.isArray(response.data?.slots) ? response.data.slots : [];
      const nextGroups = groupSlotsByPeriod(nextSlots);
      setSlots(nextSlots);
      setActiveTimePeriod(getFirstAvailablePeriod(nextGroups));
      return nextSlots;
    } catch (nextError) {
      setError(nextError.message);
      setSlots([]);
      return [];
    } finally {
      setLoadingSlots(false);
    }
  }

  async function handleSelectService(serviceId) {
    const nextStaffId = "any";
    setSelection((current) => ({
      ...current,
      serviceId,
      staffId: nextStaffId,
      appointmentDate: "",
      startTime: "",
    }));
    setAvailabilityDates([]);
    setSlots([]);
    setError("");

    if (config.allowStaffSelection === false) {
      setStepIndex(2);
      loadDates(serviceId, nextStaffId).then(async (nextDates) => {
        if (!nextDates[0]?.date) return;
        setSelection((current) => ({
          ...current,
          appointmentDate: nextDates[0].date,
        }));
        await loadSlots(nextDates[0].date, serviceId, nextStaffId);
      });
      return;
    }

    setStepIndex(1);
  }

  async function handleSelectStaff(staffId) {
    const nextStaffId = staffId || "any";
    setSelection((current) => ({
      ...current,
      staffId: nextStaffId,
      appointmentDate: "",
      startTime: "",
    }));
    setSlots([]);
    setAvailabilityDates([]);
    setStepIndex(2);
    loadDates(selection.serviceId, nextStaffId).then(async (nextDates) => {
      if (!nextDates[0]?.date) return;
      setSelection((current) => ({
        ...current,
        appointmentDate: nextDates[0].date,
      }));
      await loadSlots(nextDates[0].date, selection.serviceId, nextStaffId);
    });
  }

  async function handleSelectDate(date) {
    setSelection((current) => ({
      ...current,
      appointmentDate: date,
      startTime: "",
    }));
    await loadSlots(date);
  }

  function handleSelectTime(startTime) {
    setSelection((current) => ({
      ...current,
      startTime,
    }));
    setStepIndex(3);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validateBookingDetails(selection);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await apiFetch(`/api/public/booking/${business.usernameLower || business.username}`, {
        method: "POST",
        body: selection,
      });
      setSuccess(response.result);
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setSubmitting(false);
    }
  }

  const summary = selectedService ? {
    service: selectedService.name,
    professional: selection.staffId && selection.staffId !== "any" ? selectedStaff?.name || "Profesional" : "Cualquiera disponible",
    date: selection.appointmentDate ? formatBookingDateLabel(new Date(`${selection.appointmentDate}T00:00:00`)) : "",
    time: selection.startTime ? formatTimeLabel(selection.startTime) : "",
    duration: `${selectedService.durationMinutes} min`,
    price: money(selectedService.price, currency),
  } : null;
  const resultMode = success?.appointment?.status === "confirmed" ? "confirmed" : bookingMode;
  const resultCopy = BOOKING_RESULT_COPY[resultMode];

  return (
    <main className={`booking-public-page is-${publicTheme.id}`} style={rootStyle}>
      <section className="booking-public-shell">
        <section className="booking-wizard-card">
          {!success ? (
            <>
              <BookingStepper steps={PUBLIC_STEPS} activeIndex={stepIndex} />
              <div className="booking-step-head">
                {business.businessName ? <span>{publicTheme.kicker} · {business.businessName}</span> : null}
                <h1>{PUBLIC_STEP_TITLES[stepIndex] || "Agenda"}</h1>
              </div>

              {error ? <div className="notice notice-danger"><span>{error}</span></div> : null}

              {stepIndex > 0 ? (
                <button className="booking-back-button" type="button" onClick={() => setStepIndex((current) => Math.max(current - 1, 0))}>
                  <ChevronLeft size={16} /> Volver
                </button>
              ) : null}

              {stepIndex === 0 ? (
                <div className="booking-choice-grid">
                  {services.map((service) => (
                    <BookingServiceCard
                      key={service.id}
                      service={service}
                      currency={currency}
                      selected={selection.serviceId === service.id}
                      onClick={() => handleSelectService(service.id)}
                    />
                  ))}
                </div>
              ) : null}

              {stepIndex === 1 ? (
                <div className="booking-choice-grid">
                  <BookingStaffCard
                    staff={{ name: "Cualquiera disponible", roleOrSpecialty: "Máxima disponibilidad" }}
                    highlight
                    selected={selection.staffId === "any"}
                    onClick={() => handleSelectStaff("any")}
                  />
                  {config.allowStaffSelection !== false ? eligibleStaff.map((member) => (
                    <BookingStaffCard
                      key={member.id}
                      staff={member}
                      selected={selection.staffId === member.id}
                      onClick={() => handleSelectStaff(member.id)}
                    />
                  )) : null}
                </div>
              ) : null}

              {stepIndex === 2 ? (
                <div className="booking-schedule-picker">
                  <div className="booking-calendar">
                    <div className="booking-calendar-header">
                      <button
                        className="booking-calendar-nav"
                        type="button"
                        onClick={() => setCalendarMonth((current) => subMonths(current, 1))}
                        disabled={!canMoveBookingMonth(calendarMonth, -1, calendarBounds)}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <strong>{formatBookingMonthLabel(calendarMonth)}</strong>
                      <button
                        className="booking-calendar-nav"
                        type="button"
                        onClick={() => setCalendarMonth((current) => addMonths(current, 1))}
                        disabled={!canMoveBookingMonth(calendarMonth, 1, calendarBounds)}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                    {loadingDates ? (
                      <div className="booking-loading-state">
                        <LoaderCircle size={18} className="spin" />
                        <span>Buscando fechas disponibles...</span>
                      </div>
                    ) : (
                      <div className="booking-public-date-strip">
                        {visibleAvailabilityDates.map((item) => {
                          const date = new Date(`${item.date}T00:00:00`);
                          const selected = selection.appointmentDate === item.date;

                          return (
                            <button
                              key={item.date}
                              className={`booking-calendar-day ${selected ? "is-selected" : ""}`.trim()}
                              type="button"
                              onClick={() => handleSelectDate(item.date)}
                            >
                              <span>{date.toLocaleDateString("es-CO", { weekday: "short" })}</span>
                              <strong>{date.getDate()}</strong>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <section className="booking-slot-panel">
                    <span className={`booking-hour-status ${selection.startTime ? "is-selected" : ""}`.trim()}>
                      {selection.startTime ? formatTimeLabel(selection.startTime) : "Sin hora seleccionada"}
                    </span>
                    <strong>{selectedService?.name}</strong>
                    <p>
                      {selectedService ? `${selectedService.durationMinutes} min · ${summary?.professional} · ${money(selectedService.price, currency)}` : ""}
                    </p>

                    <div className="booking-staff-strip">
                      <span>Colaborador seleccionado:</span>
                      <div className="booking-staff-strip-list is-readonly">
                        <BookingStaffCard
                          staff={selection.staffId === "any"
                            ? { name: "Cualquiera disponible", roleOrSpecialty: "Máxima disponibilidad" }
                            : selectedStaff || { name: "Profesional", roleOrSpecialty: "Seleccionado" }}
                          highlight={selection.staffId === "any"}
                          selected
                          onClick={() => {}}
                        />
                      </div>
                    </div>

                    <div className="booking-time-periods">
                      {TIME_PERIODS.map((period) => {
                        const Icon = period.icon;
                        return (
                          <button
                            key={period.id}
                            className={`booking-period-tab ${activeTimePeriod === period.id ? "is-active" : ""}`.trim()}
                            type="button"
                            onClick={() => setActiveTimePeriod(period.id)}
                            disabled={!slotsByPeriod[period.id]?.length}
                          >
                            <Icon size={16} /> {period.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="booking-time-grid">
                      {loadingSlots ? (
                        <div className="booking-loading-state">
                          <LoaderCircle size={18} className="spin" />
                          <span>Cargando horarios...</span>
                        </div>
                      ) : slotsByPeriod[activeTimePeriod]?.length ? slotsByPeriod[activeTimePeriod].map((slot) => (
                        <BookingTimeChip
                          key={slot.startTime}
                          label={slot.label}
                          selected={selection.startTime === slot.startTime}
                          onClick={() => handleSelectTime(slot.startTime)}
                        />
                      )) : (
                        <div className="booking-empty-state">
                          <strong>Sin horarios en este bloque</strong>
                          <p>Prueba con otro momento del día.</p>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              ) : null}

              {stepIndex === 3 ? (
                <form className="booking-data-form" onSubmit={handleSubmit}>
                  <div className="booking-summary-card">
                    <strong>{bookingCopy.summaryTitle}</strong>
                    <div>
                      <span>Servicio</span>
                      <b>{summary?.service}</b>
                    </div>
                    <div>
                      <span>Profesional</span>
                      <b>{summary?.professional}</b>
                    </div>
                    <div>
                      <span>Fecha</span>
                      <b>{summary?.date}</b>
                    </div>
                    <div>
                      <span>Hora</span>
                      <b>{summary?.time}</b>
                    </div>
                    <div>
                      <span>Duración</span>
                      <b>{summary?.duration}</b>
                    </div>
                    <div>
                      <span>Precio</span>
                      <b>{summary?.price}</b>
                    </div>
                  </div>

                  <input
                    className="input"
                    placeholder="Nombre completo"
                    value={selection.customerName}
                    onChange={(event) => setSelection((current) => ({ ...current, customerName: event.target.value }))}
                    required
                  />
                  <input
                    className="input"
                    placeholder="Teléfono"
                    value={selection.customerPhone}
                    onChange={(event) => setSelection((current) => ({ ...current, customerPhone: event.target.value }))}
                    required
                  />
                  <textarea
                    className="textarea"
                    rows={4}
                    placeholder="Nota opcional"
                    value={selection.customerNote}
                    onChange={(event) => setSelection((current) => ({ ...current, customerNote: event.target.value }))}
                  />
                  <button className="btn btn-primary booking-submit-button" type="submit" disabled={submitting}>
                    {submitting ? <LoaderCircle size={18} className="spin" /> : null}
                    {submitting ? bookingCopy.submittingLabel : bookingCopy.submitLabel}
                  </button>
                </form>
              ) : null}
            </>
          ) : (
            <div className="booking-success-card">
              <CheckCircle2 className="booking-success-icon" size={58} aria-hidden="true" />
              <strong>{resultCopy.successTitle}</strong>
              <p>{resultCopy.successMessage}</p>
              <div className="booking-summary-card is-success">
                <div>
                  <span>Servicio</span>
                  <b>{success.summary?.service}</b>
                </div>
                <div>
                  <span>Profesional</span>
                  <b>{success.summary?.professional}</b>
                </div>
                <div>
                  <span>Fecha</span>
                  <b>{success.summary?.dateLabel}</b>
                </div>
                <div>
                  <span>Hora</span>
                  <b>{success.summary?.timeLabel}</b>
                </div>
              </div>
              <a className="booking-whatsapp-cta" href={success.appointment?.whatsappUrl || buildWhatsappLink(config.whatsappNumber)} target="_blank" rel="noreferrer">
                <MessageCircle size={18} /> {resultCopy.whatsappLabel}
              </a>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
