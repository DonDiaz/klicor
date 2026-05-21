import { existsSync, readFileSync } from "node:fs";
import crypto from "node:crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import sharp from "sharp";

const WRITE = process.argv.includes("--write");
const UPDATE_EXISTING_WHATSAPP = process.argv.includes("--update-existing-whatsapp");
const DEMO_PASSWORD = "KlicorDemo2026!";
const DEMO_WHATSAPP = "3137681576";
const CACHE_CONTROL = "public, max-age=31536000, immutable";

const SOCIALS = {
  instagram: "https://instagram.com/klicor.app",
  facebook: "https://facebook.com/klicor.app",
  tiktok: "https://tiktok.com/@klicor.app",
};

const COVER_SOURCES = {
  barber_shop: "photo-1622288432450-277d0fef5ed6",
  nails: "photo-1604654894610-df63bc536371",
  wellness_center: "photo-1544161515-4ab6ce6db874",
  glamping: "photo-1500530855697-b586d89ba3ee",
  hotel: "photo-1566073771259-6a8506099945",
  local_experience: "photo-1517649763962-0c623066013b",
  plumbing: "photo-1585704032915-c3400ca199e7",
  auto_repair: "photo-1487754180451-c456f719a1fc",
  laundry: "photo-1517677208171-0bc6725a3e60",
  legal: "photo-1589829545856-d10d557cf95f",
  accounting: "photo-1554224155-6726b3ff858f",
  gym: "photo-1534438327276-14e5300c3a48",
};

