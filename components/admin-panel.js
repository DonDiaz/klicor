"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Building2,
  CalendarClock,
  CreditCard,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Search,
  Settings2,
  Shield,
  Users,
} from "lucide-react";
import { ADMIN_ACCOUNT_STATUS_OPTIONS, ADMIN_ORIGIN_OPTIONS, ADMIN_PLAN_OPTIONS } from "@/lib/admin-config";
import { apiFetch } from "@/lib/client-api";
import { BILLABLE_PLAN_OPTIONS, getPlanPriceSettingKey } from "@/lib/plans";
import { AdminUserDrawer } from "@/components/admin-user-drawer";

const PLAN_PRICE_FIELDS = BILLABLE_PLAN_OPTIONS.map((option) => ({
  ...option,
  key: getPlanPriceSettingKey(option.value),
}));

const ADMIN_SECTIONS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: BarChart3,
    description: "Métricas, estado del negocio y crecimiento.",
  },
  {
    id: "users",
    label: "Gestión de usuarios",
    icon: Users,
    description: "Búsqueda, filtros y acciones por cuenta.",
  },
  {
    id: "billing",
    label: "Facturación y planes",
    icon: CreditCard,
    description: "Precios, trial y mensajes operativos.",
  },
  {
    id: "renewals",
    label: "Renovaciones",
    icon: CalendarClock,
    description: "Cuentas por vencer, vencidas o listas para renovar.",
  },
  {
    id: "partners",
    label: "Convenios y alianzas",
    icon: Building2,
    description: "Base lista para Cámara de Comercio, agencias y convenios.",
  },
  {
    id: "settings",
    label: "Configuración general",
    icon: Settings2,
    description: "Reglas globales y seguridad del panel.",
  },
];

function formatMetricValue(value) {
  return new Intl.NumberFormat("es-CO").format(Number(value || 0));
}

function sortUsers(users = [], sortKey = "created_desc") {
  const list = [...users];

  switch (sortKey) {
    case "created_asc":
      return list.sort((left, right) => Number(left.createdAtMs || 0) - Number(right.createdAtMs || 0));
    case "expires_asc":
      return list.sort((left, right) => {
        const leftValue = Number(left.expiresAtMs || 0) || Number.POSITIVE_INFINITY;
        const rightValue = Number(right.expiresAtMs || 0) || Number.POSITIVE_INFINITY;
        return leftValue - rightValue;
      });
    case "expires_desc":
      return list.sort((left, right) => Number(right.expiresAtMs || 0) - Number(left.expiresAtMs || 0));
    case "status":
      return list.sort((left, right) => String(left.accountStatusLabel || "").localeCompare(String(right.accountStatusLabel || "")));
    case "name":
      return list.sort((left, right) => String(left.businessName || "").localeCompare(String(right.businessName || "")));
    case "created_desc":
    default:
      return list.sort((left, right) => Number(right.createdAtMs || 0) - Number(left.createdAtMs || 0));
  }
}

function matchesRenewalFilter(user, filter) {
  if (filter === "all") return true;
  if (filter === "today") return user.daysToExpiry === 0;
  if (filter === "soon") return Number.isFinite(user.daysToExpiry) && user.daysToExpiry > 0 && user.renewSoon;
  if (filter === "overdue") return ["expired", "pending_payment", "suspended"].includes(user.accountStatus);
  return true;
}

function buildDashboardCards(metrics = {}) {
  return [
    { label: "Usuarios registrados", value: metrics.totalUsers || 0 },
    { label: "En prueba", value: metrics.usersInTrial || 0 },
    { label: "Activos de pago", value: metrics.paidActiveUsers || 0 },
    { label: "Vencidos", value: metrics.expiredUsers || 0 },
    { label: "Por renovar pronto", value: metrics.renewSoonUsers || 0 },
    { label: "Pendientes de pago", value: metrics.pendingPaymentUsers || 0 },
    { label: "Ingresos estimados", value: metrics.estimatedAnnualRevenueLabel || "$0" },
  ];
}

function AdminMetricCard({ label, value, emphasis = false }) {
  return (
    <article className={`admin-metric-card${emphasis ? " is-emphasis" : ""}`}>
      <p>{label}</p>
      <strong>{typeof value === "string" ? value : formatMetricValue(value)}</strong>
    </article>
  );
}

