"use client";

import { Check, Clock3, MessageCircle, UserRound } from "lucide-react";
import { BOOKING_DAY_OPTIONS, formatTimeLabel } from "@/lib/booking-config";

function money(value, currency = "COP") {
  if (value === null || value === undefined || value === "") return "Sin precio";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function BookingStepper({ steps = [], activeIndex = 0 }) {
  return (
    <div className="booking-stepper" aria-label="Progreso">
      {steps.map((step, index) => {
        const completed = index < activeIndex;
        const active = index === activeIndex;
        return (
          <div key={step.id || step.label || index} className={`booking-step ${active ? "is-active" : ""} ${completed ? "is-complete" : ""}`.trim()}>
            <span>{completed ? <Check size={14} /> : index + 1}</span>
            <strong>{step.label}</strong>
          </div>
        );
      })}
    </div>
  );
}

export function BookingServiceCard({ service, selected = false, onClick, currency = "COP" }) {
  return (
    <button className={`booking-choice-card booking-service-card ${selected ? "is-selected" : ""}`.trim()} type="button" onClick={onClick}>
      <div className="booking-choice-copy">
        <strong>{service.name}</strong>
        <span><Clock3 size={14} /> {service.durationMinutes} min</span>
      </div>
      <b>{money(service.price, currency)}</b>
    </button>
  );
}

export function BookingStaffCard({ staff, selected = false, onClick, highlight = false }) {
  return (
    <button className={`booking-choice-card booking-staff-card ${selected ? "is-selected" : ""} ${highlight ? "is-highlight" : ""}`.trim()} type="button" onClick={onClick}>
      <div className="booking-staff-avatar">
        {staff.photoThumbUrl || staff.photoUrl ? (
          <img src={staff.photoThumbUrl || staff.photoUrl} alt={staff.name} />
        ) : (
          <UserRound size={18} />
        )}
      </div>
      <div className="booking-choice-copy">
        <strong>{staff.name}</strong>
        <span>{staff.roleOrSpecialty || "Profesional disponible"}</span>
      </div>
    </button>
  );
}

export function BookingTimeChip({ label, selected = false, onClick }) {
  return (
    <button className={`booking-time-chip ${selected ? "is-selected" : ""}`.trim()} type="button" onClick={onClick}>
      {label}
    </button>
  );
}

export function BookingStatusBadge({ statusMeta }) {
  return (
    <span className={`booking-status-badge is-${statusMeta?.tone || "pending"}`.trim()}>
      {statusMeta?.label || "Pendiente"}
    </span>
  );
}

export function BookingAppointmentCard({ appointment, onWhatsapp, onStatusChange }) {
  return (
    <article className="booking-appointment-card">
      <div className="booking-appointment-main">
        <div className="booking-appointment-time">
          <strong>{formatTimeLabel(appointment.startTime)}</strong>
          <span>{appointment.durationLabel}</span>
        </div>
        <div className="booking-appointment-copy">
          <strong>{appointment.customerName}</strong>
          <span>{appointment.serviceNameSnapshot}</span>
        </div>
        <div className="booking-appointment-copy">
          <strong>{appointment.staffNameSnapshot}</strong>
          <span>{appointment.customerPhone}</span>
        </div>
        <BookingStatusBadge statusMeta={appointment.statusMeta} />
      </div>
      <div className="booking-appointment-actions">
        <select
          className="select"
          value={appointment.status}
          onChange={(event) => onStatusChange?.(appointment.id, event.target.value)}
        >
          <option value="pending">Pendiente</option>
          <option value="confirmed">Confirmada</option>
          <option value="completed">Completada</option>
          <option value="cancelled_by_customer">Cancelada por cliente</option>
          <option value="cancelled_by_business">Cancelada por negocio</option>
          <option value="no_show">No asistió</option>
        </select>
        <button className="booking-whatsapp-button" type="button" onClick={() => onWhatsapp?.(appointment)}>
          <MessageCircle size={16} /> WhatsApp
        </button>
      </div>
    </article>
  );
}

export function BookingScheduleRow({ row, onChange, fieldPrefix = "schedule" }) {
  const label = BOOKING_DAY_OPTIONS.find((item) => item.value === row.dayOfWeek)?.label || "Día";
  const isOpen = row.isOpen !== false && row.isWorking !== false;

  return (
    <div className="booking-schedule-row">
      <div className="booking-schedule-day">
        <strong>{label}</strong>
      </div>
      <label className="booking-toggle">
        <input
          type="checkbox"
          checked={isOpen}
          onChange={(event) => onChange({ ...row, isOpen: event.target.checked, isWorking: event.target.checked })}
        />
        <span>{isOpen ? "Activo" : "Cerrado"}</span>
      </label>
      <input
        aria-label={`${fieldPrefix}-${label}-inicio`}
        className="input"
        type="time"
        value={row.startTime}
        disabled={!isOpen}
        onChange={(event) => onChange({ ...row, startTime: event.target.value })}
      />
      <input
        aria-label={`${fieldPrefix}-${label}-fin`}
        className="input"
        type="time"
        value={row.endTime}
        disabled={!isOpen}
        onChange={(event) => onChange({ ...row, endTime: event.target.value })}
      />
    </div>
  );
}