const DEMO_PROFILES = [
  {
    uid: "demo-link-barberia-norte",
    email: "donjhonnathan+klicor.demo.barberia@gmail.com",
    username: "barberia-norte-demo",
    publicLinkId: "demo-link-barberia-norte",
    businessName: "Barberia Norte",
    businessCategory: "health_wellness",
    businessType: "barber_shop",
    headline: "Cortes, barba y estilo masculino con agenda facil",
    subheadline: "Reserva tu atencion aqui.",
    color: "111827",
    accent: "C6A15B",
    lat: 8.23792,
    lng: -73.35611,
    zone: "Centro",
    address: "Centro, Ocana",
    placeName: "Barberia Norte",
    reference: "Cerca al parque principal",
    booking: true,
    services: [
      { id: "svc-corte", name: "Corte clasico", description: "Corte con asesoria de estilo.", durationMinutes: 30, price: 18000 },
      { id: "svc-barba", name: "Barba y perfilado", description: "Arreglo de barba con toalla caliente.", durationMinutes: 30, price: 15000 },
      { id: "svc-combo", name: "Corte y barba", description: "Servicio completo de barberia.", durationMinutes: 60, price: 30000 },
    ],
    staff: [
      { id: "staff-camilo", name: "Camilo Coronel", roleOrSpecialty: "Barbero senior" },
      { id: "staff-santiago", name: "Santiago Rios", roleOrSpecialty: "Cortes modernos" },
    ],
  },
  {
    uid: "demo-link-aura-nails",
    email: "donjhonnathan+klicor.demo.nails@gmail.com",
    username: "aura-nails-demo",
    publicLinkId: "demo-link-aura-nails",
    businessName: "Aura Nails Studio",
    businessCategory: "health_wellness",
    businessType: "nails",
    headline: "Manicure, pedicure y disenos con agenda online",
    subheadline: "Elige servicio, profesional y horario.",
    color: "D6A184",
    accent: "8B7355",
    lat: 8.23842,
    lng: -73.35572,
    zone: "Centro",
    address: "Centro, Ocana",
    placeName: "Aura Nails Studio",
    reference: "Local 204",
    booking: true,
    services: [
      { id: "svc-manicure", name: "Manicure semipermanente", description: "Color y cuidado de unas.", durationMinutes: 60, price: 45000 },
      { id: "svc-pedicure", name: "Pedicure spa", description: "Cuidado completo de pies.", durationMinutes: 60, price: 50000 },
      { id: "svc-diseno", name: "Diseno sencillo", description: "Detalle decorativo por unas.", durationMinutes: 30, price: 25000 },
    ],
    staff: [
      { id: "staff-laura", name: "Laura Pabon", roleOrSpecialty: "Manicurista" },
      { id: "staff-maria", name: "Maria Torres", roleOrSpecialty: "Disenos y pedicure" },
    ],
  },
  {
    uid: "demo-link-bienestar-serena",
    email: "donjhonnathan+klicor.demo.bienestar@gmail.com",
    username: "bienestar-serena-demo",
    publicLinkId: "demo-link-bienestar-serena",
    businessName: "Centro Bienestar Serena",
    businessCategory: "health_wellness",
    businessType: "wellness_center",
    headline: "Terapias, masajes y bienestar con cita previa",
    subheadline: "Agenda tu espacio de cuidado.",
    color: "52796F",
    accent: "A3B18A",
    lat: 8.23682,
    lng: -73.35721,
    zone: "Buenos Aires",
    address: "Buenos Aires, Ocana",
    placeName: "Centro Bienestar Serena",
    reference: "Casa verde, segundo piso",
    booking: true,
    services: [
      { id: "svc-masaje", name: "Masaje relajante", description: "Sesion de relajacion corporal.", durationMinutes: 60, price: 70000 },
      { id: "svc-terapia", name: "Terapia integral", description: "Acompanamiento de bienestar.", durationMinutes: 45, price: 60000 },
      { id: "svc-valoracion", name: "Valoracion inicial", description: "Primera consulta orientativa.", durationMinutes: 30, price: 35000 },
    ],
    staff: [
      { id: "staff-paula", name: "Paula Navarro", roleOrSpecialty: "Terapeuta" },
      { id: "staff-daniel", name: "Daniel Ortega", roleOrSpecialty: "Bienestar corporal" },
    ],
  },
  {
    uid: "demo-link-glamping-brisas",
    email: "donjhonnathan+klicor.demo.glamping@gmail.com",
    username: "glamping-brisas-demo",
    publicLinkId: "demo-link-glamping-brisas",
    businessName: "Glamping Brisas de Ocana",
    businessCategory: "tourism_experiences",
    businessType: "glamping",
    headline: "Naturaleza, descanso y planes romanticos cerca de Ocana",
    subheadline: "Pregunta disponibilidad por WhatsApp.",
    color: "2F6F4E",
    accent: "D6A184",
    lat: 8.24492,
    lng: -73.37291,
    zone: "Via rural",
    address: "Via rural, Ocana",
    placeName: "Glamping Brisas de Ocana",
    reference: "Entrada por la via al mirador",
  },
  {
    uid: "demo-link-hotel-plaza",
    email: "donjhonnathan+klicor.demo.hotel@gmail.com",
    username: "hotel-plaza-central-demo",
    publicLinkId: "demo-link-hotel-plaza",
    businessName: "Hotel Plaza Central",
    businessCategory: "tourism_experiences",
    businessType: "hotel",
    headline: "Habitaciones comodas, ubicacion central y atencion directa",
    subheadline: "Consulta tarifas y disponibilidad.",
    color: "1F4E79",
    accent: "C6A15B",
    lat: 8.23744,
    lng: -73.35648,
    zone: "Centro",
    address: "Centro, Ocana",
    placeName: "Hotel Plaza Central",
    reference: "A dos cuadras del parque principal",
  },
  {
    uid: "demo-link-cancha-la-10",
    email: "donjhonnathan+klicor.demo.cancha@gmail.com",
    username: "cancha-la-10-demo",
    publicLinkId: "demo-link-cancha-la-10",
    businessName: "Cancha La 10 Sintetica",
    businessCategory: "tourism_experiences",
    businessType: "local_experience",
    headline: "Futbol 5, torneos y alquiler de cancha sintetica",
    subheadline: "Pregunta horarios disponibles por WhatsApp.",
    color: "15803D",
    accent: "FACC15",
    lat: 8.23592,
    lng: -73.35811,
    zone: "La Primavera",
    address: "La Primavera, Ocana",
    placeName: "Cancha La 10 Sintetica",
    reference: "Entrada del barrio",
  },
  {
    uid: "demo-link-plomeria-express",
    email: "donjhonnathan+klicor.demo.plomeria@gmail.com",
    username: "plomeria-express-demo",
    publicLinkId: "demo-link-plomeria-express",
    businessName: "Plomeria Express Ocana",
    businessCategory: "services",
    businessType: "plumbing",
    headline: "Instalaciones, reparaciones y urgencias de plomeria",
    subheadline: "Cotiza tu servicio por WhatsApp.",
    color: "0F5EC8",
    accent: "38BDF8",
    lat: 8.24013,
    lng: -73.35654,
    zone: "Mercado",
    address: "Zona de mercado, Ocana",
    placeName: "Plomeria Express Ocana",
    reference: "Atencion a domicilio",
  },
  {
    uid: "demo-link-taller-motosteel",
    email: "donjhonnathan+klicor.demo.taller@gmail.com",
    username: "taller-motosteel-demo",
    publicLinkId: "demo-link-taller-motosteel",
    businessName: "Taller MotoSteel",
    businessCategory: "services",
    businessType: "auto_repair",
    headline: "Mecanica, revision y mantenimiento para motos y autos",
    subheadline: "Escribenos para diagnostico.",
    color: "374151",
    accent: "F97316",
    lat: 8.23922,
    lng: -73.35871,
    zone: "Centro",
    address: "Centro, Ocana",
    placeName: "Taller MotoSteel",
    reference: "Pasaje automotriz",
  },
  {
    uid: "demo-link-lavanderia-punto-limpio",
    email: "donjhonnathan+klicor.demo.lavanderia@gmail.com",
    username: "lavanderia-punto-limpio-demo",
    publicLinkId: "demo-link-lavanderia-punto-limpio",
    businessName: "Lavanderia Punto Limpio",
    businessCategory: "services",
    businessType: "laundry",
    headline: "Lavado, secado y cuidado de prendas por encargo",
    subheadline: "Pregunta tiempos y tarifas.",
    color: "0891B2",
    accent: "A7F3D0",
    lat: 8.23492,
    lng: -73.35691,
    zone: "Santa Clara",
    address: "Santa Clara, Ocana",
    placeName: "Lavanderia Punto Limpio",
    reference: "Local azul",
  },
  {
    uid: "demo-link-legal-norte",
    email: "donjhonnathan+klicor.demo.abogados@gmail.com",
    username: "legal-norte-demo",
    publicLinkId: "demo-link-legal-norte",
    businessName: "Legal Norte Abogados",
    businessCategory: "services",
    businessType: "legal",
    headline: "Asesoria legal para personas, familias y negocios",
    subheadline: "Solicita orientacion inicial.",
    color: "1F2937",
    accent: "C6A15B",
    lat: 8.23872,
    lng: -73.35781,
    zone: "Centro",
    address: "Centro, Ocana",
    placeName: "Legal Norte Abogados",
    reference: "Oficina 302",
  },
  {
    uid: "demo-link-contable-aliados",
    email: "donjhonnathan+klicor.demo.contable@gmail.com",
    username: "contable-aliados-demo",
    publicLinkId: "demo-link-contable-aliados",
    businessName: "Contable Aliados",
    businessCategory: "services",
    businessType: "accounting",
    headline: "Contabilidad, impuestos y soporte para pequenos negocios",
    subheadline: "Agenda una llamada por WhatsApp.",
    color: "2563EB",
    accent: "22C55E",
    lat: 8.23622,
    lng: -73.35481,
    zone: "Centro",
    address: "Centro, Ocana",
    placeName: "Contable Aliados",
    reference: "Edificio empresarial",
  },
  {
    uid: "demo-link-gimnasio-fuerza-viva",
    email: "donjhonnathan+klicor.demo.gimnasio@gmail.com",
    username: "gimnasio-fuerza-viva-demo",
    publicLinkId: "demo-link-gimnasio-fuerza-viva",
    businessName: "Gimnasio Fuerza Viva",
    businessCategory: "health_wellness",
    businessType: "gym",
    headline: "Entrenamiento, planes mensuales y comunidad fitness",
    subheadline: "Pregunta por horarios y membresias.",
    color: "DC2626",
    accent: "111827",
    lat: 8.24122,
    lng: -73.35921,
    zone: "Norte",
    address: "Zona norte, Ocana",
    placeName: "Gimnasio Fuerza Viva",
    reference: "Segundo piso, entrada roja",
  },
];

