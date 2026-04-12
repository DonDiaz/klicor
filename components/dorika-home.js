"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarCheck,
  ChevronRight,
  Compass,
  MapPin,
  Search,
  Sparkles,
} from "lucide-react";
import {
  dorikaBottomNav,
  dorikaCategories,
  dorikaIntentChips,
  dorikaMapPins,
  dorikaNearbyBusinesses,
  dorikaProducts,
  dorikaRoutes,
  dorikaSearchSuggestions,
} from "@/lib/dorika-demo-data";

function DorikaLogo() {
  return (
    <div className="dorika-logo" aria-label="Dorika">
      <span>D</span>
      <strong>Dorika</strong>
    </div>
  );
}

function DorikaSearch() {
  return (
    <label className="dorika-search">
      <Search size={18} />
      <input placeholder="Busca comida, rutas, tiendas o lugares" />
    </label>
  );
}

function DorikaMapPreview({ activePin, onSelectPin }) {
  return (
    <section className="dorika-map-card" aria-label="Mapa Dorika">
      <div className="dorika-map-topbar">
        <div>
          <span>Mapa Dorika</span>
          <strong>Ruta sugerida cerca de ti</strong>
        </div>
        <button type="button">Ver mapa</button>
      </div>

      <div className="dorika-map-canvas">
        <span className="dorika-map-blob is-one" />
        <span className="dorika-map-blob is-two" />
        <span className="dorika-map-blob is-three" />
        <span className="dorika-map-route-line" />
        {dorikaMapPins.map((pin) => {
          const Icon = pin.icon;
          const isActive = activePin === pin.id;
          return (
            <button
              key={pin.id}
              className={`dorika-map-pin is-${pin.tone} ${isActive ? "is-active" : ""}`.trim()}
              type="button"
              style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
              onClick={() => onSelectPin(pin.id)}
              aria-label={pin.label}
            >
              <Icon size={15} />
              <span>{pin.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function NearbyCard({ business }) {
  return (
    <article className="dorika-nearby-card">
      <img src={business.image} alt={business.name} loading="lazy" decoding="async" />
      <div>
        <span>{business.type} · {business.distance}</span>
        <strong>{business.name}</strong>
        <small><MapPin size={13} /> {business.location}</small>
      </div>
      <button type="button">{business.cta}</button>
    </article>
  );
}

function ProductCard({ product }) {
  return (
    <article className="dorika-product-card">
      <img src={product.image} alt={product.name} loading="lazy" decoding="async" />
      <div>
        <span>{product.tag}</span>
        <strong>{product.name}</strong>
        <small>{product.business}</small>
      </div>
      <footer>
        <strong>{product.price}</strong>
        <button type="button">Ver en tienda</button>
      </footer>
    </article>
  );
}

function RouteCard({ route, featured = false }) {
  return (
    <article className={`dorika-route-card ${featured ? "is-featured" : ""}`.trim()}>
      <img src={route.image} alt={route.title} loading="lazy" decoding="async" />
      <div className="dorika-route-overlay">
        <span>{route.location} · {route.duration}</span>
        <strong>{route.title}</strong>
        <small>{route.stops} paradas · {route.mood}</small>
      </div>
      <button type="button">
        Explorar ruta <ArrowRight size={15} />
      </button>
    </article>
  );
}

function DorikaBottomNav({ activeNav, onChange }) {
  return (
    <nav className="dorika-bottom-nav" aria-label="Navegación Dorika">
      {dorikaBottomNav.map((item) => {
        const Icon = item.icon;
        const isActive = activeNav === item.id;
        return (
          <button
            key={item.id}
            className={isActive ? "is-active" : ""}
            type="button"
            onClick={() => onChange(item.id)}
          >
            <Icon size={21} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function DorikaHome() {
  const [activeIntent, setActiveIntent] = useState("eat");
  const [activePin, setActivePin] = useState("p2");
  const [activeNav, setActiveNav] = useState("home");
  const activeIntentLabel = useMemo(
    () => dorikaIntentChips.find((item) => item.id === activeIntent)?.label || "Explorar",
    [activeIntent],
  );

  return (
    <main className="dorika-page">
      <section className="dorika-app-shell">
        <header className="dorika-header">
          <div>
            <DorikaLogo />
            <p>Hola, Jhonnathan</p>
          </div>
          <button className="dorika-avatar-button" type="button" aria-label="Abrir perfil">
            J
          </button>
        </header>

        <DorikaSearch />

        <section className="dorika-hero">
          <div className="dorika-hero-copy">
            <span><Sparkles size={15} /> Camino, orden y transformación</span>
            <h1>¿Qué quieres hacer hoy?</h1>
            <p>Encuentra negocios, productos, rutas y lugares con una guía clara y cercana.</p>
          </div>
          <div className="dorika-hero-chips" aria-label="Intenciones principales">
            {dorikaIntentChips.map((chip) => {
              const Icon = chip.icon;
              const isActive = activeIntent === chip.id;
              return (
                <button
                  key={chip.id}
                  className={isActive ? "is-active" : ""}
                  type="button"
                  onClick={() => setActiveIntent(chip.id)}
                >
                  <Icon size={16} />
                  {chip.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="dorika-section">
          <div className="dorika-section-head">
            <div>
              <span>Categorías</span>
              <h2>Todo a la mano</h2>
            </div>
            <button type="button">Ver todo</button>
          </div>
          <div className="dorika-category-grid">
            {dorikaCategories.map((category) => {
              const Icon = category.icon;
              return (
                <button key={category.id} className="dorika-category-card" type="button" style={{ "--dorika-category": category.accent }}>
                  <span><Icon size={20} /></span>
                  <strong>{category.label}</strong>
                  <small>{category.caption}</small>
                </button>
              );
            })}
          </div>
        </section>

        <section className="dorika-section">
          <div className="dorika-section-head">
            <div>
              <span>{activeIntentLabel} cerca de ti</span>
              <h2>Negocios para resolver rápido</h2>
            </div>
            <button type="button">Filtrar</button>
          </div>
          <div className="dorika-nearby-rail">
            {dorikaNearbyBusinesses.map((business) => (
              <NearbyCard key={business.id} business={business} />
            ))}
          </div>
        </section>

        <section className="dorika-agenda-card">
          <div>
            <span><CalendarCheck size={15} /> Agenda y reservas</span>
            <h2>Reserva sin escribir de más</h2>
            <p>Barberías, belleza, bienestar, turismo y experiencias pueden mostrar disponibilidad clara.</p>
          </div>
          <button type="button">Ver disponibles</button>
        </section>

        <section className="dorika-section">
          <div className="dorika-section-head">
            <div>
              <span>Productos desde Klicor</span>
              <h2>Descubre algo para pedir hoy</h2>
            </div>
            <button type="button">Más productos</button>
          </div>
          <div className="dorika-product-grid">
            {dorikaProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        <section className="dorika-tourism-panel">
          <RouteCard route={dorikaRoutes[1]} featured />
        </section>

        <DorikaMapPreview activePin={activePin} onSelectPin={setActivePin} />

        <section className="dorika-section dorika-routes-section">
          <div className="dorika-section-head">
            <div>
              <span>Rutas Dorika</span>
              <h2>Planes con intención</h2>
            </div>
            <button type="button">Crear plan</button>
          </div>
          <div className="dorika-route-list">
            {dorikaRoutes.map((route) => (
              <RouteCard key={route.id} route={route} />
            ))}
          </div>
        </section>

        <section className="dorika-suggestions">
          <span>Búsquedas rápidas</span>
          <div>
            {dorikaSearchSuggestions.map((suggestion) => (
              <button key={suggestion.id} type="button">
                {suggestion.label} <ChevronRight size={14} />
              </button>
            ))}
          </div>
        </section>
      </section>

      <aside className="dorika-desktop-side">
        <div className="dorika-desktop-card">
          <span>Fase Dorika</span>
          <h2>Guía pública hoy, software completo mañana.</h2>
          <p>Dorika conecta negocios Klicor con personas, rutas, productos y lugares. Primero gana confianza como guía local, luego crece como una plataforma más completa para negocios.</p>
        </div>
        <DorikaMapPreview activePin={activePin} onSelectPin={setActivePin} />
      </aside>

      <DorikaBottomNav activeNav={activeNav} onChange={setActiveNav} />
    </main>
  );
}
