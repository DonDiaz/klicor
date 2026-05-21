import { existsSync, readFileSync } from "node:fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const DEMO_WHATSAPP = "3137681576";
const DEMO_UIDS = [
  "demo-link-barberia-norte",
  "demo-link-aura-nails",
  "demo-link-bienestar-serena",
  "demo-link-glamping-brisas",
  "demo-link-hotel-plaza",
  "demo-link-cancha-la-10",
  "demo-link-plomeria-express",
  "demo-link-taller-motosteel",
  "demo-link-lavanderia-punto-limpio",
  "demo-link-legal-norte",
  "demo-link-contable-aliados",
  "demo-link-gimnasio-fuerza-viva",
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

async function main() {
  initFirebaseAdmin();
  const db = getFirestore();
  const results = [];

  for (const uid of DEMO_UIDS) {
    const ref = db.collection("users").doc(uid);
    const snap = await ref.get();
    if (!snap.exists) {
      results.push({ uid, exists: false });
      continue;
    }
    const data = snap.data();
    const [services, staff] = await Promise.all([
      ref.collection("bookingServices").count().get(),
      ref.collection("bookingStaff").count().get(),
    ]);
    results.push({
      uid,
      exists: true,
      username: data.usernameLower || data.username || "",
      whatsapp: data.profileLinks?.find((item) => item.type === "whatsapp")?.value || "",
      bookingEnabled: Boolean(data.bookingConfig?.enabled),
      moduleBooking: Boolean(data.moduleAccess?.booking),
      services: services.data().count || 0,
      staff: staff.data().count || 0,
      hasLogo: Boolean(data.photoPath),
      hasCover: Boolean(data.dorikaProfile?.coverImagePath),
      hasMap: Boolean(data.dorikaProfile?.latitude && data.dorikaProfile?.longitude),
      paymentMethods: Array.isArray(data.paymentMethods) ? data.paymentMethods.length : 0,
    });
  }

  const existingSnap = await db.collection("users").get();
  const oldDemoStores = existingSnap.docs
    .filter((doc) => doc.id.startsWith("demo-") && !DEMO_UIDS.includes(doc.id))
    .filter((doc) => doc.data().commerce?.hasContent || doc.data().commerce?.productsCount);
  const oldStoresWithWhatsapp = oldDemoStores.filter((doc) => (
    doc.data().profileLinks?.some((item) => item.type === "whatsapp" && item.value === DEMO_WHATSAPP)
    || doc.data().commerce?.orderWhatsapp === DEMO_WHATSAPP
  ));

  console.table(results);
  console.log(`Perfiles nuevos verificados: ${results.filter((item) => item.exists).length}/${DEMO_UIDS.length}`);
  console.log(`Tiendas demo antiguas con WhatsApp actualizado: ${oldStoresWithWhatsapp.length}/${oldDemoStores.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