function loadLocalEnv() {
  const envPath = new URL("../.env.local", import.meta.url);
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const cleanLine = line.trim();
    if (!cleanLine || cleanLine.startsWith("#")) continue;
    const separatorIndex = cleanLine.indexOf("=");
    if (separatorIndex === -1) continue;
    const key = cleanLine.slice(0, separatorIndex).trim();
    let value = cleanLine.slice(separatorIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Falta ${name} en .env.local`);
  return value;
}

function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://klicor.com").replace(/\/$/, "");
}

function initFirebaseAdmin() {
  loadLocalEnv();
  if (getApps().length) return;
  initializeApp({
    credential: cert({
      projectId: requireEnv("FIREBASE_PROJECT_ID"),
      clientEmail: requireEnv("FIREBASE_CLIENT_EMAIL"),
      privateKey: requireEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    }),
    storageBucket: requireEnv("FIREBASE_STORAGE_BUCKET"),
  });
}

function slugify(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function initials(value = "") {
  const parts = String(value || "").trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] || "K").concat(parts[1]?.[0] || "").toUpperCase();
}

function storageUrl(bucketName, path) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(path)}?alt=media`;
}

function mapsUrl(lat, lng) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

function normalizePhone(value = "") {
  return String(value || "").replace(/\D/g, "");
}

function whatsappUrl(phone, message) {
  return `https://wa.me/57${normalizePhone(phone)}?text=${encodeURIComponent(message)}`;
}

function businessHours() {
  return {
    enabled: true,
    timezone: "America/Bogota",
    allowOrdersWhenClosed: false,
    days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].map((day) => ({
      day,
      isOpen: true,
      mode: day === "saturday" ? "continuous" : "split",
      shifts: day === "saturday"
        ? [{ start: "08:00", end: "14:00" }]
        : [{ start: "08:00", end: "12:00" }, { start: "14:00", end: "18:00" }],
    })).concat([{ day: "sunday", isOpen: false, mode: "continuous", shifts: [{ start: "09:00", end: "13:00" }] }]),
  };
}

