import { existsSync, readFileSync } from "node:fs";
import crypto from "node:crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import sharp from "sharp";

const WRITE = process.argv.includes("--write");
const ONLY_UID = readArg("--uid");
const DEMO_UID_PREFIX = "demo-";
const CACHE_CONTROL = "public, max-age=31536000, immutable";

const PRODUCT_VARIANTS = {
  thumb: { size: 384, quality: 76 },
  card: { size: 768, quality: 80 },
  large: { size: 1440, quality: 82, fit: "inside" },
};

const LOGO_VARIANT = { size: 256, quality: 82 };
const PUBLIC_PAGE_SIZE = 24;

function readArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return "";
  return String(process.argv[index + 1] || "").trim();
}

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

function isExternalDemoImage(url = "") {
  return /^https:\/\/(loremflickr\.com|ui-avatars\.com)\//i.test(String(url || "").trim());
}

function slugify(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function imageHash(sourceUrl = "") {
  return crypto.createHash("sha1").update(String(sourceUrl)).digest("hex").slice(0, 10);
}

function storageUrl(bucketName, path) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(path)}?alt=media`;
}

function addBytes(target, key, bytes = 0) {
  target[key] = (target[key] || 0) + Number(bytes || 0);
}

function formatMb(bytes = 0) {
  return `${(Number(bytes || 0) / 1024 / 1024).toFixed(2)} MB`;
}

async function fetchImageBuffer(url) {
  let response = null;
  let lastError = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      response = await fetch(url, {
        headers: {
          "user-agent": "Klicor demo image migration",
          accept: "image/avif,image/webp,image/*,*/*",
        },
        redirect: "follow",
      });
      break;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }

  if (!response) {
    throw lastError || new Error(`No se pudo descargar ${url}`);
  }

  if (!response.ok) {
    throw new Error(`No se pudo descargar ${url}: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`La URL no devolvio una imagen (${contentType}): ${url}`);
  }

  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    contentType,
    finalUrl: response.url || url,
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

async function buildProductVariants(bucket, uid, productId, productName, imageId, sourceUrl, stats) {
  const fetched = await fetchImageBuffer(sourceUrl);
  addBytes(stats.original, "products", fetched.buffer.length);

  const image = sharp(fetched.buffer).rotate();
  const metadata = await image.metadata();
  const hash = imageHash(fetched.finalUrl || sourceUrl);
  const cleanName = slugify(productName || productId) || productId;
  const basePath = `demo-products/${uid}/${productId}`;
  const variants = {};

  for (const [variantName, config] of Object.entries(PRODUCT_VARIANTS)) {
    const path = `${basePath}/${cleanName}-${hash}-${variantName}.webp`;
    const transformer = image.clone();
    const output = await transformer
      .resize({
        width: config.size,
        height: config.size,
        fit: config.fit || "cover",
        position: "centre",
        withoutEnlargement: true,
      })
      .webp({ quality: config.quality })
      .toBuffer();

    await saveWebp(bucket, path, output);
    addBytes(stats.generated, variantName, output.length);

    variants[variantName] = {
      variant: variantName,
      width: config.size,
      height: config.size,
      bytes: output.length,
      contentType: "image/webp",
      path,
      url: storageUrl(bucket.name, path),
    };
  }

  return {
    id: imageId,
    originalUrl: sourceUrl,
    migratedAt: new Date().toISOString(),
    imageUrl: variants.large.url,
    imageCardUrl: variants.card.url,
    imageThumbUrl: variants.thumb.url,
    imagePath: variants.large.path,
    imageCardPath: variants.card.path,
    imageThumbPath: variants.thumb.path,
    imageWidth: Number(metadata.width || 0) || 0,
    imageHeight: Number(metadata.height || 0) || 0,
    variants,
  };
}

