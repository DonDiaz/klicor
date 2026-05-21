"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, LocateFixed, MapPin, Minus, Plus, Search, X } from "lucide-react";

const TILE_SIZE = 256;
const DEFAULT_CENTER = { latitude: 4.711, longitude: -74.0721 };
const OCANA_CENTER = { latitude: 8.2377, longitude: -73.356 };
const DEFAULT_ZOOM = 6;
const DETAIL_ZOOM = 17;

function isFiniteCoordinate(latitude, longitude) {
  return Number.isFinite(latitude) && Number.isFinite(longitude);
}

function clampLatitude(latitude) {
  if (!Number.isFinite(latitude)) return DEFAULT_CENTER.latitude;
  return Math.max(-85, Math.min(85, latitude));
}

function normalizeLongitude(longitude) {
  if (!Number.isFinite(longitude)) return DEFAULT_CENTER.longitude;
  return ((((longitude + 180) % 360) + 360) % 360) - 180;
}

function roundCoordinate(value) {
  return Math.round(Number(value) * 10000000) / 10000000;
}

function normalizeSearchValue(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function lonLatToWorld(latitude, longitude, zoom) {
  const scale = TILE_SIZE * 2 ** zoom;
  const lat = clampLatitude(latitude);
  const lng = normalizeLongitude(longitude);
  const sin = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

function worldToLonLat(x, y, zoom) {
  const scale = TILE_SIZE * 2 ** zoom;
  const longitude = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const latitude = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return {
    latitude: roundCoordinate(clampLatitude(latitude)),
    longitude: roundCoordinate(normalizeLongitude(longitude)),
  };
}

function resolveInitialCenter({ initialLatitude, initialLongitude, initialCity }) {
  if (isFiniteCoordinate(initialLatitude, initialLongitude)) {
    return {
      latitude: roundCoordinate(initialLatitude),
      longitude: roundCoordinate(initialLongitude),
      zoom: DETAIL_ZOOM,
    };
  }

  if (String(initialCity || "").toLowerCase().includes("oca")) {
    return {
      ...OCANA_CENTER,
      zoom: 14,
    };
  }

  return {
    ...DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
  };
}

function getTileUrl(x, y, zoom) {
  const max = 2 ** zoom;
  const wrappedX = ((x % max) + max) % max;
  if (y < 0 || y >= max) return "";
  return `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${y}.png`;
}

export function DorikaMapPicker({
  open,
  businessName,
  initialLatitude,
  initialLongitude,
  initialCity,
  initialZone,
  initialAddress,
  eyebrow = "Ubicación para Dorika",
  title = "Ubica tu negocio en el mapa",
  copy = "Busca la dirección, usa tu ubicación actual o mueve el mapa hasta dejar el pin sobre el local.",
  saveLabel = "Guardar ubicación",
  savedMessage = "Punto ajustado. Guarda para usarlo en Dorika.",
  onClose,
  onSave,
}) {
  const mapRef = useRef(null);
  const dragRef = useRef(null);
  const [mapSize, setMapSize] = useState({ width: 680, height: 360 });
  const [center, setCenter] = useState(() => resolveInitialCenter({ initialLatitude, initialLongitude, initialCity }));
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [mapMessage, setMapMessage] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");

  useEffect(() => {
    if (!open) return;
    setCenter(resolveInitialCenter({ initialLatitude, initialLongitude, initialCity }));
    setSearchResults([]);
    setMapMessage("");
    setSelectedLabel("");
    const suggestedSearch = [initialAddress, initialZone, initialCity, "Colombia"].filter(Boolean).join(", ");
    setSearchQuery(suggestedSearch);
  }, [initialAddress, initialCity, initialLatitude, initialLongitude, initialZone, open]);

  useEffect(() => {
    if (!open || !mapRef.current || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const rect = entry?.contentRect;
      if (!rect) return;
      setMapSize({
        width: rect.width || 680,
        height: rect.height || 360,
      });
    });
    observer.observe(mapRef.current);
    return () => observer.disconnect();
  }, [open]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  const tileLayout = useMemo(() => {
    const world = lonLatToWorld(center.latitude, center.longitude, center.zoom);
    const centerTileX = Math.floor(world.x / TILE_SIZE);
    const centerTileY = Math.floor(world.y / TILE_SIZE);
    const tiles = [];

    for (let xOffset = -2; xOffset <= 2; xOffset += 1) {
      for (let yOffset = -2; yOffset <= 2; yOffset += 1) {
        const tileX = centerTileX + xOffset;
        const tileY = centerTileY + yOffset;
        const url = getTileUrl(tileX, tileY, center.zoom);
        if (!url) continue;
        tiles.push({
          key: `${center.zoom}-${tileX}-${tileY}`,
          url,
          left: mapSize.width / 2 + tileX * TILE_SIZE - world.x,
          top: mapSize.height / 2 + tileY * TILE_SIZE - world.y,
        });
      }
    }

    return tiles;
  }, [center.latitude, center.longitude, center.zoom, mapSize.height, mapSize.width]);

  function moveMapFromPointer(event, mode = "click") {
    if (!mapRef.current) return;
    const nextPoint = getPointFromClient(event.clientX, event.clientY);
    setCenter((current) => ({
      ...current,
      ...nextPoint,
    }));
    setSelectedLabel(mode === "drag" ? "Punto ajustado en el mapa" : "Punto elegido en el mapa");
    setMapMessage(savedMessage);
  }

  function getPointFromClient(clientX, clientY, zoom = center.zoom) {
    if (!mapRef.current) {
      return {
        latitude: center.latitude,
        longitude: center.longitude,
      };
    }

    const rect = mapRef.current.getBoundingClientRect();
    const world = lonLatToWorld(center.latitude, center.longitude, zoom);
    const deltaX = clientX - rect.left - rect.width / 2;
    const deltaY = clientY - rect.top - rect.height / 2;
    return worldToLonLat(world.x + deltaX, world.y + deltaY, zoom);
  }

  function handlePointerDown(event) {
    if (event.button !== 0) return;
    const world = lonLatToWorld(center.latitude, center.longitude, center.zoom);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      world,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      drag.moved = true;
    }
    const nextPoint = worldToLonLat(drag.world.x - deltaX, drag.world.y - deltaY, center.zoom);
    setCenter((current) => ({
      ...current,
      ...nextPoint,
    }));
  }

  function handlePointerUp(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (drag.moved) {
      setSelectedLabel("Punto ajustado en el mapa");
      setMapMessage(savedMessage);
      return;
    }
    moveMapFromPointer(event);
  }

  function zoomAtPoint(nextZoom, clientX, clientY) {
    if (!mapRef.current) {
      handleZoom(nextZoom);
      return;
    }

    const boundedZoom = Math.max(5, Math.min(19, nextZoom));
    if (boundedZoom === center.zoom) return;

    const rect = mapRef.current.getBoundingClientRect();
    const currentWorld = lonLatToWorld(center.latitude, center.longitude, center.zoom);
    const pointerWorldX = currentWorld.x + clientX - rect.left - rect.width / 2;
    const pointerWorldY = currentWorld.y + clientY - rect.top - rect.height / 2;
    const scale = 2 ** (boundedZoom - center.zoom);
    const nextPointerWorldX = pointerWorldX * scale;
    const nextPointerWorldY = pointerWorldY * scale;
    const nextCenterWorldX = nextPointerWorldX - (clientX - rect.left - rect.width / 2);
    const nextCenterWorldY = nextPointerWorldY - (clientY - rect.top - rect.height / 2);
    const nextCenter = worldToLonLat(nextCenterWorldX, nextCenterWorldY, boundedZoom);

    setCenter((current) => ({
      ...current,
      ...nextCenter,
      zoom: boundedZoom,
    }));
  }

  function handleWheel(event) {
    event.preventDefault();
    const direction = event.deltaY > 0 ? -1 : 1;
    zoomAtPoint(center.zoom + direction, event.clientX, event.clientY);
  }

  function handleDoubleClick(event) {
    event.preventDefault();
    const nextPoint = getPointFromClient(event.clientX, event.clientY);
    setCenter((current) => ({
      ...current,
      ...nextPoint,
      zoom: Math.max(5, Math.min(19, current.zoom + 2)),
    }));
    setSelectedLabel("Punto elegido en el mapa");
    setMapMessage("Acercamos el mapa a ese punto. Ajusta si hace falta y guarda.");
  }

  async function handleSearch() {
    const query = searchQuery.trim();
    if (query.length < 3) {
      setMapMessage("Escribe una dirección, barrio o nombre de lugar.");
      return;
    }

    const normalizedQuery = normalizeSearchValue(query);
    if (normalizedQuery.includes("ocana")) {
      const localResult = {
        id: "ocana-norte-de-santander",
        label: "Ocaña, Norte de Santander, Colombia",
        latitude: OCANA_CENTER.latitude,
        longitude: OCANA_CENTER.longitude,
      };
      setSearchResults([localResult]);
      setCenter({ ...OCANA_CENTER, zoom: 14 });
      setSelectedLabel(localResult.label);
      setMapMessage("Ocaña cargada. Acerca el mapa o mueve el pin hasta el local.");
      return;
    }

    setSearchLoading(true);
    setMapMessage("");
    setSearchResults([]);

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=co&q=${encodeURIComponent(query)}`, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("search_failed");
      const results = await response.json();
      const parsedResults = Array.isArray(results)
        ? results
          .map((result) => ({
            id: result.place_id || `${result.lat}-${result.lon}`,
            label: result.display_name || "Resultado de búsqueda",
            latitude: roundCoordinate(Number(result.lat)),
            longitude: roundCoordinate(Number(result.lon)),
          }))
          .filter((result) => isFiniteCoordinate(result.latitude, result.longitude))
        : [];

      setSearchResults(parsedResults);
      setMapMessage(parsedResults.length ? "Elige el resultado más cercano y ajusta el pin si hace falta." : "No encontramos resultados. Prueba con barrio, ciudad o una dirección más simple.");
    } catch {
      setMapMessage("No pudimos buscar en el mapa. Puedes mover el punto manualmente o usar tu ubicación actual.");
    } finally {
      setSearchLoading(false);
    }
  }

  function handleSelectSearchResult(result) {
    setCenter({
      latitude: result.latitude,
      longitude: result.longitude,
      zoom: DETAIL_ZOOM,
    });
    setSelectedLabel(result.label);
    setMapMessage("Resultado cargado. Ajusta el pin si el punto no cae exacto.");
  }

  function handleUseCurrentLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setMapMessage("Tu navegador no permite usar ubicación actual. Busca la dirección o mueve el mapa.");
      return;
    }

    setLocationLoading(true);
    setMapMessage("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = roundCoordinate(position.coords.latitude);
        const longitude = roundCoordinate(position.coords.longitude);
        const accuracy = Math.round(position.coords.accuracy || 0);
        setCenter({
          latitude,
          longitude,
          zoom: DETAIL_ZOOM,
          accuracy: accuracy || null,
        });
        setSelectedLabel(accuracy ? `Ubicación actual, precisión aprox. ${accuracy} m` : "Ubicación actual");
        setMapMessage("Ubicación cargada. Si no es el local, mueve el pin antes de guardar.");
        setLocationLoading(false);
      },
      (error) => {
        setMapMessage(error?.code === 1
          ? "No pudimos acceder a tu ubicación. Activa el permiso o usa la búsqueda."
          : "No pudimos capturar tu ubicación. Busca la dirección o mueve el mapa.");
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
      },
    );
  }

  function handleZoom(nextZoom) {
    setCenter((current) => ({
      ...current,
      zoom: Math.max(5, Math.min(19, nextZoom)),
    }));
  }

  function handleSave() {
    onSave({
      latitude: roundCoordinate(center.latitude),
      longitude: roundCoordinate(center.longitude),
      locationAccuracyMeters: Number.isFinite(center.accuracy) ? center.accuracy : null,
      addressLabel: selectedLabel,
    });
  }

  if (!open) return null;

  return (
    <div className="modal-overlay dorika-map-overlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="dorika-map-modal" role="dialog" aria-modal="true" aria-labelledby="dorika-map-title">
        <div className="dorika-map-head">
          <div>
            <span className="dashboard-link-label">{eyebrow}</span>
            <h3 id="dorika-map-title">{title}</h3>
            <p>{copy}</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar mapa">
            <X size={18} />
          </button>
        </div>

        <div className="dorika-map-search">
          <div className="dorika-map-search-field">
            <Search size={17} />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSearch();
                }
              }}
              placeholder={businessName ? `Busca la dirección de ${businessName}` : "Buscar dirección, barrio o lugar"}
            />
          </div>
          <button className="btn btn-secondary" type="button" onClick={handleSearch} disabled={searchLoading}>
            {searchLoading ? "Buscando..." : "Buscar"}
          </button>
        </div>

        {searchResults.length ? (
          <div className="dorika-map-results">
            {searchResults.map((result) => (
              <button key={result.id} type="button" onClick={() => handleSelectSearchResult(result)}>
                <MapPin size={15} />
                <span>{result.label}</span>
              </button>
            ))}
          </div>
        ) : null}

        <div className="dorika-map-shell">
          <div
            ref={mapRef}
            className="dorika-map-canvas"
            role="application"
            aria-label="Mapa para ubicar el negocio"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => { dragRef.current = null; }}
            onWheel={handleWheel}
            onDoubleClick={handleDoubleClick}
          >
            {tileLayout.map((tile) => (
              <img
                key={tile.key}
                src={tile.url}
                alt=""
                draggable="false"
                className="dorika-map-tile"
                style={{
                  left: `${tile.left}px`,
                  top: `${tile.top}px`,
                }}
              />
            ))}
            <div className="dorika-map-pin" aria-hidden="true">
              <MapPin size={34} />
              <span>Punto del negocio</span>
            </div>
            <div className="dorika-map-controls">
              <button type="button" onClick={() => handleZoom(center.zoom + 1)} aria-label="Acercar mapa">
                <Plus size={16} />
              </button>
              <button type="button" onClick={() => handleZoom(center.zoom - 1)} aria-label="Alejar mapa">
                <Minus size={16} />
              </button>
            </div>
          </div>
          <div className="dorika-map-tip">
            <CheckCircle2 size={16} />
            <span>Tip: arrastra el mapa o toca un punto. El pin morado debe quedar justo sobre tu negocio.</span>
          </div>
        </div>

        <div className="dorika-map-footer">
          <button className="btn btn-secondary" type="button" onClick={handleUseCurrentLocation} disabled={locationLoading}>
            <LocateFixed size={16} />
            {locationLoading ? "Ubicando..." : "Usar mi ubicación actual"}
          </button>
          <div className="dorika-map-coordinates">
            <strong>{selectedLabel || "Punto seleccionado"}</strong>
            <span>{center.latitude.toFixed(6)}, {center.longitude.toFixed(6)}</span>
          </div>
          <button className="btn btn-primary" type="button" onClick={handleSave}>
            {saveLabel}
          </button>
        </div>

        {mapMessage ? <p className="dorika-map-message">{mapMessage}</p> : null}
        <small className="dorika-map-attribution">Mapa base de OpenStreetMap.</small>
      </section>
    </div>
  );
}