function bookingSchedule() {
  return [
    { dayOfWeek: 1, isOpen: true, isWorking: true, shiftMode: "continuous", startTime: "09:00", endTime: "18:00", secondStartTime: "14:00", secondEndTime: "18:00" },
    { dayOfWeek: 2, isOpen: true, isWorking: true, shiftMode: "continuous", startTime: "09:00", endTime: "18:00", secondStartTime: "14:00", secondEndTime: "18:00" },
    { dayOfWeek: 3, isOpen: true, isWorking: true, shiftMode: "continuous", startTime: "09:00", endTime: "18:00", secondStartTime: "14:00", secondEndTime: "18:00" },
    { dayOfWeek: 4, isOpen: true, isWorking: true, shiftMode: "continuous", startTime: "09:00", endTime: "18:00", secondStartTime: "14:00", secondEndTime: "18:00" },
    { dayOfWeek: 5, isOpen: true, isWorking: true, shiftMode: "continuous", startTime: "09:00", endTime: "18:00", secondStartTime: "14:00", secondEndTime: "18:00" },
    { dayOfWeek: 6, isOpen: true, isWorking: true, shiftMode: "continuous", startTime: "09:00", endTime: "15:00", secondStartTime: "14:00", secondEndTime: "18:00" },
    { dayOfWeek: 0, isOpen: false, isWorking: false, shiftMode: "continuous", startTime: "09:00", endTime: "14:00", secondStartTime: "14:00", secondEndTime: "18:00" },
  ];
}

function paymentMethods() {
  return [{
    id: "payment-method-breb",
    entityId: "breb",
    accountType: "",
    accountNumber: "",
    brebKey: "demo@klicor",
    qrImageUrl: "",
    qrPath: "",
  }];
}