async function buildLogoVariant(bucket, uid, businessName, sourceUrl, stats) {
  const fetched = await fetchImageBuffer(sourceUrl);
  addBytes(stats.original, "logos", fetched.buffer.length);

  const hash = imageHash(fetched.finalUrl || sourceUrl);
  const cleanName = slugify(businessName || uid) || uid;
  const path = `demo-assets/${uid}/${cleanName}-${hash}-logo.webp`;
  const output = await sharp(fetched.buffer)
    .rotate()
    .resize(LOGO_VARIANT.size, LOGO_VARIANT.size, {
      fit: "cover",
      position: "centre",
      withoutEnlargement: true,
    })
    .webp({ quality: LOGO_VARIANT.quality })
    .toBuffer();

  await saveWebp(bucket, path, output);
  addBytes(stats.generated, "logos", output.length);

  return {
    photo: storageUrl(bucket.name, path),
    photoThumb: storageUrl(bucket.name, path),
    photoPath: path,
    photoThumbPath: path,
    photoMetadata: {
      originalUrl: sourceUrl,
      migratedAt: new Date().toISOString(),
      variant: "logo",
      width: LOGO_VARIANT.size,
      height: LOGO_VARIANT.size,
      bytes: output.length,
      contentType: "image/webp",
      path,
    },
  };
}

function withUpdatedProductImages(product, uploaded) {
  const images = Array.isArray(product.images) ? product.images : [];
  const nextImages = images.length
    ? images.map((image, index) => index === 0 ? {
      ...image,
      ...uploaded,
      id: image.id || uploaded.id || "image-1",
    } : image)
    : [uploaded];

  return {
    imageUrl: uploaded.imageUrl,
    imageCardUrl: uploaded.imageCardUrl,
    imageThumbUrl: uploaded.imageThumbUrl,
    imagePath: uploaded.imagePath,
    imageCardPath: uploaded.imageCardPath,
    imageThumbPath: uploaded.imageThumbPath,
    imageWidth: uploaded.imageWidth,
    imageHeight: uploaded.imageHeight,
    images: nextImages,
    updatedAt: FieldValue.serverTimestamp(),
  };
}

async function migrateProductDoc(batch, bucket, productDoc, uid, stats) {
  const product = productDoc.data();
  const sourceUrl = String(product.originalUrl || product.imageUrl || product.imageThumbUrl || product.images?.[0]?.originalUrl || product.images?.[0]?.imageUrl || "").trim();
  if (!isExternalDemoImage(sourceUrl)) return { skipped: 1 };

  const imageId = String(product.images?.[0]?.id || "image-1").trim() || "image-1";
  const uploaded = await buildProductVariants(bucket, uid, productDoc.id, product.name, imageId, sourceUrl, stats);
  if (WRITE) batch.set(productDoc.ref, withUpdatedProductImages(product, uploaded), { merge: true });
  return {
    migrated: 1,
    product: {
      ...product,
      id: productDoc.id,
      ...withUpdatedProductImages(product, uploaded),
    },
  };
}

function productSummary(product) {
  return {
    id: product.id,
    mode: product.mode,
    categoryId: product.categoryId,
    subcategoryId: product.subcategoryId || "",
    name: product.name,
    description: product.description || "",
    price: product.price ?? null,
    featuredInDorika: Boolean(product.featuredInDorika),
    orderIndex: Number(product.orderIndex || 0) || 0,
    imageUrl: product.imageUrl || "",
    imageCardUrl: product.imageCardUrl || product.imageUrl || product.imageThumbUrl || "",
    imageThumbUrl: product.imageThumbUrl || product.imageCardUrl || product.imageUrl || "",
    imageWidth: product.imageWidth || 0,
    imageHeight: product.imageHeight || 0,
    images: Array.isArray(product.images)
      ? product.images.map((item) => ({
        id: item.id,
        imageUrl: item.imageUrl || "",
        imageCardUrl: item.imageCardUrl || item.imageUrl || item.imageThumbUrl || "",
        imageThumbUrl: item.imageThumbUrl || item.imageCardUrl || item.imageUrl || "",
        imageWidth: item.imageWidth || 0,
        imageHeight: item.imageHeight || 0,
        variants: item.variants || {},
      }))
      : [],
  };
}

