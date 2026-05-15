"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import {
  CalendarClock,
  CalendarDays,
  Copy,
  ExternalLink,
  LoaderCircle,
  Plus,
  RefreshCw,
  Save,
  Settings2,
  UserRound,
  X,
} from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import { getClientDb } from "@/lib/firebase-client";
import {
  BOOKING_DEFAULT_BUSINESS_SCHEDULE,
  formatBookingDateLabel,
  formatScheduleWindowsLabel,
  formatTimeLabel,
  getDayScheduleWindows,
  minutesToTime,
  normalizeBookingConfig,
  normalizeWeeklySchedule,
  timeToMinutes,
} from "@/lib/booking-config";
import {
  BookingAppointmentCard,
  BookingScheduleRow,
  BookingServiceCard,
  BookingStaffCard,
  BookingStatusBadge,
  BookingStepper,
  BookingTimeChip,
} from "@/components/booking-ui";

const ADMIN_SECTIONS = [
  { id: "agenda", label: "Agenda", icon: CalendarDays },
  { id: "services", label: "Servicios", icon: CalendarClock },
  { id: "staff", label: "Profesionales", icon: UserRound },
  { id: "hours", label: "Horarios", icon: CalendarClock },
  { id: "settings", label: "Configuración", icon: Settings2 },
];

const APPOINTMENT_STEPS = [
  { id: "service", label: "Servicio" },
  { id: "staff", label: "Profesional" },
  { id: "date", label: "Fecha" },
  { id: "time", label: "Hora" },
  { id: "data", label: "Tus datos" },
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
    photoFile: null,
    photoThumbUrl: "",
    photoUrl: "",
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
    id: "",
    serviceId: "",
    staffId: "any",
    appointmentDate: "",
    startTime: "",
    customerName: "",
    customerPhone: "",
    customerNote: "",
  };
}

function validateAppointmentForm(form) {
  if (!String(form.customerName || "").trim() || String(form.customerName || "").trim().length < 2) {
    return "Ingresa el nombre del cliente.";
  }

  const digits = String(form.customerPhone || "").replace(/\D/g, "");
  if (digits.length < 7) {
    return "Ingresa un teléfono válido.";
  }

  return "";
}

function buildAgendaGrid({ dateString, config, staff = [], appointments = [], selectedStaffId = "" }) {
  const date = dateString ? new Date(`${dateString}T00:00:00`) : new Date();
  const dayOfWeek = date.getDay();
  const businessDay = normalizeWeeklySchedule(config.businessSchedule).find((item) => item.dayOfWeek === dayOfWeek);
  const windows = getDayScheduleWindows(businessDay);
  const firstWindow = windows[0] || { startMinutes: 8 * 60, endMinutes: 18 * 60 };
  const startMinutes = Math.floor(firstWindow.startMinutes / 30) * 30;
  const endMinutes = Math.ceil((windows.at(-1)?.endMinutes || firstWindow.endMinutes) / 30) * 30;
  const rows = [];
  for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
    rows.push({ minutes, time: minutesToTime(minutes), label: formatTimeLabel(minutes) });
  }

  const columns = staff
    .filter((member) => member.isActive !== false)
    .filter((member) => !selectedStaffId || member.id === selectedStaffId);
  const appointmentsByStaff = appointments.reduce((map, appointment) => {
    const current = map.get(appointment.staffId) || [];
    current.push(appointment);
    map.set(appointment.staffId, current);
    return map;
  }, new Map());

  return { rows, columns, appointmentsByStaff };
}

