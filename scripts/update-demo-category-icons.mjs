import { existsSync, readFileSync } from "node:fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldPath, FieldValue, getFirestore } from "firebase-admin/firestore";
import { resolveDemoCategoryIcon } from "./demo-category-icons.mjs";

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
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

function needsUpdate(current, next) {
  return Object.entries(next).some(([key, value]) => String(current[key] || "") !== String(value || ""));
}

async function main() {
  initFirebaseAdmin();
  const write = process.argv.includes("--write");
  const db = getFirestore();
  const usersSnap = await db.collection("users")
    .where(FieldPath.documentId(), ">=", "demo-")
    .where(FieldPath.documentId(), "<", "demo.")
    .get();

  let demoCount = 0;
  let checked = 0;
  let changed = 0;
  let batch = db.batch();
  let batchWrites = 0;
  const nonTarget = [];

  for (const userDoc of usersSnap.docs) {
    demoCount += 1;
    const business = userDoc.data() || {};
    const categoriesSnap = await userDoc.ref.collection("commerceCategories").get();

    for (const categoryDoc of categoriesSnap.docs) {
      checked += 1;
      const current = categoryDoc.data() || {};
      const name = String(current.name || "").trim();
      if (!name) continue;

      const next = resolveDemoCategoryIcon(name, business);

      if (!next.iconKey.startsWith("target_")) {
        nonTarget.push(`${userDoc.id}/${categoryDoc.id}: ${name} -> ${next.iconKey}`);
      }

      if (!needsUpdate(current, next)) continue;

      changed += 1;
      console.log(`${write ? "Actualizando" : "Pendiente"} ${userDoc.id}/${categoryDoc.id}: ${name} -> ${next.iconKey}`);
      if (!write) continue;

      batch.update(categoryDoc.ref, {
        ...next,
        updatedAt: FieldValue.serverTimestamp(),
      });
      batchWrites += 1;
      if (batchWrites >= 450) {
        await batch.commit();
        batch = db.batch();
        batchWrites = 0;
      }
    }
  }

  if (write && batchWrites) await batch.commit();

  console.log(JSON.stringify({
    mode: write ? "write" : "dry-run",
    demoStores: demoCount,
    categoriesChecked: checked,
    categoriesChanged: changed,
    nonTargetCount: nonTarget.length,
    nonTarget,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
