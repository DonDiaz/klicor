import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { unstable_cache, revalidatePath, revalidateTag } from "next/cache";
import { normalizeBusinessCategory, resolveBusinessCategoryLabel } from "@/lib/business-categories";
import { buildCommercePublicUrl, normalizeCommerceConfig } from "@/lib/commerce-config";
import {
  dorikaAdminStops,
  dorikaMapPins,
  dorikaNearbyBusinesses,
  dorikaProducts,
  dorikaRoutes,
} from "@/lib/dorika-demo-data";
import { getAdminDb } from "@/lib/firebase-admin";
import { buildStableProfilePath, buildVanityProfilePath } from "@/lib/public-profile-links";
import { sanitizeSlug, toDate } from "@/lib/utils";

const DORIKA_PUBLIC_CACHE_TAG = "dorika:public";
const DORIKA_BUSINESS_LIMIT = 80;
const DORIKA_PRODUCT_BUSINESS_LIMIT = 12;
const DORIKA_PRODUCTS_PER_BUSINESS = 4;

const CATEGORY_TO_DORIKA = {
  food_drink: "restaurants",
  retail_sales: "stores",
  services: "beauty",
  health_wellness: "beauty",
  tourism_experiences: "tourism",
};

const CATEGORY_IMAGE_FALLBACKS = {
  restaurants: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
  stores: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80",
  beauty: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=80",
  tourism: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80",
  hotels: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
  nearby: "https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=900&q=80",
};

const ROUTE_IMAGE_FALLBACK = "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80";
const PLACE_IMAGE_FALLBACK = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80";

function usersCollection() {
  return getAdminDb().collection("users");
}

function placesCollection() {
  return getAdminDb().collection("dorikaPlaces");
}

function routesCollection() {
  return getAdminDb().collection("dorikaRoutes");
}

function normalizeStatus(value = "draft") {
  const normalized = String(value || "").trim().toLowerCase();
  return ["draft", "review", "published", "hidden"].includes(normalized) ? normalized : "draft";
}

function normalizeDorikaCategory(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (["restaurants", "stores", "beauty", "tourism", "hotels", "nearby"].includes(normalized)) return normalized;
  return "tourism";
}

function buildLocationText(input = {}) {
  return [
    input.address,
    input.city || input.billingProfile?.city,
    input.department || input.billingProfile?.department,
  ].filter(Boolean).join(", ");
}