export function BookingWorkspace({ token, active = false, canEdit = true }) {
  const realtimeReadyRef = useRef(false);
  const agendaRefreshRef = useRef(false);
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
  const [staffDeleteReview, setStaffDeleteReview] = useState(null);

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

  useEffect(() => {
    if (!message) return undefined;
    const timeout = window.setTimeout(() => setMessage(""), 2800);
    return () => window.clearTimeout(timeout);
  }, [message]);

  useEffect(() => {
    if (!active || activeSection !== "agenda" || !state?.ownerUid || !filters.date) return undefined;
    const db = getClientDb();
    if (!db) return undefined;

    realtimeReadyRef.current = false;
    const constraints = [where("appointmentDate", "==", filters.date)];
    if (filters.staffId) constraints.push(where("staffId", "==", filters.staffId));

    const appointmentsQuery = query(
      collection(db, "users", state.ownerUid, "bookingAppointments"),
      ...constraints,
    );

    return onSnapshot(
      appointmentsQuery,
      (snapshot) => {
        if (!realtimeReadyRef.current) {
          realtimeReadyRef.current = true;
          return;
        }
        if (!snapshot.docChanges().length) return;
        loadState(filters, { silent: true });
      },
      (snapshotError) => {
        console.warn("[booking-realtime]", snapshotError?.message || snapshotError);
      },
    );
  }, [active, activeSection, filters.date, filters.staffId, state?.ownerUid]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!active || activeSection !== "agenda" || !state?.ownerUid || !filters.date) return undefined;

    const refreshAgenda = async () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      await refreshAgendaState();
    };

    window.addEventListener("focus", refreshAgenda);
    document.addEventListener("visibilitychange", refreshAgenda);

    return () => {
      window.removeEventListener("focus", refreshAgenda);
      document.removeEventListener("visibilitychange", refreshAgenda);
    };
  }, [active, activeSection, filters.date, filters.staffId, state?.ownerUid]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadState(nextFilters = filters, options = {}) {
    const silent = options.silent === true;
    if (!silent) {
      setLoading(true);
      setError("");
    }
    try {
      const params = new URLSearchParams({
        date: nextFilters.date,
      });
      if (nextFilters.staffId) params.set("staffId", nextFilters.staffId);
      const response = await apiFetch(`/api/booking?${params.toString()}`, { token, cache: "no-store" });
      setState(response.state);
      setConfigForm(response.state?.config || normalizeBookingConfig());
      setFilters(response.state?.filters || nextFilters);
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }

  async function runAction(action, payload = {}, file = null, options = {}) {
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
        cache: "no-store",
      });
      setMessage("Cambios guardados.");
      if (options.refresh !== false) {
        await loadState(filters, { silent: true });
      }
      return response.result;
    } catch (nextError) {
      setError(nextError.message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function refreshAgendaState(options = {}) {
    if (agendaRefreshRef.current) return;

    agendaRefreshRef.current = true;
    try {
      await loadState(filters, { silent: true });
      if (options.notify) setMessage("Agenda actualizada.");
    } finally {
      agendaRefreshRef.current = false;
    }
  }

  async function loadStaffBlockers(member) {
    const params = new URLSearchParams({
      view: "staff-blockers",
      staffId: member.id,
    });
    const response = await apiFetch(`/api/booking?${params.toString()}`, { token, cache: "no-store" });
    return Array.isArray(response.appointments) ? response.appointments : [];
  }

  async function handleDeleteStaff(member) {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const blockers = await loadStaffBlockers(member);
      if (blockers.length) {
        setStaffDeleteReview({ member, appointments: blockers });
        return;
      }
      if (window.confirm(`Eliminar a ${member.name}? Esta accion no se puede deshacer.`)) {
        await runAction("delete_staff", { staffId: member.id });
      }
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setLoading(false);
    }
  }

  async function refreshStaffDeleteReview(review = staffDeleteReview) {
    if (!review?.member) return;
    const appointments = await loadStaffBlockers(review.member);
    if (!appointments.length) {
      setStaffDeleteReview(null);
      setMessage("Ya puedes eliminar el profesional.");
      await loadState(filters, { silent: true });
      return;
    }
    setStaffDeleteReview({ ...review, appointments });
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
      if (nextAppointment.id) {
        params.set("excludeAppointmentId", nextAppointment.id);
      }
      const response = await apiFetch(`/api/booking?${params.toString()}`, { token, cache: "no-store" });
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
      photoFile: null,
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

  function openAppointmentEditor(appointment = null, options = {}) {
    const isExistingAppointment = Boolean(appointment?.id);
    const form = appointment ? {
      ...buildDefaultAppointmentForm(),
      id: appointment.id,
      serviceId: appointment.serviceId,
      staffId: appointment.staffId || "any",
      appointmentDate: appointment.appointmentDate,
      startTime: appointment.startTime,
      customerName: appointment.customerName,
      customerPhone: appointment.customerPhone,
      customerNote: appointment.customerNote || "",
    } : buildDefaultAppointmentForm();

    setAppointmentModal({
      mode: isExistingAppointment ? "reschedule" : "create",
      stepIndex: options.startStep ?? (isExistingAppointment ? 2 : 0),
      form,
    });
    setAvailabilityDates([]);
    setSlots([]);
    if (isExistingAppointment) {
      loadAvailability({ ...form, appointmentDate: "" });
    }
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
    const savedConfig = await runAction("save_config", configForm, null, { refresh: false });
    if (savedConfig) {
      setConfigForm(normalizeBookingConfig(savedConfig));
      setState((current) => current ? {
        ...current,
        config: normalizeBookingConfig(savedConfig),
      } : current);
    }
  }

  function renderHeader() {
    return (
      <header className="booking-admin-header">
        <div>
          <span>Módulo de citas y servicios</span>
          <h2>Agenda</h2>
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
    const agendaGrid = buildAgendaGrid({
      dateString: filters.date,
      config: configForm,
      staff,
      appointments,
      selectedStaffId: filters.staffId,
    });

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
            <span>Profesional</span>
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
          <button className="btn btn-secondary" type="button" onClick={() => refreshAgendaState({ notify: true })}>
            <RefreshCw size={16} /> Actualizar
          </button>
        </div>

        <div className="booking-admin-kpis">
          <article><strong>{summary.total}</strong><span>Citas del día</span></article>
          <article><strong>{summary.pendingCount}</strong><span>Solicitudes</span></article>
          <article><strong>{summary.confirmedCount}</strong><span>Confirmadas</span></article>
          <article><strong>{summary.hasAvailability ? "Sí" : "No"}</strong><span>Agenda libre</span></article>
        </div>

        {agendaGrid.columns.length ? (
          <div className="booking-agenda-board">
            <div className="booking-agenda-grid" style={{ "--booking-agenda-columns": agendaGrid.columns.length }}>
              <div className="booking-agenda-head is-time">Hora</div>
              {agendaGrid.columns.map((member) => (
                <div key={member.id} className="booking-agenda-head">
                  <BookingStaffCard staff={member} onClick={() => openStaffEditor(member)} />
                </div>
              ))}
              {agendaGrid.rows.map((row) => (
                <Fragment key={row.time}>
                  <div className="booking-agenda-time">{row.label}</div>
                  {agendaGrid.columns.map((member) => {
                    const cellAppointments = (agendaGrid.appointmentsByStaff.get(member.id) || [])
                      .filter((appointment) => appointment.startMinutes >= row.minutes && appointment.startMinutes < row.minutes + 30);
                    const isBusy = cellAppointments.length > 0;

                    return (
                      <div key={`${member.id}-${row.time}`} className={`booking-agenda-cell ${isBusy ? "is-busy" : "is-free"}`.trim()}>
                        {isBusy ? cellAppointments.map((appointment) => (
                          <BookingAppointmentCard
                            key={appointment.id}
                            appointment={appointment}
                            compact
                            onStatusChange={(appointmentId, status) => runAction("update_appointment_status", { id: appointmentId, status })}
                            onReschedule={(item) => openAppointmentEditor(item)}
                            onWhatsapp={(item) => window.open(item.whatsappUrl, "_blank", "noopener,noreferrer")}
                          />
                        )) : (
                          <button
                            className="booking-agenda-add"
                            type="button"
                            onClick={() => openAppointmentEditor({
                              staffId: member.id,
                              appointmentDate: filters.date,
                              startTime: row.time,
                              customerName: "",
                              customerPhone: "",
                              customerNote: "",
                            }, { startStep: 0 })}
                          >
                            +
                          </button>
                        )}
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        ) : (
          <div className="booking-empty-state">
            <strong>Sin profesionales activos</strong>
            <p>Crea o activa al menos un profesional para ver la agenda por horarios.</p>
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
            <strong>Servicios agendables</strong>
            <span>Define duración, precio y profesionales asignados.</span>
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
            <strong>Profesionales</strong>
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
                <button className="btn btn-danger" type="button" onClick={() => handleDeleteStaff(member)}>
                  Eliminar
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
                    <span>{formatScheduleWindowsLabel(row)}</span>
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
            <span>Confirmar citas automáticamente</span>
          </label>
          <label className="switch-row">
            <input type="checkbox" checked={configForm.notifyBusinessOnRequest !== false} onChange={(event) => setConfigForm((current) => ({ ...current, notifyBusinessOnRequest: event.target.checked }))} />
            <span>Avisar al negocio cuando llegue una solicitud</span>
          </label>
          <label className="switch-row">
            <input type="checkbox" checked={configForm.notifyCustomerOnConfirmation !== false} onChange={(event) => setConfigForm((current) => ({ ...current, notifyCustomerOnConfirmation: event.target.checked }))} />
            <span>Avisar al cliente cuando se confirme</span>
          </label>
          <label className="switch-row">
            <input type="checkbox" checked={configForm.reminderEnabled === true} onChange={(event) => setConfigForm((current) => ({ ...current, reminderEnabled: event.target.checked }))} />
            <span>Recordatorio antes de la cita</span>
          </label>
          <label>
            <span>Recordar antes de la cita</span>
            <select className="select" value={configForm.reminderMinutesBefore} onChange={(event) => setConfigForm((current) => ({ ...current, reminderMinutesBefore: event.target.value }))}>
              <option value="30">30 minutos antes</option>
              <option value="60">1 hora antes</option>
            </select>
          </label>
          <label className="switch-row">
            <input type="checkbox" checked={configForm.reactivationEnabled === true} onChange={(event) => setConfigForm((current) => ({ ...current, reactivationEnabled: event.target.checked }))} />
            <span>Reactivar clientes sin volver</span>
          </label>
          <label>
            <span>Días sin volver</span>
            <input className="input" type="number" min="7" max="180" value={configForm.reactivationDays} onChange={(event) => setConfigForm((current) => ({ ...current, reactivationDays: event.target.value }))} />
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
            <span>Configura nombre, duración, precio y profesionales asignados.</span>
          </div>
          <div className="booking-editor-form">
            <input className="input" placeholder="Nombre del servicio" value={serviceEditor.name} onChange={(event) => setServiceEditor((current) => ({ ...current, name: event.target.value }))} />
            <textarea className="textarea" rows={4} placeholder="Descripción" value={serviceEditor.description} onChange={(event) => setServiceEditor((current) => ({ ...current, description: event.target.value }))} />
            <label className="upload-card booking-upload-preview">
              <input className="upload-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setServiceEditor((current) => ({ ...current, photoFile: event.target.files?.[0] || null }))} />
              {serviceEditor.photoFile ? (
                <span>{serviceEditor.photoFile.name}</span>
              ) : serviceEditor.photoThumbUrl || serviceEditor.photoUrl ? (
                <>
                  <img src={serviceEditor.photoThumbUrl || serviceEditor.photoUrl} alt={serviceEditor.name || "Servicio"} />
                  <span>Cambiar foto del servicio</span>
                </>
              ) : (
                <span>Subir foto del servicio</span>
              )}
            </label>
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
              const { photoFile, ...payload } = serviceEditor;
              const result = await runAction("save_service", payload, photoFile);
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
            <label className="upload-card booking-upload-preview">
              <input className="upload-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setStaffEditor((current) => ({ ...current, photoFile: event.target.files?.[0] || null }))} />
              {staffEditor.photoFile ? (
                <span>{staffEditor.photoFile.name}</span>
              ) : staffEditor.photoThumbUrl || staffEditor.photoUrl ? (
                <>
                  <img src={staffEditor.photoThumbUrl || staffEditor.photoUrl} alt={staffEditor.name || "Profesional"} />
                  <span>Cambiar foto del profesional</span>
                </>
              ) : (
                <span>Subir foto del profesional</span>
              )}
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

  function renderStaffDeleteReview() {
    if (!staffDeleteReview) return null;
    const { member, appointments: blockers = [] } = staffDeleteReview;

    return (
      <div className="commerce-modal-backdrop" role="dialog" aria-modal="true">
        <div className="commerce-modal-card booking-admin-modal booking-admin-modal-wide">
          <button className="commerce-modal-close" type="button" onClick={() => setStaffDeleteReview(null)}>
            <X size={16} />
          </button>
          <div className="commerce-modal-head">
            <strong>No se puede eliminar a {member.name}</strong>
            <span>Primero resuelve estas solicitudes o citas activas.</span>
          </div>

          <div className="booking-blocker-list">
            {blockers.map((appointment) => (
              <article key={appointment.id} className="booking-blocker-card">
                <div>
                  <strong>{appointment.customerName}</strong>
                  <span>{appointment.serviceNameSnapshot}</span>
                  <small>{appointment.dateTimeLabel} - {appointment.durationLabel}</small>
                </div>
                <BookingStatusBadge statusMeta={appointment.statusMeta} />
                <div className="booking-blocker-actions">
                  <button className="booking-status-action" type="button" onClick={() => {
                    setStaffDeleteReview(null);
                    openAppointmentEditor(appointment);
                  }}>
                    Reprogramar
                  </button>
                  <button className="booking-status-action is-confirm" type="button" onClick={async () => {
                    await runAction("update_appointment_status", { id: appointment.id, status: "completed" }, null, { refresh: false });
                    await refreshStaffDeleteReview();
                  }}>
                    Asistio
                  </button>
                  <button className="booking-status-action is-cancel" type="button" onClick={async () => {
                    await runAction("update_appointment_status", { id: appointment.id, status: "no_show" }, null, { refresh: false });
                    await refreshStaffDeleteReview();
                  }}>
                    No asistio
                  </button>
                  <button className="booking-status-action is-cancel" type="button" onClick={async () => {
                    if (!window.confirm("Cancelar esta cita para poder eliminar el profesional?")) return;
                    await runAction("update_appointment_status", { id: appointment.id, status: "cancelled_by_business" }, null, { refresh: false });
                    await refreshStaffDeleteReview();
                  }}>
                    Cancelar
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="commerce-modal-actions">
            <button className="btn btn-secondary" type="button" onClick={() => setStaffDeleteReview(null)}>Cerrar</button>
            <button className="btn btn-secondary" type="button" onClick={() => refreshStaffDeleteReview()}>Actualizar</button>
          </div>
        </div>
      </div>
    );
  }

  function handleModalServiceSelect(serviceId, nextForm) {
    const selected = services.find((item) => item.id === serviceId) || null;
    const formWithService = { ...nextForm, serviceId };
    if (formWithService.staffId && formWithService.staffId !== "any" && formWithService.appointmentDate && formWithService.startTime) {
      const assigned = selected?.staffIds?.includes(formWithService.staffId)
        ? formWithService.staffId
        : "any";
      setAppointmentModal((current) => current ? {
        ...current,
        form: { ...formWithService, staffId: assigned },
        stepIndex: 4,
      } : current);
      return;
    }

    handleAppointmentFlow({ ...formWithService, staffId: "any", appointmentDate: "", startTime: "" }, 1);
  }

  function renderAppointmentModal() {
    if (!appointmentModal) return null;
    const form = appointmentModal.form;
    const isReschedule = appointmentModal.mode === "reschedule";
    const hasFixedSlot = form.staffId !== "any" && form.appointmentDate && form.startTime && !isReschedule;
    const selectedService = services.find((item) => item.id === form.serviceId) || null;
    const eligibleStaff = staff.filter((item) => selectedService ? item.serviceIds.includes(selectedService.id) : false);

    return (
      <div className="commerce-modal-backdrop" role="dialog" aria-modal="true">
        <div className="commerce-modal-card booking-admin-modal booking-admin-modal-wide">
          <button className="commerce-modal-close" type="button" onClick={() => setAppointmentModal(null)}>
            <X size={16} />
          </button>
          <div className="commerce-modal-head">
            <strong>{isReschedule ? "Reprogramar cita" : "Nueva cita"}</strong>
            <span>{hasFixedSlot ? "Completa servicio y datos del cliente." : "Usa la misma lógica de disponibilidad de la vista pública."}</span>
          </div>
          {hasFixedSlot ? null : <BookingStepper steps={APPOINTMENT_STEPS} activeIndex={appointmentModal.stepIndex} />}

          {appointmentModal.stepIndex === 0 ? (
            <div className="booking-choice-grid">
              {services.filter((item) => item.isActive).map((service) => (
                <BookingServiceCard
                  key={service.id}
                  service={service}
                  selected={form.serviceId === service.id}
                  onClick={() => handleModalServiceSelect(service.id, form)}
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
                const validationError = validateAppointmentForm(form);
                if (validationError) {
                  setError(validationError);
                  return;
                }
                const result = await runAction(isReschedule ? "reschedule_appointment" : "create_appointment", form);
                if (result) setAppointmentModal(null);
              }}>
                <Save size={16} /> {isReschedule ? "Guardar cambio" : "Crear cita"}
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
          <nav className="booking-admin-nav" aria-label="Secciones de agenda">
            {ADMIN_SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  className={`booking-admin-nav-item ${activeSection === section.id ? "is-active" : ""}`.trim()}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                >
                  <Icon size={18} />
                  <span>{section.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="booking-admin-content">
            {renderSectionContent()}
          </div>
        </div>
      )}

      {renderServiceEditor()}
      {renderStaffEditor()}
      {renderStaffDeleteReview()}
      {renderAppointmentModal()}
    </section>
  );
}
