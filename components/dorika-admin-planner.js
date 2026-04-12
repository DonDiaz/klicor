"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Database,
  ImagePlus,
  Map,
  MapPin,
  Plus,
  Route,
  Search,
} from "lucide-react";
import { dorikaAdminStops, dorikaAdminSummary, dorikaMapPins } from "@/lib/dorika-demo-data";

function DorikaAdminMap() {
  return (
    <div className="dorika-admin-map" aria-label="Mapa de edición Dorika">
      <span className="dorika-admin-map-route" />
      {dorikaMapPins.slice(0, 4).map((pin, index) => {
        const Icon = pin.icon;
        return (
          <button
            key={pin.id}
            className="dorika-admin-map-pin"
            type="button"
            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
            aria-label={pin.label}
          >
            <small>{index + 1}</small>
            <Icon size={14} />
          </button>
        );
      })}
    </div>
  );
}

export function DorikaAdminPlanner() {
  const [status, setStatus] = useState("draft");

  return (
    <section className="dorika-admin-panel">
      <div className="dorika-admin-hero">
        <div>
          <span>Nuevo ecosistema</span>
          <h2>Dorika</h2>
          <p>Administra negocios visibles, sitios turísticos, rutas y productos conectados desde Klicor.</p>
        </div>
        <button className="btn btn-primary" type="button">
          <Plus size={16} /> Crear ruta
        </button>
      </div>

      <div className="dorika-admin-metrics">
        {dorikaAdminSummary.map((item) => (
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
            <p className="muted">Base lista para guardar foto, ciudad, coordenadas, categoría y estado de revisión.</p>
          </div>
          <div className="dorika-admin-form">
            <label>
              <span>Nombre del lugar</span>
              <input className="input" placeholder="Ej. Mirador Las Brisas" />
            </label>
            <label>
              <span>Ciudad o zona</span>
              <input className="input" placeholder="Ej. Salento, Quindío" />
            </label>
            <label>
              <span>Descripción humana</span>
              <textarea className="textarea" rows={4} placeholder="Qué se vive aquí, para quién es ideal y qué debe saber la persona." />
            </label>
            <button className="dorika-upload-box" type="button">
              <ImagePlus size={18} />
              Subir portada y galería
            </button>
          </div>
        </section>

        <section className="panel dorika-admin-card">
          <div className="admin-section-heading">
            <h3>Constructor de ruta</h3>
            <p className="muted">Ordena paradas, conecta negocios Klicor y revisa el mapa antes de publicar.</p>
          </div>
          <div className="dorika-route-builder">
            {dorikaAdminStops.map((stop) => (
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

        <section className="panel dorika-admin-card">
          <div className="admin-section-heading">
            <h3>Mapa personalizado</h3>
            <p className="muted">La UI queda lista para puntos, rutas, cercanía y filtros en un mapa propio de Dorika.</p>
          </div>
          <DorikaAdminMap />
        </section>

        <section className="panel dorika-admin-card">
          <div className="admin-section-heading">
            <h3>Publicación Dorika</h3>
            <p className="muted">Control editorial antes de mostrar rutas y lugares en la guía pública.</p>
          </div>
          <div className="dorika-admin-status">
            <button className={status === "draft" ? "is-active" : ""} type="button" onClick={() => setStatus("draft")}>
              Borrador
            </button>
            <button className={status === "review" ? "is-active" : ""} type="button" onClick={() => setStatus("review")}>
              Revisión
            </button>
            <button className={status === "published" ? "is-active" : ""} type="button" onClick={() => setStatus("published")}>
              Publicado
            </button>
          </div>
          <div className="dorika-admin-checklist">
            <p><CheckCircle2 size={16} /> Foto principal validada</p>
            <p><MapPin size={16} /> Coordenadas listas</p>
            <p><Route size={16} /> Paradas ordenadas</p>
            <p><Search size={16} /> SEO local preparado</p>
            <p><Database size={16} /> Datos organizados para crecer</p>
            <p><Map size={16} /> Mapa listo para conectar</p>
          </div>
        </section>
      </div>
    </section>
  );
}