function profileLinks(business) {
  const message = `Hola, vi el Klicor de ${business.businessName} y quiero mas informacion.`;
  return [
    {
      id: "whatsapp-main",
      type: "whatsapp",
      label: "WhatsApp",
      value: DEMO_WHATSAPP,
      message,
      priorityTier: business.booking ? 2 : 1,
      url: whatsappUrl(DEMO_WHATSAPP, message),
    },
    {
      id: "maps-main",
      type: "maps",
      label: "Ubicacion",
      value: mapsUrl(business.lat, business.lng),
      message: "",
      priorityTier: 2,
      url: mapsUrl(business.lat, business.lng),
    },
    {
      id: "website-main",
      type: "website",
      label: "Klicor.com",
      value: getAppUrl(),
      message: "",
      priorityTier: 2,
      url: getAppUrl(),
    },
    {
      id: "instagram-main",
      type: "instagram",
      label: "Instagram",
      value: SOCIALS.instagram,
      message: "",
      priorityTier: 3,
      url: SOCIALS.instagram,
    },
    {
      id: "facebook-main",
      type: "facebook",
      label: "Facebook",
      value: SOCIALS.facebook,
      message: "",
      priorityTier: 3,
      url: SOCIALS.facebook,
    },
    {
      id: "tiktok-main",
      type: "tiktok",
      label: "TikTok",
      value: SOCIALS.tiktok,
      message: "",
      priorityTier: 3,
      url: SOCIALS.tiktok,
    },
  ];
}

function legacyLinks(links = []) {
  return Object.fromEntries(links.map((item) => [item.type, item.value]));
}

function appearance(business) {
  return {
    presetId: "klicor",
    advancedEnabled: true,
    primaryColor: `#${business.color}`,
    secondaryColor: `#${business.accent || "22A98A"}`,
    tertiaryColor: "#F4EEFF",
    backgroundColor: "#F8FAFC",
    surfaceColor: "#FFFFFF",
    textPrimaryColor: "#0F172A",
    textSecondaryColor: "#64748B",
    buttonTextColor: "#FFFFFF",
    buttonPrimaryTextColor: "#FFFFFF",
    buttonSecondaryTextColor: "#FFFFFF",
    buttonTertiaryTextColor: "#111827",
    buttonStyle: "solid",
    buttonRadius: "rounded",
    cardTransparency: "solid",
    cardShadow: "soft",
    socialStyle: "icons",
    fontFamily: "inter",
    nameSize: "m",
    nameWeight: "regular",
    avatarShape: "rounded",
  };
}

async function saveWebp(bucket, path, buffer) {
  if (!WRITE) return;
  await bucket.file(path).save(buffer, {
    metadata: {
      contentType: "image/webp",
      cacheControl: CACHE_CONTROL,
    },
    resumable: false,
    public: true,
  });
}

