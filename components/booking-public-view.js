"use client";

import { useEffect, useMemo, useState } from "react";
import { addMonths, startOfMonth, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, LoaderCircle, MessageCircle } from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import {
  BOOKING_DAY_OPTIONS,
  buildBookingCalendarMonth,
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
  { id: "date", label: "Fecha" },
  { id: "time", label: "Hora" },
  { id: "data", label: "Datos" },
];

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()));

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
  const availableDateMap = useMemo(
    () => new Set(availabilityDates.map((item) => item.date)),
    [availabilityDates],
  );
  const calendarBounds = useMemo(
    () => getBookingCalendarBounds(config.maxDaysAhead || 30),
    [config.maxDaysAhead],
  );
  const calendarDays = useMemo(
    () => buildBookingCalendarMonth(calendarMonth, {
      minDate: calendarBounds.minDate,
      maxDate: calendarBounds.maxDate,
    }),
    [calendarBounds.maxDate, calendarBounds.minDate, calendarMonth],
  );

  const rootStyle = useMemo(() => ({
    "--booking-primary": appearance.primaryColor || "#2563eb",
    "--booking-primary-soft": `${appearance.primaryColor || "#2563eb"}1A`,
    "--booking-surface": appearance.surfaceColor || "#ffffff",
    "--booking-surface-soft": appearance.backgroundColor || "#f8fafc",
    "--booking-text": appearance.textPrimaryColor || "#0f172a",
    "--booking-muted": appearance.textSecondaryColor || "#475569",
    "--booking-button-text": appearance.buttonPrimaryTextColor || "#ffffff",
  }), [appearance]);

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
      setAvailabilityDates(Array.isArray(response.data?.availableDates) ? response.data.availableDates : []);
    } catch (nextError) {
      setError(nextError.message);
      setAvailabilityDates([]);
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
      setSlots(Array.isArray(response.data?.slots) ? response.data.slots : []);
    } catch (nextError) {
      setError(nextError.message);
      setSlots([]);
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
      await loadDates(serviceId, nextStaffId);
      setStepIndex(2);
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
    await loadDates(selection.serviceId, nextStaffId);
    setStepIndex(2);
  }

  async function handleSelectDate(date) {
    setSelection((current) => ({
      ...current,
      appointmentDate: date,
      startTime: "",
    }));
    await loadSlots(date);
    setStepIndex(3);
  }

  function handleSelectTime(startTime) {
    setSelection((current) => ({
      ...current,
      startTime,
    }));
    setStepIndex(4);
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

  return (
    <main className="booking-public-page" style={rootStyle}>
      <section className="booking-public-shell">
        <header className="booking-public-header">
          <div className="booking-public-brand">
            {business.photoThumb || business.photo ? (
              <img src={business.photoThumb || business.photo} alt={business.businessName} />
            ) : (
              <span>{business.businessName?.slice(0, 1) || "K"}</span>
            )}
            <div>
              {business.businessName ? <strong>{business.businessName}</strong> : null}
              <h1>Agenda tu cita</h1>
            </div>
          </div>
        </header>

        <section className="booking-wizard-card">
          {!success ? (
            <>
              <BookingStepper steps={PUBLIC_STEPS} activeIndex={stepIndex} />

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
                    staff={{ name: "Cualquiera disponible", roleOrSpecialty: "Te asignaremos un profesional libre" }}
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
                  <div className="booking-calendar-weekdays">
                    {BOOKING_DAY_OPTIONS.map((day) => (
                      <span key={day.value}>{day.shortLabel}</span>
                    ))}
                  </div>
                  {loadingDates ? (
                    <div className="booking-loading-state">
                      <LoaderCircle size={18} className="spin" />
                      <span>Buscando fechas disponibles...</span>
                    </div>
                  ) : (
                    <div className="booking-calendar-grid">
                      {calendarDays.map((day) => {
                        if (!day.inMonth) {
                          return <span key={day.key} className="booking-calendar-placeholder" aria-hidden="true" />;
                        }

                        const enabled = !day.isBeforeRange && !day.isAfterRange && availableDateMap.has(day.dateString);
                        const selected = selection.appointmentDate === day.dateString;

                        return (
                          <button
                            key={day.key}
                            className={`booking-calendar-day ${selected ? "is-selected" : ""}`.trim()}
                            type="button"
                            disabled={!enabled}
                            onClick={() => handleSelectDate(day.dateString)}
                          >
                            <strong>{day.date.getDate()}</strong>
                            <span>{day.date.toLocaleDateString("es-CO", { month: "short" })}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : null}

              {stepIndex === 3 ? (
                <div className="booking-time-grid">
                  {loadingSlots ? (
                    <div className="booking-loading-state">
                      <LoaderCircle size={18} className="spin" />
                      <span>Cargando horarios...</span>
                    </div>
                  ) : slots.length ? slots.map((slot) => (
                    <BookingTimeChip
                      key={slot.startTime}
                      label={slot.label}
                      selected={selection.startTime === slot.startTime}
                      onClick={() => handleSelectTime(slot.startTime)}
                    />
                  )) : (
                    <div className="booking-empty-state">
                      <strong>Sin horarios disponibles</strong>
                      <p>Prueba con otra fecha o profesional.</p>
                    </div>
                  )}
                </div>
              ) : null}

              {stepIndex === 4 ? (
                <form className="booking-data-form" onSubmit={handleSubmit}>
                  <div className="booking-summary-card">
                    <strong>Resumen de la cita</strong>
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
                    Confirmar cita
                  </button>
                </form>
              ) : null}
            </>
          ) : (
            <div className="booking-success-card">
              <strong>Tu cita quedó registrada</strong>
              <p>Ya reservamos tu espacio. Si quieres, puedes seguir la conversación por WhatsApp.</p>
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
                <MessageCircle size={18} /> Hablar por WhatsApp
              </a>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
