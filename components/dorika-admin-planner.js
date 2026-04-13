"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Database,
  ImagePlus,
  Loader2,
  Map,
  MapPin,
  Plus,
  RefreshCw,
  Route,
  Search,
} from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import { dorikaAdminStops, dorikaAdminSummary, dorikaMapPins } from "@/lib/dorika-demo-data";

const DEFAULT_PLACE_FORM = {
  name: "",
  type: "Sitio turístico",
  category: "tourism",
  location: "",
  city: "",
  description: "",
  image: "",
  status: "draft",
};

const DEFAULT_ROUTE_FORM = {
  title: "",
  location: "",
  duration: "Medio día",
  mood: "",
  image: "",
  status: "draft",
  stopsText: "",
};

function resolveStatusLabel(status = "") {
  if (status === "published") return "Publicado";
  if (status === "review") return "Revisión";
  if (status === "hidden") return "Oculto";
  return "Borrador";
}

function DorikaAdminMap({ pins = dorikaMapPins }) {
  const safePins = pins.length ? pins.slice(0, 5) : dorikaMapPins.slice(0, 5);

  return (
    <div className="dorika-admin-map" aria-label="Mapa de edición Dorika">
      <span className="dorika-admin-map-route" />
      {safePins.map((pin, index) => (
        <button
          key={pin.id}
          className="dorika-admin-map-pin"
          type="button"
          style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
          aria-label={pin.label}
        >
          <small>{index + 1}</small>
          <MapPin size={14} />
        </button>
      ))}
    </div>
  );
}

function DorikaAdminList({ title, emptyText, items = [], renderItem }) {
  return (
    <div className="dorika-admin-live-list">
      <strong>{title}</strong>
      {items.length ? (
        <div>
          {items.map(renderItem)}
        </div>
      ) : (
        <p>{emptyText}</p>
      )}
    </div>
  );
}