function formatCurrency(amount, currency = "COP") {
  if (amount === null || amount === undefined || amount === "") return "";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

function getWhatsappLink(user = {}) {
  const profileLinks = Array.isArray(user.profileLinks) ? user.profileLinks : [];
  return profileLinks.find((item) => item?.type === "whatsapp")?.url || "";
}

function getPrimaryActionForBusiness(user = {}, config = {}) {
  const category = normalizeBusinessCategory(user.businessCategory);
  const username = sanitizeSlug(user.usernameLower || user.username);
  const commerceMode = config.activeMode;
  const commerceUrl = username && commerceMode ? buildCommercePublicUrl(username, commerceMode) : "";
  const profileUrl = username ? buildVanityProfilePath(username) : buildStableProfilePath(user.publicLinkId);

  if (["food_drink", "retail_sales"].includes(category) && commerceUrl && config.hasContent) {
    return {
      label: category === "food_drink" ? "Pedir" : "Comprar",
      url: commerceUrl,
    };
  }

  if (["health_wellness", "services"].includes(category) && username) {
    return {
      label: "Agendar",
      url: `/${username}/agenda`,
    };
  }

  if (profileUrl) {
    return {
      label: category === "tourism_experiences" ? "Reservar" : "Ver",
      url: profileUrl,
    };
  }

  return {
    label: "Ver",
    url: "",
  };
}

function normalizeBusinessDoc(doc) {
  const data = doc.data() || {};
  const category = normalizeBusinessCategory(data.businessCategory);
  const dorikaCategory = CATEGORY_TO_DORIKA[category] || "nearby";
  const config = normalizeCommerceConfig(data.commerce, data);
  const action = getPrimaryActionForBusiness(data, config);
  const username = sanitizeSlug(data.usernameLower || data.username);
  const publicUrl = username ? buildVanityProfilePath(username) : buildStableProfilePath(data.publicLinkId);
  const image = String(data.photoThumb || data.photo || CATEGORY_IMAGE_FALLBACKS[dorikaCategory] || CATEGORY_IMAGE_FALLBACKS.nearby).trim();
  const location = buildLocationText(data.billingProfile || data) || "Ubicación por confirmar";

  return {
    id: doc.id,
    uid: doc.id,
    source: "klicor",
    name: String(data.businessName || data.contactCardName || "Negocio Klicor").trim(),
    type: resolveBusinessCategoryLabel(category),
    category: dorikaCategory,
    businessCategory: category,
    location,
    distance: "Cerca de ti",
    rating: "",
    cta: action.label,
    actionUrl: action.url || publicUrl,
    publicUrl,
    whatsappUrl: getWhatsappLink(data),
    image,
    headline: String(data.businessHeadline || data.businessSubheadline || "").trim(),
    commerceMode: config.activeMode,
    commerceUrl: username && config.activeMode ? buildCommercePublicUrl(username, config.activeMode) : "",
    hasCommerce: Boolean(config.hasContent && config.activeMode),
    status: String(data.status || "trial").trim(),
    updatedAtMs: toDate(data.updatedAt)?.getTime?.() || 0,
  };
}

function normalizeProductDoc(doc, business = {}) {
  const data = doc.data() || {};
  const images = Array.isArray(data.images) ? data.images : [];
  const primaryImage = images[0] || {};
  const image = String(data.imageThumbUrl || primaryImage.imageThumbUrl || data.imageUrl || primaryImage.imageUrl || "").trim();
  const price = data.price === null || data.price === undefined ? "" : formatCurrency(data.price, business.currency || "COP");

  return {
    id: `${business.uid || business.id}-${doc.id}`,
    productId: doc.id,
    businessId: business.uid || business.id || "",
    name: String(data.name || "Producto").trim(),
    business: business.name || "Negocio Klicor",
    price,
    rawPrice: Number(data.price || 0) || 0,
    tag: business.commerceMode === "mimenu" ? "Menú Klicor" : business.commerceMode === "micatalogo" ? "Catálogo Klicor" : "Tienda Klicor",
    image: image || CATEGORY_IMAGE_FALLBACKS[business.category] || CATEGORY_IMAGE_FALLBACKS.stores,
    description: String(data.description || "").trim(),
    actionUrl: business.commerceUrl || business.actionUrl || business.publicUrl || "",
    visible: data.visible !== false,
    orderIndex: Number(data.orderIndex || 0) || 0,
  };
}

function normalizePlaceDoc(doc) {
  const data = doc.data() || {};
  const category = normalizeDorikaCategory(data.category);
  return {
    id: doc.id,
    source: "dorika",
    name: String(data.name || "Lugar Dorika").trim(),
    type: String(data.type || "Sitio turístico").trim(),
    category,
    location: String(data.location || data.city || "Ubicación por confirmar").trim(),
    city: String(data.city || "").trim(),
    description: String(data.description || "").trim(),
    status: normalizeStatus(data.status),
    image: String(data.image || data.coverImage || PLACE_IMAGE_FALLBACK).trim(),
    cta: category === "tourism" ? "Explorar" : "Ver",
    actionUrl: String(data.actionUrl || "").trim(),
    x: Number(data.x || 50) || 50,
    y: Number(data.y || 50) || 50,
    createdAtMs: toDate(data.createdAt)?.getTime?.() || 0,
    updatedAtMs: toDate(data.updatedAt)?.getTime?.() || 0,
  };
}

function normalizeRouteDoc(doc) {
  const data = doc.data() || {};
  const stops = Array.isArray(data.stops) ? data.stops : [];
  return {
    id: doc.id,
    title: String(data.title || "Ruta Dorika").trim(),
    location: String(data.location || "Zona local").trim(),
    duration: String(data.duration || "Medio día").trim(),
    stops: Number(data.stopsCount ?? stops.length ?? 0) || 0,
    mood: String(data.mood || "Explorar con calma").trim(),
    image: String(data.image || ROUTE_IMAGE_FALLBACK).trim(),
    status: normalizeStatus(data.status),
    stopItems: stops.map((stop, index) => ({
      id: String(stop.id || `stop-${index + 1}`),
      order: String(index + 1).padStart(2, "0"),
      name: String(stop.name || "").trim(),
      type: String(stop.type || "Parada").trim(),
      status: String(stop.status || "Pendiente").trim(),
    })).filter((stop) => stop.name),
    createdAtMs: toDate(data.createdAt)?.getTime?.() || 0,
    updatedAtMs: toDate(data.updatedAt)?.getTime?.() || 0,
  };
}

function shouldPublish(item = {}) {
  return normalizeStatus(item.status) === "published";
}

async function readKlicorBusinesses() {
  const snap = await usersCollection().limit(DORIKA_BUSINESS_LIMIT).get();
  return snap.docs
    .map(normalizeBusinessDoc)
    .filter((business) => business.name && business.publicUrl && !["suspended", "cancelled"].includes(business.status))
    .slice(0, DORIKA_BUSINESS_LIMIT);
}

async function readFeaturedProducts(businesses = []) {
  const candidates = businesses
    .filter((business) => business.hasCommerce && business.commerceMode)
    .slice(0, DORIKA_PRODUCT_BUSINESS_LIMIT);

  const productGroups = await Promise.all(candidates.map(async (business) => {
    const snap = await usersCollection()
      .doc(business.uid)
      .collection("commerceProducts")
      .limit(DORIKA_PRODUCTS_PER_BUSINESS * 2)
      .get()
      .catch(() => ({ docs: [] }));

    return snap.docs
      .map((doc) => normalizeProductDoc(doc, business))
      .filter((product) => product.visible)
      .sort((left, right) => left.orderIndex - right.orderIndex)
      .slice(0, DORIKA_PRODUCTS_PER_BUSINESS);
  }));

  return productGroups.flat().slice(0, 12);
}

async function readDorikaPlaces({ includeDrafts = false } = {}) {
  const snap = await placesCollection().limit(60).get().catch(() => ({ docs: [] }));
  return snap.docs
    .map(normalizePlaceDoc)
    .filter((place) => includeDrafts || shouldPublish(place))
    .sort((left, right) => Number(right.updatedAtMs || right.createdAtMs || 0) - Number(left.updatedAtMs || left.createdAtMs || 0));
}

async function readDorikaRoutes({ includeDrafts = false } = {}) {
  const snap = await routesCollection().limit(40).get().catch(() => ({ docs: [] }));
  return snap.docs
    .map(normalizeRouteDoc)
    .filter((route) => includeDrafts || shouldPublish(route))
    .sort((left, right) => Number(right.updatedAtMs || right.createdAtMs || 0) - Number(left.updatedAtMs || left.createdAtMs || 0));
}

function buildMapPins(places = [], businesses = []) {
  const fromPlaces = places.slice(0, 5).map((place, index) => ({
    id: `place-${place.id}`,
    label: place.name.split(" ").slice(0, 2).join(" "),
    x: place.x || 20 + (index * 13),
    y: place.y || 28 + (index * 9),
    tone: place.category === "tourism" ? "tourism" : place.category === "stores" ? "store" : place.category === "beauty" ? "beauty" : "food",
  }));

  const fromBusinesses = businesses.slice(0, Math.max(0, 5 - fromPlaces.length)).map((business, index) => ({
    id: `business-${business.id}`,
    label: business.name.split(" ").slice(0, 2).join(" "),
    x: 22 + (index * 15),
    y: 34 + (index * 10),
    tone: business.category === "restaurants" ? "food" : business.category === "stores" ? "store" : business.category === "tourism" ? "tourism" : "beauty",
  }));

  if ([...fromPlaces, ...fromBusinesses].length) {
    return [...fromPlaces, ...fromBusinesses];
  }

  return dorikaMapPins.map(({ icon, ...pin }) => pin);
}

function buildMetrics({ businesses = [], products = [], places = [], routes = [] } = {}) {
  return [
    { label: "Negocios Klicor", value: String(businesses.length) },
    { label: "Productos visibles", value: String(products.length) },
    { label: "Sitios Dorika", value: String(places.length) },
    { label: "Rutas creadas", value: String(routes.length) },
  ];
}

function buildAdminStops(routes = [], places = []) {
  const routeStops = routes.find((route) => route.stopItems?.length)?.stopItems || [];
  if (routeStops.length) return routeStops;

  const placeStops = places.slice(0, 4).map((place, index) => ({
    id: place.id,
    order: String(index + 1).padStart(2, "0"),
    name: place.name,
    type: place.type,
    status: place.status === "published" ? "Publicado" : place.status === "review" ? "En revisión" : "Borrador",
  }));

  return placeStops.length ? placeStops : dorikaAdminStops;
}

async function readDorikaSnapshot({ includeDrafts = false } = {}) {
  const [businesses, places, routes] = await Promise.all([
    readKlicorBusinesses(),
    readDorikaPlaces({ includeDrafts }),
    readDorikaRoutes({ includeDrafts }),
  ]);
  const products = await readFeaturedProducts(businesses);

  const visibleBusinesses = [...places, ...businesses].slice(0, 16);
  const visibleRoutes = routes.length ? routes : dorikaRoutes;
  const visibleProducts = products.length ? products : dorikaProducts;

  return {
    businesses: visibleBusinesses.length ? visibleBusinesses : dorikaNearbyBusinesses,
    klicorBusinesses: businesses,
    products: visibleProducts,
    routes: visibleRoutes,
    places,
    mapPins: buildMapPins(places, businesses),
    metrics: buildMetrics({ businesses, products, places, routes }),
    adminStops: buildAdminStops(routes, places),
    suggestions: [
      { id: "restaurants", label: "Restaurantes cerca" },
      { id: "products", label: products.length ? "Productos reales de Klicor" : "Productos locales" },
      { id: "routes", label: routes.length ? "Rutas publicadas" : "Rutas para hoy" },
      { id: "tourism", label: "Sitios turísticos" },
    ],
    updatedAt: new Date().toISOString(),
  };
}

export async function getDorikaPublicSnapshot() {
  return unstable_cache(
    async () => readDorikaSnapshot({ includeDrafts: false }),
    ["dorika-public-snapshot"],
    {
      tags: [DORIKA_PUBLIC_CACHE_TAG],
      revalidate: 300,
    },
  )();
}

export async function getDorikaAdminSnapshot() {
  return readDorikaSnapshot({ includeDrafts: true });
}

export async function createDorikaPlace(input = {}) {
  const name = String(input.name || "").trim();
  if (name.length < 3) {
    throw new Error("Ingresa el nombre del lugar.");
  }

  const payload = {
    name,
    type: String(input.type || "Sitio turístico").trim(),
    category: normalizeDorikaCategory(input.category),
    location: String(input.location || input.city || "").trim(),
    city: String(input.city || "").trim(),
    description: String(input.description || "").trim(),
    image: String(input.image || "").trim(),
    actionUrl: String(input.actionUrl || "").trim(),
    status: normalizeStatus(input.status || "draft"),
    x: Math.min(Math.max(Number(input.x || 50) || 50, 5), 95),
    y: Math.min(Math.max(Number(input.y || 50) || 50, 5), 95),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  const ref = await placesCollection().add(payload);
  if (payload.status === "published") {
    revalidateTag(DORIKA_PUBLIC_CACHE_TAG);
    revalidatePath("/dorika");
  }
  return {
    id: ref.id,
    name: payload.name,
    status: payload.status,
  };
}

export async function createDorikaRoute(input = {}) {
  const title = String(input.title || "").trim();
  if (title.length < 3) {
    throw new Error("Ingresa el nombre de la ruta.");
  }

  const rawStops = Array.isArray(input.stops) ? input.stops : [];
  const stops = rawStops
    .map((stop, index) => ({
      id: String(stop.id || `stop-${index + 1}`),
      name: String(stop.name || "").trim(),
      type: String(stop.type || "Parada").trim(),
      status: String(stop.status || "Pendiente").trim(),
    }))
    .filter((stop) => stop.name);

  const payload = {
    title,
    location: String(input.location || "").trim(),
    duration: String(input.duration || "Medio día").trim(),
    mood: String(input.mood || "").trim(),
    image: String(input.image || "").trim(),
    status: normalizeStatus(input.status || "draft"),
    stops,
    stopsCount: stops.length,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  const ref = await routesCollection().add(payload);
  if (payload.status === "published") {
    revalidateTag(DORIKA_PUBLIC_CACHE_TAG);
    revalidatePath("/dorika");
  }
  return {
    id: ref.id,
    title: payload.title,
    status: payload.status,
  };
}