async function refreshPublicSections(batch, userDoc, migratedProductsById) {
  const [categoriesSnap, productsSnap] = await Promise.all([
    userDoc.ref.collection("commerceCategories").orderBy("orderIndex").get(),
    userDoc.ref.collection("commerceProducts").where("visible", "==", true).get(),
  ]);

  const products = productsSnap.docs
    .map((doc) => migratedProductsById.get(doc.id) || { id: doc.id, ...doc.data() })
    .sort((left, right) => (Number(left.orderIndex || 0) || 0) - (Number(right.orderIndex || 0) || 0));

  for (const categoryDoc of categoriesSnap.docs) {
    const category = { id: categoryDoc.id, ...categoryDoc.data() };
    const categoryProducts = products.filter((product) => product.categoryId === category.id);
    const pageProducts = categoryProducts.slice(0, PUBLIC_PAGE_SIZE);
    const preview = categoryProducts[0] || null;
    const previewImage = preview
      ? {
        imageUrl: preview.imageUrl || "",
        imageCardUrl: preview.imageCardUrl || preview.imageUrl || preview.imageThumbUrl || "",
        imageThumbUrl: preview.imageThumbUrl || preview.imageCardUrl || preview.imageUrl || "",
      }
      : null;

    batch.set(userDoc.ref.collection("commerceCategories").doc(category.id), {
      imageUrl: previewImage?.imageUrl || category.imageUrl || "",
      imageCardUrl: previewImage?.imageCardUrl || category.imageCardUrl || "",
      imageThumbUrl: previewImage?.imageThumbUrl || category.imageThumbUrl || "",
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    batch.set(userDoc.ref.collection("commercePublicSections").doc(`cat_${category.id}`), {
      type: "category",
      categoryId: category.id,
      subcategoryId: "",
      subcategories: [],
      products: pageProducts.map(productSummary),
      previewImage,
      hasMore: categoryProducts.length > PUBLIC_PAGE_SIZE,
      nextCursor: categoryProducts.length > PUBLIC_PAGE_SIZE ? pageProducts.at(-1)?.orderIndex || null : null,
      pageSize: PUBLIC_PAGE_SIZE,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  }
}

async function migrateBusiness(userDoc, bucket) {
  const uid = userDoc.id;
  const data = userDoc.data();
  const stats = {
    original: {},
    generated: {},
  };
  const result = {
    uid,
    businessName: data.businessName || uid,
    logos: 0,
    products: 0,
    skippedProducts: 0,
    originalMb: "0.00 MB",
    thumbMb: "0.00 MB",
    cardMb: "0.00 MB",
    largeMb: "0.00 MB",
  };

  const db = getFirestore();
  const batch = db.batch();

  if (isExternalDemoImage(data.photo || data.photoThumb)) {
    const uploadedLogo = await buildLogoVariant(bucket, uid, data.businessName || uid, data.photo || data.photoThumb, stats);
    result.logos += 1;
    if (WRITE) {
      batch.set(userDoc.ref, {
        ...uploadedLogo,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
  }

  const productsSnap = await userDoc.ref.collection("commerceProducts").get();
  const migratedProductsById = new Map();
  for (const productDoc of productsSnap.docs) {
    const productResult = await migrateProductDoc(batch, bucket, productDoc, uid, stats);
    result.products += productResult.migrated || 0;
    result.skippedProducts += productResult.skipped || 0;
    if (productResult.product) migratedProductsById.set(productDoc.id, productResult.product);
  }

  result.originalMb = formatMb((stats.original.products || 0) + (stats.original.logos || 0));
  result.thumbMb = formatMb(stats.generated.thumb || 0);
  result.cardMb = formatMb(stats.generated.card || 0);
  result.largeMb = formatMb(stats.generated.large || 0);

  if (WRITE && result.products) {
    await refreshPublicSections(batch, userDoc, migratedProductsById);
  }

  if (WRITE && (result.logos || result.products)) {
    await batch.commit();
  }

  return result;
}

async function main() {
  initFirebaseAdmin();
  const db = getFirestore();
  const bucket = getStorage().bucket();

  let query = db.collection("users").where("uid", ">=", DEMO_UID_PREFIX).where("uid", "<", `${DEMO_UID_PREFIX}\uf8ff`);
  if (ONLY_UID) query = db.collection("users").where("uid", "==", ONLY_UID);

  const snap = await query.get();
  const results = [];

  for (const userDoc of snap.docs) {
    results.push(await migrateBusiness(userDoc, bucket));
  }

  console.table(results);
  console.log(WRITE ? "Migracion aplicada." : "Dry-run: no se escribio nada. Ejecuta con --write para aplicar.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