export function AdminPanel({ token, initialData, adminUser }) {
  const [panelData, setPanelData] = useState(initialData);
  const [usersPage, setUsersPage] = useState(initialData?.usersPage || {
    items: initialData?.users || [],
    pageSize: 25,
    nextCursor: "",
    hasNextPage: false,
  });
  const [section, setSection] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    origin: "all",
    accountStatus: "all",
    plan: "all",
    renewal: "all",
    sort: "created_desc",
  });
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [pageSize, setPageSize] = useState(initialData?.usersPage?.pageSize || 25);
  const [cursorStack, setCursorStack] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [settingsForm, setSettingsForm] = useState(initialData?.settings || {});
  const [settingsMessage, setSettingsMessage] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [agencyForm, setAgencyForm] = useState({ email: "", agencyName: "", status: "active" });
  const [agencyMessage, setAgencyMessage] = useState("");
  const [agencyError, setAgencyError] = useState("");
  const [savingAgency, setSavingAgency] = useState(false);
  const filtersReadyRef = useRef(false);

  useEffect(() => {
    setPanelData(initialData);
    setUsersPage(initialData?.usersPage || {
      items: initialData?.users || [],
      pageSize: 25,
      nextCursor: "",
      hasNextPage: false,
    });
    setPageSize(initialData?.usersPage?.pageSize || 25);
    setCursorStack([]);
    setSettingsForm(initialData?.settings || {});
  }, [initialData]);

  function buildPanelUrl(cursor = "") {
    const params = new URLSearchParams({
      pageSize: String(pageSize),
      search: filters.search,
      origin: filters.origin,
      accountStatus: filters.accountStatus,
      plan: filters.plan,
      renewal: filters.renewal,
      sort: filters.sort,
    });
    if (cursor) params.set("cursor", cursor);
    return `/api/admin/panel?${params.toString()}`;
  }

  async function refreshPanel(keepUserUid = selectedDetail?.user?.uid || "", cursor = cursorStack[cursorStack.length - 1] || "") {
    try {
      setRefreshing(true);
      const nextPanel = await apiFetch(buildPanelUrl(cursor), { token });
      setPanelData(nextPanel);
      setUsersPage(nextPanel.usersPage || {
        items: nextPanel.users || [],
        pageSize,
        nextCursor: "",
        hasNextPage: false,
      });
      setSettingsForm(nextPanel.settings);

      if (keepUserUid) {
        const detail = await apiFetch(`/api/admin/users/${keepUserUid}`, { token });
        setSelectedDetail(detail);
      }
    } finally {
      setRefreshing(false);
    }
  }

  async function loadUsersPage(cursor = "", nextCursorStack = cursorStack) {
    try {
      setUsersLoading(true);
      const nextPanel = await apiFetch(buildPanelUrl(cursor), { token });
      setPanelData(nextPanel);
      setUsersPage(nextPanel.usersPage || {
        items: nextPanel.users || [],
        pageSize,
        nextCursor: "",
        hasNextPage: false,
      });
      setSettingsForm(nextPanel.settings);
      setCursorStack(nextCursorStack);
    } finally {
      setUsersLoading(false);
    }
  }

  useEffect(() => {
    if (!filtersReadyRef.current) {
      filtersReadyRef.current = true;
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setCursorStack([]);
      loadUsersPage("", []);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [filters, pageSize]);

  async function openUser(uid) {
    try {
      setDrawerLoading(true);
      const detail = await apiFetch(`/api/admin/users/${uid}`, { token });
      setSelectedDetail(detail);
    } finally {
      setDrawerLoading(false);
    }
  }

  async function saveSettings() {
    try {
      setSavingSettings(true);
      setSettingsError("");
      setSettingsMessage("");
      const response = await apiFetch("/api/admin/settings", {
        method: "PATCH",
        token,
        body: settingsForm,
      });
      setSettingsForm(response.settings);
      setSettingsMessage("Configuración actualizada.");
      await refreshPanel(selectedDetail?.user?.uid || "");
    } catch (error) {
      setSettingsError(error.message);
    } finally {
      setSavingSettings(false);
    }
  }

  async function saveAgency(event) {
    event.preventDefault();
    try {
      setSavingAgency(true);
      setAgencyError("");
      setAgencyMessage("");
      const response = await apiFetch("/api/admin/agencies", {
        method: "POST",
        token,
        body: agencyForm,
      });
      setPanelData((current) => ({
        ...current,
        agencies: response.agencies || [],
      }));
      setAgencyForm({ email: "", agencyName: "", status: "active" });
      setAgencyMessage("Agencia guardada.");
    } catch (error) {
      setAgencyError(error.message);
    } finally {
      setSavingAgency(false);
    }
  }

  function updatePlanPrice(planValue, value) {
    const key = getPlanPriceSettingKey(planValue);
    const amount = Number(value);
    setSettingsForm((current) => ({
      ...current,
      [key]: amount,
      ...(planValue === "commercial" ? { annualPrice: amount } : {}),
    }));
  }

  const filteredUsers = usersPage?.items || [];
  const currentPageNumber = cursorStack.length + 1;

  const dashboardCards = buildDashboardCards(panelData?.metrics);
  const dueToday = panelData?.renewalBuckets?.dueToday || [];
  const dueSoon = panelData?.renewalBuckets?.dueSoon || [];
  const overdue = panelData?.renewalBuckets?.overdue || [];

  return (
    <div className={`admin-layout${sidebarCollapsed ? " is-sidebar-collapsed" : ""}`}>
      <aside className="admin-sidebar">
        <div className="admin-sidebar-head">
          <button
            className="admin-sidebar-toggle"
            type="button"
            onClick={() => setSidebarCollapsed((current) => !current)}
            aria-label={sidebarCollapsed ? "Expandir menú" : "Ocultar menú"}
            title={sidebarCollapsed ? "Expandir menú" : "Ocultar menú"}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
          <span className="pill">Administración</span>
          <div>
            <h3>Panel de Klicor</h3>
            <p className="muted">Control total de usuarios, precios y vencimientos.</p>
          </div>
        </div>

        <nav className="admin-nav">
          {ADMIN_SECTIONS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`admin-nav-item${section === item.id ? " is-active" : ""}`}
                type="button"
                onClick={() => setSection(item.id)}
                aria-label={item.label}
                title={item.label}
              >
                <Icon size={18} />
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="admin-sidebar-note">
          <Shield size={18} />
          <div>
            <strong>{adminUser?.email || "Administrador"}</strong>
            <p className="muted">Solo cuentas con rol admin pueden entrar aquí.</p>
          </div>
        </div>
      </aside>

      <div className="admin-main stack">
        <div className="topbar">
          <div>
            <span className="pill">Fase 1</span>
            <h1 style={{ margin: ".6rem 0 .25rem" }}>Panel administrativo completo</h1>
            <p className="muted">Usuarios, estado de cuenta, origen, vencimientos y configuración central del producto.</p>
          </div>
          <div className="actions">
            <button className="btn btn-secondary" type="button" onClick={() => refreshPanel()} disabled={refreshing}>
              {refreshing ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />}
              Actualizar
            </button>
          </div>
        </div>

        {section === "dashboard" ? (
          <section className="section-stack">
            <div className="admin-metric-grid">
              {dashboardCards.map((card, index) => (
                <AdminMetricCard key={card.label} label={card.label} value={card.value} emphasis={index === 6} />
              ))}
            </div>

            <div className="admin-analytics-grid">
              <section className="panel admin-analytics-card">
                <div className="admin-section-heading">
                  <h3>Usuarios por origen</h3>
                  <p className="muted">Seguimiento de crecimiento orgánico y aliados.</p>
                </div>
                <div className="admin-bar-list">
                  {(panelData?.metrics?.byOrigin || []).map((item) => (
                    <div key={item.key} className="admin-bar-row">
                      <div>
                        <strong>{item.label}</strong>
                        <small>{formatMetricValue(item.total)} usuarios</small>
                      </div>
                      <div className="admin-bar-track">
                        <span style={{ width: `${Math.max(8, ((item.total || 0) / Math.max(panelData?.metrics?.totalUsers || 1, 1)) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel admin-analytics-card">
                <div className="admin-section-heading">
                  <h3>Usuarios por estado</h3>
                  <p className="muted">Panorama actual de trials, activas y cuentas por renovar.</p>
                </div>
                <div className="admin-bar-list">
                  {(panelData?.metrics?.byStatus || []).map((item) => (
                    <div key={item.key} className="admin-bar-row">
                      <div>
                        <strong>{item.label}</strong>
                        <small>{formatMetricValue(item.total)} cuentas</small>
                      </div>
                      <div className="admin-bar-track">
                        <span style={{ width: `${Math.max(8, ((item.total || 0) / Math.max(panelData?.metrics?.totalUsers || 1, 1)) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <section className="panel admin-analytics-card">
              <div className="admin-section-heading">
                <h3>Crecimiento reciente</h3>
                <p className="muted">Nuevos negocios registrados por mes.</p>
              </div>
              <div className="admin-growth-grid">
                {(panelData?.metrics?.monthlyGrowth || []).map((item) => (
                  <div key={item.key} className="admin-growth-card">
                    <span>{item.label}</span>
                    <strong>{formatMetricValue(item.total)}</strong>
                  </div>
                ))}
              </div>
            </section>
          </section>
        ) : null}

        {section === "users" ? (
          <section className="section-stack">
            <section className="panel admin-filters-panel">
              <div className="admin-filter-row">
                <label className="admin-search">
                  <Search size={16} />
                  <input
                    className="input"
                    placeholder="Buscar por negocio, email, responsable o teléfono"
                    value={filters.search}
                    onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                  />
                </label>
                <div className="admin-inline-filters">
                  <div>
                    <label className="label">Origen</label>
                    <select className="select" value={filters.origin} onChange={(event) => setFilters((current) => ({ ...current, origin: event.target.value }))}>
                      <option value="all">Todos</option>
                      {ADMIN_ORIGIN_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Estado</label>
                    <select className="select" value={filters.accountStatus} onChange={(event) => setFilters((current) => ({ ...current, accountStatus: event.target.value }))}>
                      <option value="all">Todos</option>
                      {ADMIN_ACCOUNT_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Plan</label>
                    <select className="select" value={filters.plan} onChange={(event) => setFilters((current) => ({ ...current, plan: event.target.value }))}>
                      <option value="all">Todos</option>
                      {ADMIN_PLAN_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Vencimiento</label>
                    <select className="select" value={filters.renewal} onChange={(event) => setFilters((current) => ({ ...current, renewal: event.target.value }))}>
                      <option value="all">Todos</option>
                      <option value="today">Vencen hoy</option>
                      <option value="soon">Próximos a vencer</option>
                      <option value="overdue">Pendientes / vencidos</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Orden</label>
                    <select className="select" value={filters.sort} onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value }))}>
                      <option value="created_desc">Registro más reciente</option>
                      <option value="created_asc">Registro más antiguo</option>
                      <option value="expires_asc">Vence primero</option>
                      <option value="expires_desc">Vence después</option>
                      <option value="status">Estado</option>
                      <option value="name">Nombre del negocio</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Filas</label>
                    <select className="select" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>

            <section className="panel admin-table-panel">
              <div className="admin-section-heading admin-table-heading">
                <div>
                  <h3>Usuarios y negocios</h3>
                  <p className="muted">
                    Página {currentPageNumber} · {filteredUsers.length} de {usersPage?.pageSize || pageSize} filas cargadas.
                  </p>
                </div>
                <div className="actions">
                  <button
                    className="btn btn-secondary"
                    type="button"
                    disabled={usersLoading || !cursorStack.length}
                    onClick={() => {
                      const nextStack = cursorStack.slice(0, -1);
                      const previousCursor = nextStack[nextStack.length - 1] || "";
                      loadUsersPage(previousCursor, nextStack);
                    }}
                  >
                    Anterior
                  </button>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    disabled={usersLoading || !usersPage?.hasNextPage}
                    onClick={() => {
                      const nextCursor = usersPage?.nextCursor || "";
                      if (!nextCursor) return;
                      loadUsersPage(nextCursor, [...cursorStack, nextCursor]);
                    }}
                  >
                    Siguiente
                  </button>
                </div>
              </div>

              {usersLoading ? <p className="notice">Cargando negocios...</p> : null}

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Negocio</th>
                      <th>Responsable</th>
                      <th>Email</th>
                      <th>Teléfono</th>
                      <th>Ciudad</th>
                      <th>Tipo</th>
                      <th>Origen</th>
                      <th>Convenio</th>
                      <th>Estado</th>
                      <th>Plan</th>
                      <th>Registro</th>
                      <th>Inicio</th>
                      <th>Vencimiento</th>
                      <th>Último pago</th>
                      <th>Valor pagado</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.uid}>
                        <td>
                          <div className="admin-table-business">
                            <div className="admin-mini-avatar">
                              {user.photo ? <img src={user.photo} alt={user.businessName} /> : <span>{user.businessName?.slice(0, 1) || "K"}</span>}
                            </div>
                            <div>
                              <strong>{user.businessName}</strong>
                              <small className="admin-table-link" title={user.publicUrl}>{user.publicUrl}</small>
                            </div>
                          </div>
                        </td>
                        <td>{user.ownerName || "-"}</td>
                        <td>{user.email}</td>
                        <td>{user.phone || "-"}</td>
                        <td>{user.city || "-"}</td>
                        <td>{user.businessTypeLabel}</td>
                        <td>{user.originLabel}</td>
                        <td>{user.partnerId || "-"}</td>
                        <td><span className={`status-badge ${user.accountStatusTone || ""}`}>{user.accountStatusLabel}</span></td>
                        <td>{user.planLabel}</td>
                        <td>{user.createdAtLabel}</td>
                        <td>{user.startsAtLabel}</td>
                        <td>{user.expiresAtLabel}</td>
                        <td>{user.lastPaymentAtLabel}</td>
                        <td>{user.amountPaidLabel}</td>
                        <td>
                          <button className="btn btn-secondary" type="button" onClick={() => openUser(user.uid)}>
                            Gestionar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!filteredUsers.length ? (
                <p className="notice" style={{ marginTop: "1rem" }}>
                  No hay usuarios que coincidan con los filtros actuales.
                </p>
              ) : null}
            </section>
          </section>
        ) : null}

        {section === "billing" ? (
          <section className="section-stack">
            <section className="panel admin-settings-panel">
              <div className="admin-section-heading">
                <h3>Facturación y planes</h3>
                <p className="muted">Controla precios de lanzamiento, trial, mensajes de vencimiento y reglas de renovación.</p>
              </div>

              <div className="form-grid">
                {PLAN_PRICE_FIELDS.map((plan) => (
                  <div key={plan.value}>
                    <label className="label">Plan {plan.label} (COP/año)</label>
                    <input className="input" type="number" min={0} value={settingsForm[plan.key] ?? 0} onChange={(event) => updatePlanPrice(plan.value, event.target.value)} />
                  </div>
                ))}
                <div>
                  <label className="label">Días de trial</label>
                  <input className="input" type="number" min={0} value={settingsForm.trialDays || 0} onChange={(event) => setSettingsForm((current) => ({ ...current, trialDays: Number(event.target.value) }))} />
                </div>
                <div>
                  <label className="label">Aviso antes de vencer (días)</label>
                  <input className="input" type="number" min={0} value={settingsForm.renewalAlertDays || 0} onChange={(event) => setSettingsForm((current) => ({ ...current, renewalAlertDays: Number(event.target.value) }))} />
                </div>
                <div>
                  <label className="label">Modo de renovación</label>
                  <select className="select" value={settingsForm.renewalMode || "manual"} onChange={(event) => setSettingsForm((current) => ({ ...current, renewalMode: event.target.value }))}>
                    <option value="manual">Manual</option>
                    <option value="automatic">Automática</option>
                  </select>
                </div>
                <div>
                  <label className="label">Días por convenio institucional</label>
                  <input className="input" type="number" min={1} value={settingsForm.convenioDefaultDays || 365} onChange={(event) => setSettingsForm((current) => ({ ...current, convenioDefaultDays: Number(event.target.value) }))} />
                </div>
                <div>
                  <label className="label">Precio especial para agencias</label>
                  <input className="input" type="number" min={0} value={settingsForm.agencyAnnualPrice || 0} onChange={(event) => setSettingsForm((current) => ({ ...current, agencyAnnualPrice: Number(event.target.value) }))} />
                </div>
                <div>
                  <label className="label">Valor por defecto convenios</label>
                  <input className="input" type="number" min={0} value={settingsForm.partnerDefaultPrice || 0} onChange={(event) => setSettingsForm((current) => ({ ...current, partnerDefaultPrice: Number(event.target.value) }))} />
                </div>
              </div>

              <div className="form-grid" style={{ marginTop: "1rem" }}>
                <div>
                  <label className="label">Mensaje al vencer trial</label>
                  <textarea className="textarea" rows={4} value={settingsForm.trialExpiredMessage || ""} onChange={(event) => setSettingsForm((current) => ({ ...current, trialExpiredMessage: event.target.value }))} />
                </div>
                <div>
                  <label className="label">Mensaje al vencer plan pago</label>
                  <textarea className="textarea" rows={4} value={settingsForm.paidExpiredMessage || ""} onChange={(event) => setSettingsForm((current) => ({ ...current, paidExpiredMessage: event.target.value }))} />
                </div>
              </div>

              <div className="actions" style={{ marginTop: "1rem" }}>
                <button className="btn btn-primary" type="button" onClick={saveSettings} disabled={savingSettings}>
                  {savingSettings ? <Loader2 size={16} className="spin" /> : <CreditCard size={16} />}
                  Guardar configuración
                </button>
              </div>

              {settingsMessage ? <p className="notice" style={{ marginTop: "1rem" }}>{settingsMessage}</p> : null}
              {settingsError ? <p className="notice notice-danger" style={{ marginTop: "1rem" }}>{settingsError}</p> : null}
            </section>
          </section>
        ) : null}

        {section === "renewals" ? (
          <section className="admin-renewals-grid">
            <section className="panel admin-renewal-card">
              <div className="admin-section-heading">
                <h3>Vencen hoy</h3>
                <p className="muted">Usuarios que requieren atención inmediata.</p>
              </div>
              <div className="admin-renewal-list">
                {dueToday.length ? dueToday.map((user) => (
                  <button key={user.uid} type="button" className="admin-renewal-item" onClick={() => openUser(user.uid)}>
                    <strong>{user.businessName}</strong>
                    <span>{user.planLabel} · {user.expiresAtLabel}</span>
                  </button>
                )) : <p className="muted">Sin vencimientos hoy.</p>}
              </div>
            </section>

            <section className="panel admin-renewal-card">
              <div className="admin-section-heading">
                <h3>Próximos a vencer</h3>
                <p className="muted">Cuentas dentro de la ventana de alerta.</p>
              </div>
              <div className="admin-renewal-list">
                {dueSoon.length ? dueSoon.map((user) => (
                  <button key={user.uid} type="button" className="admin-renewal-item" onClick={() => openUser(user.uid)}>
                    <strong>{user.businessName}</strong>
                    <span>{user.daysToExpiry} días · {user.planLabel}</span>
                  </button>
                )) : <p className="muted">No hay renovaciones cercanas.</p>}
              </div>
            </section>

            <section className="panel admin-renewal-card">
              <div className="admin-section-heading">
                <h3>Pendientes o vencidos</h3>
                <p className="muted">Lista para renovación manual o reactivación.</p>
              </div>
              <div className="admin-renewal-list">
                {overdue.length ? overdue.map((user) => (
                  <button key={user.uid} type="button" className="admin-renewal-item" onClick={() => openUser(user.uid)}>
                    <strong>{user.businessName}</strong>
                    <span>{user.accountStatusLabel} · {user.planLabel}</span>
                  </button>
                )) : <p className="muted">No hay cuentas pendientes.</p>}
              </div>
            </section>
          </section>
        ) : null}

        {section === "partners" ? (
          <section className="section-stack">
            <section className="panel admin-placeholder-card">
              <div className="admin-section-heading">
                <h3>Convenios y alianzas</h3>
                <p className="muted">La estructura base ya quedó lista en usuarios con `origin` y `partnerId`.</p>
              </div>
              <form className="admin-agency-form" onSubmit={saveAgency}>
                <div>
                  <label className="label">Correo autorizado</label>
                  <input
                    className="input"
                    type="email"
                    value={agencyForm.email}
                    onChange={(event) => setAgencyForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="agencia@dominio.com"
                    required
                  />
                </div>
                <div>
                  <label className="label">Nombre agencia</label>
                  <input
                    className="input"
                    value={agencyForm.agencyName}
                    onChange={(event) => setAgencyForm((current) => ({ ...current, agencyName: event.target.value }))}
                    placeholder="Nombre comercial"
                  />
                </div>
                <div>
                  <label className="label">Estado</label>
                  <select className="select" value={agencyForm.status} onChange={(event) => setAgencyForm((current) => ({ ...current, status: event.target.value }))}>
                    <option value="active">Activa</option>
                    <option value="inactive">Inactiva</option>
                  </select>
                </div>
                <button className="btn btn-primary" type="submit" disabled={savingAgency}>
                  {savingAgency ? "Guardando..." : "Habilitar agencia"}
                </button>
              </form>
              {agencyMessage ? <p className="notice notice-success">{agencyMessage}</p> : null}
              {agencyError ? <p className="notice notice-danger">{agencyError}</p> : null}
              <div className="admin-agency-list">
                {(panelData.agencies || []).length ? panelData.agencies.map((agency) => (
                  <article className="admin-agency-item" key={agency.id}>
                    <div>
                      <strong>{agency.agencyName}</strong>
                      <span>{agency.email}</span>
                    </div>
                    <span className={`status-badge ${agency.status === "active" ? "success" : ""}`}>{agency.status}</span>
                    <button className="btn btn-secondary" type="button" onClick={() => setAgencyForm({ email: agency.email, agencyName: agency.agencyName, status: agency.status })}>
                      Editar
                    </button>
                  </article>
                )) : <p className="muted">Todavía no hay agencias habilitadas.</p>}
              </div>
              <div className="admin-placeholder-grid">
                <article className="admin-placeholder-item">
                  <strong>Aliados preparados</strong>
                  <p className="muted">Agencias, Cámara de Comercio, Secretaría TIC y convenios institucionales.</p>
                </article>
                <article className="admin-placeholder-item">
                  <strong>Base operativa actual</strong>
                  <p className="muted">Ya puedes filtrar usuarios por origen y asignar convenio desde el detalle individual.</p>
                </article>
                <article className="admin-placeholder-item">
                  <strong>Siguiente fase</strong>
                  <p className="muted">Creación de convenios, precios negociados, cupos e importación masiva desde CSV o Excel.</p>
                </article>
              </div>
            </section>
          </section>
        ) : null}

        {section === "settings" ? (
          <section className="section-stack">
            <section className="panel admin-placeholder-card">
              <div className="admin-section-heading">
                <h3>Configuración general</h3>
                <p className="muted">Resumen operativo y de seguridad del sistema administrativo.</p>
              </div>
              <div className="admin-placeholder-grid">
                <article className="admin-placeholder-item">
                  <strong>Acceso protegido</strong>
                  <p className="muted">El panel valida rol administrador y bloquea acceso a usuarios normales.</p>
                </article>
                <article className="admin-placeholder-item">
                  <strong>Bitácora básica</strong>
                  <p className="muted">Quedan registradas acciones como cambios de precio, pagos manuales y ajustes de acceso.</p>
                </article>
                <article className="admin-placeholder-item">
                  <strong>Escalabilidad</strong>
                  <p className="muted">La Fase 1 deja lista la base para convenios, importaciones y automatizaciones posteriores.</p>
                </article>
              </div>
            </section>
          </section>
        ) : null}
      </div>

      {drawerLoading ? (
        <div className="admin-drawer-loading">
          <Loader2 size={18} className="spin" />
          <span>Cargando detalle del usuario…</span>
        </div>
      ) : null}

      {selectedDetail ? (
        <AdminUserDrawer
          token={token}
          detail={selectedDetail}
          settings={panelData?.settings || {}}
          onClose={() => setSelectedDetail(null)}
          onUpdated={async (updatedDetail) => {
            setSelectedDetail(updatedDetail);
            await refreshPanel(updatedDetail?.user?.uid || "");
          }}
          onDeleted={async () => {
            setSelectedDetail(null);
            await refreshPanel();
          }}
        />
      ) : null}
    </div>
  );
}
