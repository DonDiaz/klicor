"use client";

import { useMemo, useState } from "react";
import { Check, CheckCircle2, ChevronRight, Clock3, MessageCircle, UserRound, XCircle } from "lucide-react";
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
  const [imageError, setImageError] = useState(false);
  const imageUrl = !imageError ? service.photoThumbUrl || service.photoUrl || "" : "";

  return (
    <button className={`booking-choice-card booking-service-card ${selected ? "is-selected" : ""}`.trim()} type="button" onClick={onClick}>
      <div className="booking-service-thumb">
        {imageUrl ? (
          <img src={imageUrl} alt={service.name} onError={() => setImageError(true)} />
        ) : (
          <Clock3 size={18} />
        )}
      </div>
      <div className="booking-choice-copy">
        <strong>{service.name}</strong>
        <span><Clock3 size={14} /> {service.durationMinutes} min</span>
        {service.description ? <p>{service.description}</p> : null}
      </div>
      <div className="booking-service-action">
        <b>{money(service.price, currency)}</b>
        <ChevronRight className="booking-choice-arrow" size={18} aria-hidden="true" />
      </div>
    </button>
  );
}

export function BookingStaffCard({ staff, selected = false, onClick, highlight = false }) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = !imageError ? staff.photoThumbUrl || staff.photoUrl || "" : "";
  const initials = useMemo(() => {
    const parts = String(staff.name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    return parts.slice(0, 2).map((part) => part.slice(0, 1).toUpperCase()).join("") || "PR";
  }, [staff.name]);

  return (
    <button className={`booking-choice-card booking-staff-card ${selected ? "is-selected" : ""} ${highlight ? "is-highlight" : ""}`.trim()} type="button" onClick={onClick}>
      <div className="booking-staff-avatar">
        {imageUrl ? (
          <img src={imageUrl} alt={staff.name} onError={() => setImageError(true)} />
        ) : (
          <span className="booking-staff-avatar-fallback" aria-hidden="true">
            {highlight ? <UserRound size={18} /> : initials}
          </span>
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

export function BookingAppointmentCard({ appointment, compact = false, onWhatsapp, onReschedule, onStatusChange }) {
  if (compact) {
    return (
      <article className="booking-appointment-card is-compact">
        <div className="booking-appointment-copy">
          <strong>{appointment.customerName}</strong>
          <span>{appointment.serviceNameSnapshot}</span>
          <small>{formatTimeLabel(appointment.startTime)} - {formatTimeLabel(appointment.endTime)}</small>
        </div>
        <BookingStatusBadge statusMeta={appointment.statusMeta} />
        <div className="booking-appointment-actions">
          {appointment.status === "pending" ? (
            <button className="booking-status-action is-confirm" type="button" onClick={() => onStatusChange?.(appointment.id, "confirmed")}>
              Aceptar
            </button>
          ) : null}
          <button className="booking-status-action" type="button" onClick={() => onReschedule?.(appointment)}>
            Reprogramar
          </button>
        </div>
      </article>
    );
  }

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
        {appointment.status === "pending" ? (
          <>
            <button className="booking-status-action is-confirm" type="button" onClick={() => onStatusChange?.(appointment.id, "confirmed")}>
              <CheckCircle2 size={16} /> Aceptar
            </button>
            <button className="booking-status-action is-cancel" type="button" onClick={() => onStatusChange?.(appointment.id, "cancelled_by_business")}>
              <XCircle size={16} /> Rechazar
            </button>
          </>
        ) : null}
        <button className="booking-status-action" type="button" onClick={() => onReschedule?.(appointment)}>
          Reprogramar
        </button>
        <select
          className="select"
          value={appointment.status}
          onChange={(event) => onStatusChange?.(appointment.id, event.target.value)}
        >
          <option value="pending">Solicitud pendiente</option>
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
  const shiftMode = row.shiftMode === "split" ? "split" : "continuous";

  function updateRow(nextPatch) {
    onChange({
      ...row,
      shiftMode,
      secondStartTime: row.secondStartTime || "14:00",
      secondEndTime: row.secondEndTime || "18:00",
      ...nextPatch,
    });
  }

  function handleModeChange(nextMode) {
    if (nextMode === "split") {
      updateRow({
        shiftMode: "split",
        secondStartTime: row.secondStartTime || "14:00",
        secondEndTime: row.secondEndTime || "18:00",
      });
      return;
    }

    updateRow({ shiftMode: "continuous" });
  }

  return (
    <div className="booking-schedule-row">
      <div className="booking-schedule-day">
        <strong>{label}</strong>
        <span>{isOpen ? (shiftMode === "split" ? "Mañana y tarde" : "Jornada continua") : "Cerrado"}</span>
      </div>
      <label className="booking-toggle">
        <input
          type="checkbox"
          checked={isOpen}
          onChange={(event) => updateRow({ isOpen: event.target.checked, isWorking: event.target.checked })}
        />
        <span>{isOpen ? "Activo" : "Cerrado"}</span>
      </label>
      <div className="booking-schedule-mode" role="group" aria-label={`${fieldPrefix}-${label}-modo`}>
        <button
          className={`booking-mode-chip ${shiftMode === "continuous" ? "is-active" : ""}`.trim()}
          type="button"
          disabled={!isOpen}
          onClick={() => handleModeChange("continuous")}
        >
          Continuo
        </button>
        <button
          className={`booking-mode-chip ${shiftMode === "split" ? "is-active" : ""}`.trim()}
          type="button"
          disabled={!isOpen}
          onClick={() => handleModeChange("split")}
        >
          Mañana y tarde
        </button>
      </div>
      <div className="booking-schedule-window-group">
        <span className="booking-schedule-window-label">{shiftMode === "split" ? "Mañana" : "Horario"}</span>
        <div className="booking-schedule-time-pair">
          <input
            aria-label={`${fieldPrefix}-${label}-inicio`}
            className="input"
            type="time"
            value={row.startTime}
            disabled={!isOpen}
            onChange={(event) => updateRow({ startTime: event.target.value })}
          />
          <input
            aria-label={`${fieldPrefix}-${label}-fin`}
            className="input"
            type="time"
            value={row.endTime}
            disabled={!isOpen}
            onChange={(event) => updateRow({ endTime: event.target.value })}
          />
        </div>
      </div>
      {shiftMode === "split" ? (
        <div className="booking-schedule-window-group">
          <span className="booking-schedule-window-label">Tarde</span>
          <div className="booking-schedule-time-pair">
            <input
              aria-label={`${fieldPrefix}-${label}-segunda-inicio`}
              className="input"
              type="time"
              value={row.secondStartTime || "14:00"}
              disabled={!isOpen}
              onChange={(event) => updateRow({ secondStartTime: event.target.value })}
            />
            <input
              aria-label={`${fieldPrefix}-${label}-segunda-fin`}
              className="input"
              type="time"
              value={row.secondEndTime || "18:00"}
              disabled={!isOpen}
              onChange={(event) => updateRow({ secondEndTime: event.target.value })}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
