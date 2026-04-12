import {
  CalendarCheck,
  Camera,
  Coffee,
  Compass,
  Heart,
  Hotel,
  MapPin,
  Mountain,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  Utensils,
} from "lucide-react";

export const DORIKA_COLORS = {
  base: "#F7F4EF",
  white: "#FFFFFF",
  text: "#0F172A",
  muted: "#6B7280",
  green: "#22A98A",
  greenSoft: "#CDEEE5",
  terracotta: "#E07A5F",
  orange: "#F4A261",
};

export const dorikaIntentChips = [
  { id: "eat", label: "Comer", icon: Utensils },
  { id: "shop", label: "Comprar", icon: ShoppingBag },
  { id: "book", label: "Reservar", icon: CalendarCheck },
  { id: "explore", label: "Explorar", icon: Compass },
];

export const dorikaCategories = [
  {
    id: "restaurants",
    label: "Restaurantes",
    caption: "Menús, cafés y domicilios",
    icon: Utensils,
    accent: "#F4A261",
  },
  {
    id: "beauty",
    label: "Belleza",
    caption: "Agenda y bienestar",
    icon: Sparkles,
    accent: "#E07A5F",
  },
  {
    id: "hotels",
    label: "Hoteles",
    caption: "Estadías y reservas",
    icon: Hotel,
    accent: "#8AB6D6",
  },
  {
    id: "tourism",
    label: "Turismo",
    caption: "Rutas y lugares",
    icon: Mountain,
    accent: "#22A98A",
  },
  {
    id: "stores",
    label: "Tiendas",
    caption: "Productos locales",
    icon: Store,
    accent: "#A8A29E",
  },
  {
    id: "nearby",
    label: "Cerca de ti",
    caption: "Planes por zona",
    icon: MapPin,
    accent: "#22A98A",
  },
];

export const dorikaNearbyBusinesses = [
  {
    id: "montana",
    name: "Glamping La Montaña",
    type: "Hospedaje",
    location: "Vereda El Mirador",
    distance: "2.4 km",
    rating: "4.8",
    cta: "Ver disponibilidad",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "cafe",
    name: "Café Río Claro",
    type: "Café especial",
    location: "Centro histórico",
    distance: "850 m",
    rating: "4.9",
    cta: "Ver menú",
    image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "barber",
    name: "Corte Master Barber",
    type: "Agenda",
    location: "Barrio Jardín",
    distance: "1.1 km",
    rating: "4.7",
    cta: "Agendar",
    image: "https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&w=900&q=80",
  },
];

export const dorikaProducts = [
  {
    id: "burger",
    name: "Hamburguesa artesanal",
    business: "Comida rápida La 12",
    price: "$18.000",
    tag: "Menú Klicor",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "shoes",
    name: "Tenis urbanos",
    business: "Distrito Sneakers",
    price: "$129.000",
    tag: "Tienda Klicor",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "coffee",
    name: "Café de origen",
    business: "Café Río Claro",
    price: "$24.000",
    tag: "Catálogo Klicor",
    image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=600&q=80",
  },
];

export const dorikaRoutes = [
  {
    id: "sabores",
    title: "Ruta de sabores locales",
    location: "Centro y mirador",
    duration: "3 horas",
    stops: 5,
    mood: "Comer, caminar y descubrir",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "montana",
    title: "Tarde entre montañas",
    location: "Zona rural",
    duration: "Medio día",
    stops: 4,
    mood: "Fotos, café y paisaje",
    image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80",
  },
];

export const dorikaMapPins = [
  { id: "p1", label: "Café", x: 18, y: 28, icon: Coffee, tone: "food" },
  { id: "p2", label: "Mirador", x: 58, y: 18, icon: Camera, tone: "tourism" },
  { id: "p3", label: "Hotel", x: 73, y: 52, icon: Hotel, tone: "hotel" },
  { id: "p4", label: "Tienda", x: 34, y: 68, icon: ShoppingBag, tone: "store" },
  { id: "p5", label: "Plan", x: 62, y: 78, icon: Heart, tone: "beauty" },
];

export const dorikaAdminSummary = [
  { label: "Negocios listos", value: "124" },
  { label: "Sitios turísticos", value: "32" },
  { label: "Rutas en borrador", value: "7" },
  { label: "Pendientes de revisar", value: "18" },
];

export const dorikaAdminStops = [
  { id: "s1", order: "01", name: "Café Río Claro", type: "Negocio Klicor", status: "Conectado" },
  { id: "s2", order: "02", name: "Mirador Las Brisas", type: "Sitio turístico", status: "Pendiente de foto" },
  { id: "s3", order: "03", name: "Glamping La Montaña", type: "Negocio Klicor", status: "Conectado" },
  { id: "s4", order: "04", name: "Sendero del río", type: "Sitio turístico", status: "Revisar ubicación" },
];

export const dorikaSearchSuggestions = [
  { id: "restaurants", label: "Restaurantes cerca" },
  { id: "weekend", label: "Planes de fin de semana" },
  { id: "routes", label: "Rutas para hoy" },
  { id: "products", label: "Productos locales" },
];

export const dorikaBottomNav = [
  { id: "home", label: "Inicio", icon: Store },
  { id: "explore", label: "Explorar", icon: Search },
  { id: "bookings", label: "Reservas", icon: CalendarCheck },
  { id: "favorites", label: "Favoritos", icon: Heart },
  { id: "profile", label: "Perfil", icon: MapPin },
];
