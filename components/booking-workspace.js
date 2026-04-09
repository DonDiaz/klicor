"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CalendarDays,
  Copy,
  ExternalLink,
  LoaderCircle,
  Plus,
  Save,
  Settings2,
  UserRound,
  X,
} from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import {
  BOOKING_DEFAULT_BUSINESS_SCHEDULE,
  formatBookingDateLabel,
  formatTimeLabel,
  normalizeBookingConfig,
  normalizeWeeklySchedule,
} from "@/lib/booking-config";
import {
  BookingAppointmentCard,
  BookingScheduleRow,
  BookingServiceCard,
  BookingStaffCard,
  BookingStepper,
  BookingTimeChip,
} from "@/components/booking-ui";

const ADMIN_SECTIONS = [
  { id: "agenda", label: "Agenda", icon: CalendarDays },
  { id: "services", label: "Servicios", icon: CalendarClock },
  { id: "staff", label: "Personal", icon: UserRound },
  { id: "hours", label: "Horarios", icon: CalendarClock },
  { id: "settings", label: "Configuración", icon: Settings2 },
];

const APPOINTMENT_STEPS = [
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

function buildDefaultServiceForm() {
  return {
    id: "",
    name: "",
    description: "",
    durationMinutes: 45,
    price: "",
    isActive: true,
    staffIds: [],
  };
}

function buildDefaultStaffForm(schedule = BOOKING_DEFAULT_BUSINESS_SCHEDULE) {
  return {
    id: "",
    name: "",
    roleOrSpecialty: "",
    isActive: true,
    serviceIds: [],
    schedule: normalizeWeeklySchedule(schedule),
    photoFile: null,
    photoThumbUrl: "",
    photoUrl: "",
  };
}

function buildDefaultAppointmentForm() {
  return {
    serviceId: "",
    staffId: "any",
    appointmentDate: "",
    startTime: "",
    customerName: "",
    customerPhone: "",
    customerNote: "",
  };
}

export function BookingWorkspace({ token, active = false, canEdit = true }) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("agenda");
  const [filters, setFilters] = useState({
    date: new Date().toISOString().slice(0, 10),
    staffId: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [configForm, setConfigForm] = useState(normalizeBookingConfig());
  const [serviceEditor, setServiceEditor] = useState(null);
  const [staffEditor, setStaffEditor] = useState(null);
  const [appointmentModal, setAppointmentModal] = useState(null);
  const [availabilityDates, setAvailabilityDates] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const services = useMemo(() => (Array.isArray(state?.services) ? state.services : []), [state?.services]);
  const staff = useMemo(() => (Array.isArray(state?.staff) ? state.staff : []), [state?.staff]);
  const appointments = useMemo(() => (Array.isArray(state?.appointments) ? state.appointments : []), [state?.appointments]);
  const summary = state?.summary || { total: 0, pendingCount: 0, confirmedCount: 0, completedCount: 0, hasAvailability: false };
  const publicUrl = useMemo(() => {
    if (!state?.publicUrl) return "";
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://klicor.com";
    return `${baseUrl}${state.publicUrl}`;
  }, [state?.publicUrl]);

  useEffect(() => {
    if (!active) return;
    loadState(filters);
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadState(nextFilters = filters) {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        date: nextFilters.date,
      });
      if (nextFilters.staffId) params.set("staffId", nextFilters.staffId);
      const response = await apiFetch(`/api/booking?${params.toString()}`, { token });
      setState(response.state);
      setConfigForm(response.state?.config || normalizeBookingConfig());
      setFilters(response.state?.filters || nextFilters);
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setLoading(false);
    }
  }

  async function runAction(action, payload = {}, file = null) {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const body = new FormData();
      body.append("action", action);
      body.append("payload", JSON.stringify(payload));
      if (file) body.append("photo", file);

      const response = await apiFetch("/api/booking", {
        method: "POST",
        token,
        body,
        isFormData: true,
      });
      await loadState(filters);
      setMessage("Cambios guardados.");
      return response.result;
    } catch (nextError) {
      setError(nextError.message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function loadAvailability(nextAppointment) {
    if (!nextAppointment?.serviceId) return;
    setLoadingAvailability(true);
    setError("");
    try {
      const params = new URLSearchParams({
        view: "availability",
        serviceId: nextAppointment.serviceId,
        staffId: nextAppointment.staffId || "any",
      });
      if (nextAppointment.appointmentDate) {
        params.set("date", nextAppointment.appointmentDate);
      }
      const response = await apiFetch(`/api/booking?${params.toString()}`, { token });
      setAvailabilityDates(Array.isArray(response.availability?.availableDates) ? response.availability.availableDates : []);
      setSlots(Array.isArray(response.availability?.slots) ? response.availability.slots : []);
    } catch (nextError) {
      setError(nextError.message);
      setAvailabilityDates([]);
      setSlots([]);
    } finally {
      setLoadingAvailability(false);
    }
  }

  function openServiceEditor(service = null) {
    setServiceEditor(service ? {
      ...buildDefaultServiceForm(),
      ...service,
      price: service.price ?? "",
    } : buildDefaultServiceForm());
  }

  function openStaffEditor(member = null) {
    setStaffEditor(member ? {
      ...buildDefaultStaffForm(configForm.businessSchedule),
      ...member,
      schedule: normalizeWeeklySchedule(member.schedule),
      photoFile: null,
    } : buildDefaultStaffForm(configForm.businessSchedule));
  }

  function openAppointmentEditor() {
    setAppointmentModal({
      stepIndex: 0,
      form: buildDefaultAppointmentForm(),
    });
    setAvailabilityDates([]);
    setSlots([]);
  }

  async function copyPublicUrl() {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setMessage("Link copiado.");
    } catch {
      setError("No pudimos copiar el link.");
    }
  }

  function openPublicUrl() {
    if (!publicUrl) return;
    window.open(publicUrl, "_blank", "noopener,noreferrer");
  }

  async function handleSaveConfig() {
    await runAction("save_config", configForm);
  }

  function renderHeader() {
    return (
      <header className="booking-admin-header">
        <div>
          <span>Módulo de agenda</span>
          <h2>Agenda y reservas</h2>
        </div>
        <div className="booking-admin-header-actions">
          <button className="btn btn-secondary" type="button" onClick={copyPublicUrl} disabled={!publicUrl}>
            <Copy size={16} /> Copiar link
          </button>
          <button className="btn btn-primary" type="button" onClick={openPublicUrl} disabled={!publicUrl}>
            <ExternalLink size={16} /> Abrir agenda pública
          </button>
        </div>
      </header>
    );
  }

  function renderAgendaSection() {
    return (
      <section className="booking-admin-panel">
        <div className="booking-admin-toolbar">
          <label>
            <span>Fecha</span>
            <input
              className="input"
              type="date"
              value={filters.date}
              onChange={(event) => {
                const next = { ...filters, date: event.target.value };
                setFilters(next);
                loadState(next);
              }}
            />
          </label>
          <label>
            <span>Empleado</span>
            <select
              className="select"
              value={filters.staffId}
              onChange={(event) => {
                const next = { ...filters, staffId: event.target.value };
                setFilters(next);
                loadState(next);
              }}
            >
              <option value="">Todos</option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          </label>
          <button className="btn btn-primary" type="button" onClick={openAppointmentEditor} disabled={!canEdit}>
            <Plus size={16} /> Nueva cita
          </button>
        </div>

        <div className="booking-admin-kpis">
          <article><strong>{summary.total}</strong><span>Citas del día</span></article>
          <article><strong>{summary.pendingCount}</strong><span>Pendientes</span></article>
          <article><strong>{summary.confirmedCount}</strong><span>Confirmadas</span></article>
          <article><strong>{summary.hasAvailability ? "Sí" : "No"}</strong><span>Agenda libre</span></article>
        </div>

        {appointments.length ? (
          <div className="booking-appointment-list">
            {appointments.map((appointment) => (
              <BookingAppointmentCard
                key={appointment.id}
                appointment={appointment}
                onStatusChange={(appointmentId, status) => runAction("update_appointment_status", { id: appointmentId, status })}
                onWhatsapp={(item) => window.open(item.whatsappUrl, "_blank", "noopener,noreferrer")}
              />
            ))}
          </div>
        ) : (
          <div className="booking-empty-state">
            <strong>Sin citas para esta fecha</strong>
            <p>Cuando entren nuevas reservas o crees una manualmente, aparecerán aquí.</p>
          </div>
        )}
      </section>
    );
  }

  function renderServicesSection() {
    return (
      <section className="booking-admin-panel">
        <div className="booking-admin-section-head">
          <div>
            <strong>Servicios</strong>
            <span>Define duración, precio y personal asignado.</span>
          </div>
          <button className="btn btn-primary" type="button" onClick={() => openServiceEditor()} disabled={!canEdit}>
            <Plus size={16} /> Crear servicio
          </button>
        </div>

        <div className="booking-admin-grid">
          {services.map((service) => (
            <article key={service.id} className="booking-admin-card">
              <div className="booking-admin-card-head">
                <strong>{service.name}</strong>
                <span className={`booking-mini-badge ${service.isActive ? "is-active" : "is-muted"}`.trim()}>
                  {service.isActive ? "Activo" : "Inactivo"}
                </span>
              </div>
              <p>{service.description || "Sin descripción"}</p>
              <div className="booking-admin-card-meta">
                <span>{service.durationMinutes} min</span>
                <span>{money(service.price)}</span>
                <span>{service.staffIds.length} profesionales</span>
              </div>
              <div className="booking-admin-card-actions">
                <button className="btn btn-secondary" type="button" onClick={() => openServiceEditor(service)}>Editar</button>
                <button className="btn btn-secondary" type="button" onClick={() => runAction("toggle_service", { serviceId: service.id, isActive: !service.isActive })}>
                  {service.isActive ? "Desactivar" : "Activar"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  function renderStaffSection() {
    return (
      <section className="booking-admin-panel">
        <div className="booking-admin-section-head">
          <div>
            <strong>Personal</strong>
            <span>Gestiona profesionales, especialidad y servicios habilitados.</span>
          </div>
          <button className="btn btn-primary" type="button" onClick={() => openStaffEditor()} disabled={!canEdit}>
            <Plus size={16} /> Crear profesional
          </button>
        </div>

        <div className="booking-admin-grid">
          {staff.map((member) => (
            <article key={member.id} className="booking-admin-card">
              <div className="booking-admin-staff-head">
                <BookingStaffCard staff={member} onClick={() => openStaffEditor(member)} />
                <span className={`booking-mini-badge ${member.isActive ? "is-active" : "is-muted"}`.trim()}>
                  {member.isActive ? "Activo" : "Inactivo"}
                </span>
              </div>
              <div className="booking-admin-card-meta">
                <span>{member.serviceIds.length} servicios</span>
              </div>
              <div className="booking-admin-card-actions">
                <button className="btn btn-secondary" type="button" onClick={() => openStaffEditor(member)}>Editar</button>
                <button className="btn btn-secondary" type="button" onClick={() => runAction("toggle_staff", { staffId: member.id, isActive: !member.isActive })}>
                  {member.isActive ? "Desactivar" : "Activar"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  function renderHoursSection() {
    return (
      <section className="booking-admin-panel booking-hours-panel">
        <div className="booking-admin-section-head">
          <div>
            <strong>Horario general</strong>
            <span>Define apertura y cierre del negocio.</span>
          </div>
          <button className="btn btn-primary" type="button" onClick={handleSaveConfig} disabled={!canEdit || loading}>
            <Save size={16} /> Guardar horario
          </button>
        </div>

        <div className="booking-schedule-table">
          {configForm.businessSchedule.map((row, index) => (
            <BookingScheduleRow
              key={row.dayOfWeek}
              row={row}
              fieldPrefix="negocio"
              onChange={(nextRow) => setConfigForm((current) => ({
                ...current,
                businessSchedule: current.businessSchedule.map((item, rowIndex) => (rowIndex === index ? nextRow : item)),
              }))}
            />
          ))}
        </div>

        <div className="booking-hours-staff-grid">
          {staff.map((member) => (
            <article key={member.id} className="booking-admin-card booking-hours-card">
              <div className="booking-admin-section-head">
                <div>
                  <strong>{member.name}</strong>
                  <span>{member.roleOrSpecialty || "Profesional"}</span>
                </div>
                <button className="btn btn-secondary" type="button" onClick={() => openStaffEditor(member)}>Editar horario</button>
              </div>
              <div className="booking-schedule-table compact">
                {member.schedule.map((row) => (
                  <div key={`${member.id}-${row.dayOfWeek}`} className="booking-schedule-row is-readonly">
                    <div className="booking-schedule-day">
                      <strong>{row.dayOfWeek === 0 ? "Domingo" : ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"][row.dayOfWeek]}</strong>
                    </div>
                    <span>{row.isWorking !== false ? `${row.startTime} - ${row.endTime}` : "Descanso"}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  function renderSettingsSection() {
    return (
      <section className="booking-admin-panel">
        <div className="booking-admin-section-head">
          <div>
            <strong>Configuración</strong>
            <span>Controla disponibilidad, confirmación y WhatsApp.</span>
          </div>
          <button className="btn btn-primary" type="button" onClick={handleSaveConfig} disabled={!canEdit || loading}>
            <Save size={16} /> Guardar configuración
          </button>
        </div>

        <div className="booking-settings-grid">
          <label className="switch-row">
            <input type="checkbox" checked={configForm.enabled} onChange={(event) => setConfigForm((current) => ({ ...current, enabled: event.target.checked }))} />
            <span>Activar agendamiento</span>
          </label>
          <label className="switch-row">
            <input type="checkbox" checked={configForm.allowStaffSelection !== false} onChange={(event) => setConfigForm((current) => ({ ...current, allowStaffSelection: event.target.checked }))} />
            <span>Permitir elegir profesional</span>
          </label>
          <label className="switch-row">
            <input type="checkbox" checked={configForm.autoConfirmBooking === true} onChange={(event) => setConfigForm((current) => ({ ...current, autoConfirmBooking: event.target.checked }))} />
            <span>Confirmación automática</span>
          </label>
          <label>
            <span>WhatsApp</span>
            <input className="input" value={configForm.whatsappNumber} onChange={(event) => setConfigForm((current) => ({ ...current, whatsappNumber: event.target.value }))} placeholder="573001234567" />
          </label>
          <label>
            <span>Minutos de anticipación</span>
            <input className="input" type="number" min="0" max="1440" value={configForm.noticeMinutes} onChange={(event) => setConfigForm((current) => ({ ...current, noticeMinutes: event.target.value }))} />
          </label>
          <label>
            <span>Días hacia el futuro</span>
            <input className="input" type="number" min="1" max="120" value={configForm.maxDaysAhead} onChange={(event) => setConfigForm((current) => ({ ...current, maxDaysAhead: event.target.value }))} />
          </label>
        </div>
      </section>
    );
  }

  function renderSectionContent() {
    if (activeSection === "agenda") return renderAgendaSection();
    if (activeSection === "services") return renderServicesSection();
    if (activeSection === "staff") return renderStaffSection();
    if (activeSection === "hours") return renderHoursSection();
    return renderSettingsSection();
  }

  function renderServiceEditor() {
    if (!serviceEditor) return null;
    return (
      <div className="commerce-modal-backdrop" role="dialog" aria-modal="true">
        <div className="commerce-modal-card booking-admin-modal">
          <button className="commerce-modal-close" type="button" onClick={() => setServiceEditor(null)}>
            <X size={16} />
          </button>
          <div className="commerce-modal-head">
            <strong>{serviceEditor.id ? "Editar servicio" : "Crear servicio"}</strong>
            <span>Configura nombre, duración, precio y personal asignado.</span>
          </div>
          <div className="booking-editor-form">
            <input className="input" placeholder="Nombre del servicio" value={serviceEditor.name} onChange={(event) => setServiceEditor((current) => ({ ...current, name: event.target.value }))} />
            <textarea className="textarea" rows={4} placeholder="Descripción" value={serviceEditor.description} onChange={(event) => setServiceEditor((current) => ({ ...current, description: event.target.value }))} />
            <div className="booking-inline-fields">
              <input className="input" type="number" min="5" step="5" placeholder="Duración (min)" value={serviceEditor.durationMinutes} onChange={(event) => setServiceEditor((current) => ({ ...current, durationMinutes: event.target.value }))} />
              <input className="input" type="number" min="0" step="1000" placeholder="Precio" value={serviceEditor.price} onChange={(event) => setServiceEditor((current) => ({ ...current, price: event.target.value }))} />
            </div>
            <label className="switch-row">
              <input type="checkbox" checked={serviceEditor.isActive !== false} onChange={(event) => setServiceEditor((current) => ({ ...current, isActive: event.target.checked }))} />
              <span>Servicio activo</span>
            </label>
            <div className="booking-checkbox-group">
              <strong>Profesionales que realizan este servicio</strong>
              {staff.map((member) => (
                <label key={member.id} className="booking-checkline">
                  <input
                    type="checkbox"
                    checked={serviceEditor.staffIds.includes(member.id)}
                    onChange={(event) => setServiceEditor((current) => ({
                      ...current,
                      staffIds: event.target.checked
                        ? [...current.staffIds, member.id]
                        : current.staffIds.filter((item) => item !== member.id),
                    }))}
                  />
                  <span>{member.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="commerce-modal-actions">
            <button className="btn btn-secondary" type="button" onClick={() => setServiceEditor(null)}>Cancelar</button>
            <button className="btn btn-primary" type="button" onClick={async () => {
              const result = await runAction("save_service", serviceEditor);
              if (result) setServiceEditor(null);
            }}>
              <Save size={16} /> Guardar servicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderStaffEditor() {
    if (!staffEditor) return null;
    return (
      <div className="commerce-modal-backdrop" role="dialog" aria-modal="true">
        <div className="commerce-modal-card booking-admin-modal booking-admin-modal-wide">
          <button className="commerce-modal-close" type="button" onClick={() => setStaffEditor(null)}>
            <X size={16} />
          </button>
          <div className="commerce-modal-head">
            <strong>{staffEditor.id ? "Editar profesional" : "Crear profesional"}</strong>
            <span>Asigna servicios y horario individual.</span>
          </div>
          <div className="booking-editor-form">
            <input className="input" placeholder="Nombre" value={staffEditor.name} onChange={(event) => setStaffEditor((current) => ({ ...current, name: event.target.value }))} />
            <input className="input" placeholder="Cargo o especialidad" value={staffEditor.roleOrSpecialty} onChange={(event) => setStaffEditor((current) => ({ ...current, roleOrSpecialty: event.target.value }))} />
            <label className="upload-card">
              <input className="upload-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setStaffEditor((current) => ({ ...current, photoFile: event.target.files?.[0] || null }))} />
              <span>{staffEditor.photoFile ? staffEditor.photoFile.name : "Subir foto opcional"}</span>
            </label>
            <label className="switch-row">
              <input type="checkbox" checked={staffEditor.isActive !== false} onChange={(event) => setStaffEditor((current) => ({ ...current, isActive: event.target.checked }))} />
              <span>Profesional activo</span>
            </label>
            <div className="booking-checkbox-group">
              <strong>Servicios asignados</strong>
              {services.map((service) => (
                <label key={service.id} className="booking-checkline">
                  <input
                    type="checkbox"
                    checked={staffEditor.serviceIds.includes(service.id)}
                    onChange={(event) => setStaffEditor((current) => ({
                      ...current,
                      serviceIds: event.target.checked
                        ? [...current.serviceIds, service.id]
                        : current.serviceIds.filter((item) => item !== service.id),
                    }))}
                  />
                  <span>{service.name}</span>
                </label>
              ))}
            </div>
            <div className="booking-schedule-table">
              {staffEditor.schedule.map((row, index) => (
                <BookingScheduleRow
                  key={row.dayOfWeek}
                  row={row}
                  fieldPrefix="staff"
                  onChange={(nextRow) => setStaffEditor((current) => ({
                    ...current,
                    schedule: current.schedule.map((item, rowIndex) => (rowIndex === index ? nextRow : item)),
                  }))}
                />
              ))}
            </div>
          </div>
          <div className="commerce-modal-actions">
            <button className="btn btn-secondary" type="button" onClick={() => setStaffEditor(null)}>Cancelar</button>
            <button className="btn btn-primary" type="button" onClick={async () => {
              const { photoFile, ...payload } = staffEditor;
              const result = await runAction("save_staff", payload, photoFile);
              if (result) setStaffEditor(null);
            }}>
              <Save size={16} /> Guardar profesional
            </button>
          </div>
        </div>
      </div>
    );
  }

  async function handleAppointmentFlow(nextForm, nextStep) {
    setAppointmentModal((current) => current ? { ...current, form: nextForm, stepIndex: nextStep } : current);
    if (nextStep === 2 || nextStep === 3) {
      await loadAvailability(nextForm);
    }
  }

  function renderAppointmentModal() {
    if (!appointmentModal) return null;
    const form = appointmentModal.form;
    const selectedService = services.find((item) => item.id === form.serviceId) || null;
    const eligibleStaff = staff.filter((item) => selectedService ? item.serviceIds.includes(selectedService.id) : false);

    return (
      <div className="commerce-modal-backdrop" role="dialog" aria-modal="true">
        <div className="commerce-modal-card booking-admin-modal booking-admin-modal-wide">
          <button className="commerce-modal-close" type="button" onClick={() => setAppointmentModal(null)}>
            <X size={16} />
          </button>
          <div className="commerce-modal-head">
            <strong>Nueva cita</strong>
            <span>Usa la misma lógica de disponibilidad de la vista pública.</span>
          </div>
          <BookingStepper steps={APPOINTMENT_STEPS} activeIndex={appointmentModal.stepIndex} />

          {appointmentModal.stepIndex === 0 ? (
            <div className="booking-choice-grid">
              {services.filter((item) => item.isActive).map((service) => (
                <BookingServiceCard
                  key={service.id}
                  service={service}
                  selected={form.serviceId === service.id}
                  onClick={() => handleAppointmentFlow({ ...form, serviceId: service.id, staffId: "any", appointmentDate: "", startTime: "" }, 1)}
                />
              ))}
            </div>
          ) : null}

          {appointmentModal.stepIndex === 1 ? (
            <div className="booking-choice-grid">
              <BookingStaffCard
                staff={{ name: "Cualquiera disponible", roleOrSpecialty: "Asignación automática" }}
                highlight
                selected={form.staffId === "any"}
                onClick={() => handleAppointmentFlow({ ...form, staffId: "any", appointmentDate: "", startTime: "" }, 2)}
              />
              {configForm.allowStaffSelection !== false ? eligibleStaff.map((member) => (
                <BookingStaffCard
                  key={member.id}
                  staff={member}
                  selected={form.staffId === member.id}
                  onClick={() => handleAppointmentFlow({ ...form, staffId: member.id, appointmentDate: "", startTime: "" }, 2)}
                />
              )) : null}
            </div>
          ) : null}

          {appointmentModal.stepIndex === 2 ? (
            <div className="booking-admin-date-grid">
              {loadingAvailability ? (
                <div className="booking-loading-state">
                  <LoaderCircle size={18} className="spin" />
                  <span>Buscando fechas...</span>
                </div>
              ) : availabilityDates.map((item) => (
                <button
                  key={item.date}
                  className={`booking-date-pill ${form.appointmentDate === item.date ? "is-selected" : ""}`.trim()}
                  type="button"
                  onClick={async () => {
                    const nextForm = { ...form, appointmentDate: item.date, startTime: "" };
                    await handleAppointmentFlow(nextForm, 3);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}

          {appointmentModal.stepIndex === 3 ? (
            <div className="booking-time-grid">
              {loadingAvailability ? (
                <div className="booking-loading-state">
                  <LoaderCircle size={18} className="spin" />
                  <span>Cargando horas...</span>
                </div>
              ) : slots.map((slot) => (
                <BookingTimeChip
                  key={slot.startTime}
                  label={slot.label}
                  selected={form.startTime === slot.startTime}
                  onClick={() => setAppointmentModal((current) => current ? { ...current, form: { ...current.form, startTime: slot.startTime }, stepIndex: 4 } : current)}
                />
              ))}
            </div>
          ) : null}

          {appointmentModal.stepIndex === 4 ? (
            <div className="booking-editor-form">
              <div className="booking-summary-card">
                <div>
                  <span>Servicio</span>
                  <b>{selectedService?.name}</b>
                </div>
                <div>
                  <span>Profesional</span>
                  <b>{form.staffId === "any" ? "Cualquiera disponible" : staff.find((item) => item.id === form.staffId)?.name || "Profesional"}</b>
                </div>
                <div>
                  <span>Fecha</span>
                  <b>{form.appointmentDate ? formatBookingDateLabel(new Date(`${form.appointmentDate}T00:00:00`)) : ""}</b>
                </div>
                <div>
                  <span>Hora</span>
                  <b>{form.startTime ? formatTimeLabel(form.startTime) : ""}</b>
                </div>
              </div>
              <div className="booking-inline-fields">
                <input className="input" placeholder="Nombre" value={form.customerName} onChange={(event) => setAppointmentModal((current) => current ? { ...current, form: { ...current.form, customerName: event.target.value } } : current)} />
                <input className="input" placeholder="Teléfono" value={form.customerPhone} onChange={(event) => setAppointmentModal((current) => current ? { ...current, form: { ...current.form, customerPhone: event.target.value } } : current)} />
              </div>
              <textarea className="textarea" rows={3} placeholder="Nota opcional" value={form.customerNote} onChange={(event) => setAppointmentModal((current) => current ? { ...current, form: { ...current.form, customerNote: event.target.value } } : current)} />
            </div>
          ) : null}

          <div className="commerce-modal-actions">
            {appointmentModal.stepIndex > 0 ? (
              <button className="btn btn-secondary" type="button" onClick={() => setAppointmentModal((current) => current ? { ...current, stepIndex: Math.max(current.stepIndex - 1, 0) } : current)}>
                Volver
              </button>
            ) : <span />}
            {appointmentModal.stepIndex === 4 ? (
              <button className="btn btn-primary" type="button" onClick={async () => {
                const result = await runAction("create_appointment", form);
                if (result) setAppointmentModal(null);
              }}>
                <Save size={16} /> Crear cita
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (!active) return null;

  return (
    <section className="dashboard-section panel workspace-panel booking-workspace">
      {renderHeader()}
      {message ? <div className="notice"><span>{message}</span></div> : null}
      {error ? <div className="notice notice-danger"><span>{error}</span></div> : null}

      {loading && !state ? (
        <div className="kpi"><LoaderCircle size={18} className="spin" /> Cargando agenda...</div>
      ) : (
        <div className="booking-workspace-layout">
          <aside className="booking-admin-sidebar">
            {ADMIN_SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  className={`booking-admin-sidebar-item ${activeSection === section.id ? "is-active" : ""}`.trim()}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                >
                  <Icon size={18} />
                  <span>{section.label}</span>
                </button>
              );
            })}
          </aside>
          <div className="booking-admin-content">
            {renderSectionContent()}
          </div>
        </div>
      )}

      {renderServiceEditor()}
      {renderStaffEditor()}
      {renderAppointmentModal()}
    </section>
  );
}