async function buildLogoMedia(bucket, business) {
  const outputPath = `demo-linkbio-assets/${business.uid}/${slugify(business.businessName)}-logo.webp`;
  const safeName = String(business.businessName || "Demo").replace(/[&<>]/g, "");
  const svg = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <rect width="512" height="512" rx="112" fill="#${business.color}"/>
      <circle cx="384" cy="126" r="92" fill="#${business.accent || "ffffff"}" opacity="0.26"/>
      <circle cx="118" cy="374" r="118" fill="#ffffff" opacity="0.10"/>
      <text x="256" y="276" text-anchor="middle" font-family="Arial, sans-serif" font-size="128" font-weight="800" fill="#ffffff">${initials(safeName)}</text>
      <text x="256" y="404" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" font-weight="700" fill="#ffffff" opacity="0.88">${safeName.slice(0, 18)}</text>
    </svg>
  `);
  const output = await sharp(svg).webp({ quality: 88 }).toBuffer();
  await saveWebp(bucket, outputPath, output);
  const url = storageUrl(bucket.name, outputPath);
  return {
    photo: url,
    photoThumb: url,
    photoPath: outputPath,
    photoThumbPath: outputPath,
  };
}

async function buildCoverMedia(bucket, business) {
  const sourceId = COVER_SOURCES[business.businessType] || COVER_SOURCES.local_experience;
  const sourceUrl = `https://images.unsplash.com/${sourceId}?auto=format&fit=crop&w=1600&h=1100&q=84`;
  const response = await fetch(sourceUrl, {
    headers: {
      "user-agent": "Klicor linkbio demo seed",
      accept: "image/avif,image/webp,image/png,image/jpeg,image/*,*/*",
    },
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`No se pudo descargar portada para ${business.uid}: ${response.status}`);
  const input = Buffer.from(await response.arrayBuffer());
  const output = await sharp(input)
    .rotate()
    .resize({ width: 1200, height: 800, fit: "cover", position: "centre" })
    .webp({ quality: 84 })
    .toBuffer();
  const outputPath = `demo-linkbio-assets/${business.uid}/${slugify(business.businessName)}-cover.webp`;
  await saveWebp(bucket, outputPath, output);
  return {
    coverImageUrl: storageUrl(bucket.name, outputPath),
    coverImagePath: outputPath,
    coverImageSource: "curated-unsplash",
  };
}

async function buildSimpleMedia(bucket, business, kind, name, color = "") {
  const id = slugify(`${kind}-${name}`) || crypto.randomBytes(4).toString("hex");
  const outputPath = `demo-linkbio-assets/${business.uid}/${id}.webp`;
  const safeName = String(name || "Demo").replace(/[&<>]/g, "");
  const fill = String(color || business.accent || business.color).replace(/[^0-9A-Fa-f]/g, "").slice(0, 6) || business.color;
  const svg = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <rect width="512" height="512" rx="96" fill="#${fill}"/>
      <circle cx="154" cy="142" r="104" fill="#ffffff" opacity="0.14"/>
      <circle cx="370" cy="360" r="132" fill="#000000" opacity="0.10"/>
      <text x="256" y="268" text-anchor="middle" font-family="Arial, sans-serif" font-size="104" font-weight="800" fill="#ffffff">${initials(safeName)}</text>
      <text x="256" y="366" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#ffffff" opacity="0.9">${safeName.slice(0, 20)}</text>
    </svg>
  `);
  const output = await sharp(svg).webp({ quality: 88 }).toBuffer();
  await saveWebp(bucket, outputPath, output);
  return {
    url: storageUrl(bucket.name, outputPath),
    path: outputPath,
  };
}

async function deleteCollection(collectionRef) {
  const snap = await collectionRef.get();
  if (snap.empty) return;
  const db = getFirestore();
  let batch = db.batch();
  let count = 0;
  for (const doc of snap.docs) {
    batch.delete(doc.ref);
    count += 1;
    if (count === 450) {
      await batch.commit();
      batch = db.batch();
      count = 0;
    }
  }
  if (count) await batch.commit();
}

async function upsertAuthUser(auth, business, logoUrl) {
  try {
    await auth.getUser(business.uid);
    if (!WRITE) return;
    await auth.updateUser(business.uid, {
      email: business.email,
      displayName: business.businessName,
      photoURL: logoUrl,
      password: DEMO_PASSWORD,
      disabled: false,
      emailVerified: true,
    });
  } catch (error) {
    if (error.code !== "auth/user-not-found") throw error;
    if (!WRITE) return;
    await auth.createUser({
      uid: business.uid,
      email: business.email,
      displayName: business.businessName,
      photoURL: logoUrl,
      password: DEMO_PASSWORD,
      disabled: false,
      emailVerified: true,
    });
  }
}

async function seedBooking(userRef, bucket, business) {
  await Promise.all([
    deleteCollection(userRef.collection("bookingServices")),
    deleteCollection(userRef.collection("bookingStaff")),
    deleteCollection(userRef.collection("bookingAppointments")),
    deleteCollection(userRef.collection("bookingCustomers")),
  ]);

  const staff = await Promise.all((business.staff || []).map(async (member) => {
    const media = await buildSimpleMedia(bucket, business, "staff", member.name, business.color);
    return {
      id: member.id,
      name: member.name,
      roleOrSpecialty: member.roleOrSpecialty || "",
      isActive: true,
      serviceIds: (business.services || []).map((service) => service.id),
      schedule: bookingSchedule(),
      photoUrl: media.url,
      photoThumbUrl: media.url,
      photoPath: media.path,
      photoThumbPath: media.path,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
  }));
  const services = await Promise.all((business.services || []).map(async (service) => {
    const media = await buildSimpleMedia(bucket, business, "service", service.name, business.accent);
    return {
      id: service.id,
      name: service.name,
      description: service.description || "",
      durationMinutes: service.durationMinutes,
      price: service.price,
      isActive: true,
      staffIds: staff.map((member) => member.id),
      photoUrl: media.url,
      photoThumbUrl: media.url,
      photoPath: media.path,
      photoThumbPath: media.path,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
  }));

  if (!WRITE) return { services: services.length, staff: staff.length };

  const batch = getFirestore().batch();
  for (const service of services) {
    batch.set(userRef.collection("bookingServices").doc(service.id), service, { merge: true });
  }
  for (const member of staff) {
    batch.set(userRef.collection("bookingStaff").doc(member.id), member, { merge: true });
  }
  await batch.commit();
  return { services: services.length, staff: staff.length };
}

async function seedProfile(db, auth, bucket, business) {
  const userRef = db.collection("users").doc(business.uid);
  const [logo, cover] = await Promise.all([
    buildLogoMedia(bucket, business),
    buildCoverMedia(bucket, business),
  ]);
  const links = profileLinks(business);
  await upsertAuthUser(auth, business, logo.photo);

  const bookingConfig = business.booking
    ? {
      enabled: true,
      allowStaffSelection: true,
      autoConfirmBooking: true,
      whatsappNumber: DEMO_WHATSAPP,
      noticeMinutes: 30,
      maxDaysAhead: 30,
      notifyBusinessOnRequest: true,
      notifyCustomerOnConfirmation: true,
      reminderEnabled: true,
      reminderMinutesBefore: 60,
      reactivationEnabled: false,
      reactivationDays: 30,
      businessSchedule: bookingSchedule(),
    }
    : { enabled: false };

  const payload = {
    uid: business.uid,
    email: business.email,
    username: business.username,
    usernameLower: business.username,
    publicLinkId: business.publicLinkId,
    role: "user",
    status: "active",
    accountStatus: "active",
    plan: "commercial",
    commercialModule: business.booking ? "booking" : "",
    moduleAccess: {
      commerce: false,
      booking: Boolean(business.booking),
    },
    trialEndsAt: null,
    expiresAt: null,
    onboardingCompleted: true,
    businessName: business.businessName,
    businessCategory: business.businessCategory,
    businessType: business.businessType,
    businessHeadline: business.headline,
    businessSubheadline: business.subheadline,
    city: "Ocana",
    phone: DEMO_WHATSAPP,
    ...logo,
    profileLinks: links,
    links: legacyLinks(links),
    paymentMethods: paymentMethods(),
    paymentQrUrl: "",
    paymentQrPath: "",
    contactCardEnabled: true,
    contactCardName: business.businessName,
    contactCardTitle: business.businessType,
    contactCardWhatsappLinkId: "whatsapp-main",
    contactCardPhone: DEMO_WHATSAPP,
    billingProfile: {
      legalName: business.businessName,
      documentType: "nit",
      documentNumber: "",
      verificationDigit: "",
      taxResponsibility: "",
      billingEmail: business.email,
      billingPhone: DEMO_WHATSAPP,
      address: business.address,
      city: "Ocana",
      department: "Norte de Santander",
      country: "Colombia",
    },
    businessHours: businessHours(),
    dorikaProfile: {
      enabled: true,
      showLocation: true,
      locationPrivacy: "exact",
      city: "Ocana",
      zone: business.zone,
      address: business.address,
      placeName: business.placeName,
      floor: "",
      unit: "",
      reference: business.reference,
      arrivalInstructions: business.reference,
      latitude: business.lat,
      longitude: business.lng,
      locationAccuracyMeters: 12,
      mapLocationUpdatedAt: new Date().toISOString(),
      ...cover,
      description: business.headline,
      category: business.businessCategory,
      businessType: business.businessType,
      featuredProductIds: [],
    },
    commerceMode: "",
    commerce: {
      activeMode: "",
      orderWhatsapp: DEMO_WHATSAPP,
      currency: "COP",
      categoriesCount: 0,
      subcategoriesCount: 0,
      productsCount: 0,
      visibleProductsCount: 0,
      hasContent: false,
      updatedAt: FieldValue.serverTimestamp(),
    },
    settings: appearance(business),
    customThemes: [],
    bookingConfig,
    updatedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
  };

  if (WRITE) {
    await Promise.all([
      userRef.set(payload, { merge: true }),
      db.collection("usernames").doc(business.username).set({
        uid: business.uid,
        current: true,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true }),
      db.collection("publicLinks").doc(business.publicLinkId).set({
        uid: business.uid,
        username: business.username,
        active: true,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true }),
      deleteCollection(userRef.collection("commerceCategories")),
      deleteCollection(userRef.collection("commerceSubcategories")),
      deleteCollection(userRef.collection("commerceProducts")),
      deleteCollection(userRef.collection("commercePublicSections")),
    ]);
  }

  const booking = business.booking ? await seedBooking(userRef, bucket, business) : { services: 0, staff: 0 };
  return {
    name: business.businessName,
    username: business.username,
    category: business.businessCategory,
    type: business.businessType,
    booking: business.booking ? "si" : "no",
    services: booking.services,
    staff: booking.staff,
    url: `${getAppUrl()}/${business.username}`,
  };
}

async function updateExistingDemoWhatsapp(db) {
  if (!UPDATE_EXISTING_WHATSAPP) return [];
  const snap = await db.collection("users").get();
  const docs = snap.docs.filter((doc) => doc.id.startsWith("demo-") && !DEMO_PROFILES.some((item) => item.uid === doc.id));
  const results = [];

  for (const doc of docs) {
    const data = doc.data();
    const currentLinks = Array.isArray(data.profileLinks) ? data.profileLinks : [];
    const updatedLinks = currentLinks.map((link) => {
      if (link.type !== "whatsapp") return link;
      const message = link.message || `Hola, vi el Klicor de ${data.businessName || "este negocio"} y quiero mas informacion.`;
      return {
        ...link,
        value: DEMO_WHATSAPP,
        message,
        url: whatsappUrl(DEMO_WHATSAPP, message),
      };
    });
    const hasWhatsapp = updatedLinks.some((link) => link.type === "whatsapp");
    const nextLinks = hasWhatsapp
      ? updatedLinks
      : [{
        id: "whatsapp-main",
        type: "whatsapp",
        label: "WhatsApp",
        value: DEMO_WHATSAPP,
        message: `Hola, vi el Klicor de ${data.businessName || "este negocio"} y quiero mas informacion.`,
        priorityTier: 1,
        url: whatsappUrl(DEMO_WHATSAPP, `Hola, vi el Klicor de ${data.businessName || "este negocio"} y quiero mas informacion.`),
      }, ...updatedLinks];

    if (WRITE) {
      await doc.ref.set({
        phone: DEMO_WHATSAPP,
        profileLinks: nextLinks,
        links: {
          ...(data.links || {}),
          whatsapp: DEMO_WHATSAPP,
        },
        contactCardPhone: DEMO_WHATSAPP,
        billingProfile: {
          ...(data.billingProfile || {}),
          billingPhone: DEMO_WHATSAPP,
        },
        commerce: {
          ...(data.commerce || {}),
          orderWhatsapp: DEMO_WHATSAPP,
          updatedAt: FieldValue.serverTimestamp(),
        },
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    results.push({
      uid: doc.id,
      businessName: data.businessName || doc.id,
      username: data.usernameLower || data.username || "",
    });
  }

  return results;
}

async function main() {
  initFirebaseAdmin();
  const db = getFirestore();
  const auth = getAuth();
  const bucket = getStorage().bucket();
  const results = [];

  for (const business of DEMO_PROFILES) {
    results.push(await seedProfile(db, auth, bucket, business));
  }
  const updatedStores = await updateExistingDemoWhatsapp(db);

  console.table(results);
  console.log(`${WRITE ? "Aplicado" : "Dry-run"}: ${results.length} perfiles link in bio demo.`);
  console.log(`${WRITE ? "Actualizadas" : "Detectadas"} tiendas demo existentes para WhatsApp: ${updatedStores.length}`);
  console.log(`WhatsApp demo: ${DEMO_WHATSAPP}`);
  console.log(`Contrasena demo: ${DEMO_PASSWORD}`);
  if (!WRITE) console.log("Ejecuta con --write --update-existing-whatsapp para aplicar.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