export function DorikaAdminPlanner({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [placeForm, setPlaceForm] = useState(DEFAULT_PLACE_FORM);
  const [routeForm, setRouteForm] = useState(DEFAULT_ROUTE_FORM);

  const metrics = data?.metrics?.length ? data.metrics : dorikaAdminSummary;
  const stops = data?.adminStops?.length ? data.adminStops : dorikaAdminStops;
  const mapPins = data?.mapPins?.length ? data.mapPins : dorikaMapPins;
  const places = data?.places || [];
  const routes = data?.routes || [];
  const klicorBusinesses = data?.klicorBusinesses || [];
  const products = data?.products || [];

  const publishedPlaces = useMemo(
    () => places.filter((place) => place.status === "published").length,
    [places],
  );

  async function loadDorika({ silent = false } = {}) {
    if (!token) return;
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError("");
      const snapshot = await apiFetch("/api/admin/dorika", { token });
      setData(snapshot);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDorika();
  }, [token]);

  async function submitPlace(event) {
    event.preventDefault();
    try {
      setSaving("place");
      setError("");
      setMessage("");
      const response = await apiFetch("/api/admin/dorika", {
        token,
        method: "POST",
        body: {
          action: "create_place",
          payload: placeForm,
        },
      });
      setData(response.snapshot);
      setPlaceForm(DEFAULT_PLACE_FORM);
      setMessage("Lugar guardado en Dorika.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving("");
    }
  }

  async function submitRoute(event) {
    event.preventDefault();
    try {
      setSaving("route");
      setError("");
      setMessage("");
      const stopsPayload = routeForm.stopsText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => ({ name: line, type: "Parada", status: "Pendiente" }));

      const response = await apiFetch("/api/admin/dorika", {
        token,
        method: "POST",
        body: {
          action: "create_route",
          payload: {
            ...routeForm,
            stops: stopsPayload,
          },
        },
      });
      setData(response.snapshot);
      setRouteForm(DEFAULT_ROUTE_FORM);
      setMessage("Ruta guardada en Dorika.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving("");
    }
  }

  return (
    <section className="dorika-admin-panel">
      <div className="dorika-admin-hero">
        <div>
          <span>Nuevo ecosistema</span>
          <h2>Dorika</h2>
          <p>Administra negocios visibles, sitios turísticos, rutas y productos conectados desde Klicor.</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => loadDorika({ silent: true })} disabled={refreshing}>
          {refreshing ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />} Actualizar
        </button>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}

      {loading ? (
        <div className="panel dorika-admin-loading">
          <Loader2 className="spin" size={18} />
          Cargando Dorika...
        </div>
      ) : null}

      <div className="dorika-admin-metrics">
        {metrics.map((item) => (
          <article key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </div>

      <div className="dorika-admin-grid">
        <section className="panel dorika-admin-card">
          <div className="admin-section-heading">
            <h3>Cargar sitio turístico</h3>
            <p className="muted">Guarda lugares para publicarlos en la guía pública cuando estén listos.</p>
          </div>
          <form className="dorika-admin-form" onSubmit={submitPlace}>
            <label>
              <span>Nombre del lugar</span>
              <input className="input" value={placeForm.name} onChange={(event) => setPlaceForm({ ...placeForm, name: event.target.value })} placeholder="Ej. Mirador Las Brisas" />
            </label>
            <label>
              <span>Ciudad o zona</span>
              <input className="input" value={placeForm.location} onChange={(event) => setPlaceForm({ ...placeForm, location: event.target.value })} placeholder="Ej. Salento, Quindío" />
            </label>
            <label>
              <span>Categoría Dorika</span>
              <select className="input" value={placeForm.category} onChange={(event) => setPlaceForm({ ...placeForm, category: event.target.value })}>
                <option value="tourism">Turismo</option>
                <option value="hotels">Hoteles</option>
                <option value="restaurants">Restaurantes</option>
                <option value="stores">Tiendas</option>
                <option value="beauty">Belleza</option>
              </select>
            </label>
            <label>
              <span>Estado</span>
              <select className="input" value={placeForm.status} onChange={(event) => setPlaceForm({ ...placeForm, status: event.target.value })}>
                <option value="draft">Borrador</option>
                <option value="review">Revisión</option>
                <option value="published">Publicado</option>
              </select>
            </label>
            <label>
              <span>Descripción humana</span>
              <textarea className="textarea" rows={4} value={placeForm.description} onChange={(event) => setPlaceForm({ ...placeForm, description: event.target.value })} placeholder="Qué se vive aquí, para quién es ideal y qué debe saber la persona." />
            </label>
            <label>
              <span>Imagen portada</span>
              <input className="input" value={placeForm.image} onChange={(event) => setPlaceForm({ ...placeForm, image: event.target.value })} placeholder="URL de imagen por ahora" />
            </label>
            <button className="dorika-upload-box" type="submit" disabled={saving === "place"}>
              {saving === "place" ? <Loader2 size={18} className="spin" /> : <ImagePlus size={18} />}
              Guardar lugar
            </button>
          </form>
        </section>

        <section className="panel dorika-admin-card">
          <div className="admin-section-heading">
            <h3>Constructor de ruta</h3>
            <p className="muted">Crea rutas sencillas con paradas ordenadas para publicarlas cuando estén listas.</p>
          </div>
          <form className="dorika-admin-form" onSubmit={submitRoute}>
            <label>
              <span>Nombre de la ruta</span>
              <input className="input" value={routeForm.title} onChange={(event) => setRouteForm({ ...routeForm, title: event.target.value })} placeholder="Ej. Ruta de sabores locales" />
            </label>
            <label>
              <span>Zona</span>
              <input className="input" value={routeForm.location} onChange={(event) => setRouteForm({ ...routeForm, location: event.target.value })} placeholder="Ej. Centro y mirador" />
            </label>
            <label>
              <span>Duración</span>
              <input className="input" value={routeForm.duration} onChange={(event) => setRouteForm({ ...routeForm, duration: event.target.value })} placeholder="Ej. 3 horas" />
            </label>
            <label>
              <span>Intención de la ruta</span>
              <input className="input" value={routeForm.mood} onChange={(event) => setRouteForm({ ...routeForm, mood: event.target.value })} placeholder="Ej. Comer, caminar y descubrir" />
            </label>
            <label>
              <span>Paradas</span>
              <textarea className="textarea" rows={5} value={routeForm.stopsText} onChange={(event) => setRouteForm({ ...routeForm, stopsText: event.target.value })} placeholder={"Una parada por línea\nCafé Río Claro\nMirador Las Brisas"} />
            </label>
            <label>
              <span>Estado</span>
              <select className="input" value={routeForm.status} onChange={(event) => setRouteForm({ ...routeForm, status: event.target.value })}>
                <option value="draft">Borrador</option>
                <option value="review">Revisión</option>
                <option value="published">Publicado</option>
              </select>
            </label>
            <button className="btn btn-primary" type="submit" disabled={saving === "route"}>
              {saving === "route" ? <Loader2 size={16} className="spin" /> : <Plus size={16} />} Crear ruta
            </button>
          </form>
        </section>

        <section className="panel dorika-admin-card">
          <div className="admin-section-heading">
            <h3>Mapa personalizado</h3>
            <p className="muted">Primer mapa visual con puntos reales de negocios y lugares publicados.</p>
          </div>
          <DorikaAdminMap pins={mapPins} />
        </section>

        <section className="panel dorika-admin-card">
          <div className="admin-section-heading">
            <h3>Publicación Dorika</h3>
            <p className="muted">Control editorial antes de mostrar rutas y lugares en la guía pública.</p>
          </div>
          <div className="dorika-admin-checklist">
            <p><CheckCircle2 size={16} /> {klicorBusinesses.length} negocios Klicor conectados</p>
            <p><MapPin size={16} /> {publishedPlaces} lugares publicados</p>
            <p><Route size={16} /> {routes.length} rutas creadas</p>
            <p><Search size={16} /> {products.length} productos destacados</p>
            <p><Database size={16} /> Datos organizados para crecer</p>
            <p><Map size={16} /> Mapa listo para conectar</p>
          </div>
        </section>

        <section className="panel dorika-admin-card">
          <DorikaAdminList
            title="Negocios Klicor en Dorika"
            emptyText="Aún no hay negocios con perfil público listo."
            items={klicorBusinesses.slice(0, 8)}
            renderItem={(business) => (
              <article key={business.id}>
                <img src={business.image} alt="" loading="lazy" decoding="async" />
                <div>
                  <strong>{business.name}</strong>
                  <small>{business.type} · {business.location}</small>
                </div>
                <em>{business.cta}</em>
              </article>
            )}
          />
        </section>

        <section className="panel dorika-admin-card">
          <DorikaAdminList
            title="Rutas y lugares"
            emptyText="Crea el primer lugar o ruta para empezar la curaduría."
            items={[
              ...places.slice(0, 4).map((place) => ({ id: place.id, name: place.name, meta: `${place.type} · ${place.location}`, status: place.status, image: place.image })),
              ...routes.slice(0, 4).map((route) => ({ id: route.id, name: route.title, meta: `${route.location} · ${route.duration}`, status: route.status, image: route.image })),
            ].slice(0, 8)}
            renderItem={(item) => (
              <article key={item.id}>
                <img src={item.image} alt="" loading="lazy" decoding="async" />
                <div>
                  <strong>{item.name}</strong>
                  <small>{item.meta}</small>
                </div>
                <em>{resolveStatusLabel(item.status)}</em>
              </article>
            )}
          />
        </section>

        <section className="panel dorika-admin-card">
          <div className="admin-section-heading">
            <h3>Paradas sugeridas</h3>
            <p className="muted">Punto de partida para ordenar rutas con intención.</p>
          </div>
          <div className="dorika-route-builder">
            {stops.map((stop) => (
              <article key={stop.id}>
                <span>{stop.order}</span>
                <div>
                  <strong>{stop.name}</strong>
                  <small>{stop.type}</small>
                </div>
                <em>{stop.status}</em>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
