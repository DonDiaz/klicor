import { existsSync, readFileSync } from "node:fs";
import crypto from "node:crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import sharp from "sharp";

const WRITE = process.argv.includes("--write");
const FORCE = process.argv.includes("--force");
const ONLY_UID = readArg("--uid");
const LIMIT = Number(readArg("--limit") || 0) || 0;
const DELAY_MS = Number(readArg("--delay-ms") || 900) || 0;
const CACHE_CONTROL = "public, max-age=31536000, immutable";
const PUBLIC_PAGE_SIZE = 24;

const PRODUCT_VARIANTS = {
  thumb: { size: 384, quality: 78 },
  card: { size: 768, quality: 82 },
  large: { size: 1440, quality: 84, fit: "inside" },
};

const COVER_VARIANT = { width: 1200, height: 900, quality: 84 };
const LOGO_VARIANT = { size: 512, quality: 86 };

const BUSINESS_MEDIA_QUERIES = {
  restaurant: "restaurant food table",
  pizza: "pizza restaurant",
  cafe: "coffee shop",
  pharmacy: "pharmacy medicine shelves",
  stationery: "stationery shop notebooks",
  supermarket: "grocery store produce",
  neighborhood_store: "small grocery store",
  hardware: "hardware tools store",
  beauty_products: "beauty products cosmetics",
  technology: "electronics store gadgets",
  pet_shop: "pet shop dog food",
  clothing_mixed: "clothing store fashion",
  jewelry: "jewelry store necklace",
  gifts: "gift shop handmade craft",
  shoes: "shoe store sneakers",
};

const CURATED_UNSPLASH = {
  jewelry: "photo-1515562141207-7a88fb7ce338",
  beauty: "photo-1522335789203-aabd1fc54bc9",
  pharmacy: "photo-1584308666744-24d5c474f2ae",
  hardware: "photo-1504148455328-c376907d081c",
  grocery: "photo-1542838132-92c53300491e",
  tech: "photo-1516321318423-f06f85e504b3",
  pet: "photo-1583337130417-3346a1be7dee",
  fashion: "photo-1445205170230-053b83016050",
  pizza: "photo-1513104890138-7c749659a591",
  burger: "photo-1568901346375-23c9450c58cd",
  coffee: "photo-1495474472287-4d71bcdd2085",
  stationery: "photo-1517842645767-c639042777db",
  shoes: "photo-1549298916-b41d501d3772",
  bakery: "photo-1555507036-ab1f4038808a",
};

const BUSINESS_CURATED_KEYS = {
  restaurant: "burger",
  pizza: "pizza",
  cafe: "coffee",
  pharmacy: "pharmacy",
  stationery: "stationery",
  supermarket: "grocery",
  neighborhood_store: "grocery",
  hardware: "hardware",
  beauty_products: "beauty",
  technology: "tech",
  pet_shop: "pet",
  clothing_mixed: "fashion",
  jewelry: "jewelry",
  gifts: "stationery",
  shoes: "shoes",
};

const IMAGE_BUFFER_CACHE = new Map();

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
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return (parts[0]?.[0] || "K").concat(parts[1]?.[0] || "").toUpperCase();
}

function hash(value = "") {
  return crypto.createHash("sha1").update(String(value)).digest("hex").slice(0, 10);
}

function storageUrl(bucketName, path) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(path)}?alt=media`;
}

function unsplashSource(key, query = "") {
  const id = CURATED_UNSPLASH[key];
  if (!id) return null;
  return {
    url: `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&h=1400&q=82`,
    title: `Curated Unsplash ${key}`,
    query,
    source: "curated-unsplash",
  };
}

function resolveCuratedKey(product = {}, keyword = "", businessType = "") {
  const text = `${product.name || ""} ${keyword || ""} ${businessType || ""}`.toLowerCase();
  if (businessType === "pharmacy") return "pharmacy";
  if (businessType === "pet_shop") return "pet";
  if (businessType === "technology") return "tech";
  if (businessType === "supermarket" || businessType === "neighborhood_store") return "grocery";
  if (/pizza|pizzeria/.test(text)) return "pizza";
  if (/hamburg|burger|perro caliente|hot dog|salchipapa|wrap|sandwich|comida|pollo|carne|bandeja|patacon|empanada|postre|limonada|jugo|bebida/.test(text)) return "burger";
  if (/cafe|coffee|capuchino|latte|croissant|pan/.test(text)) return "coffee";
  if (/joy|jewel|anillo|arete|collar|cadena|pulsera|dije|perla|zircon|gold|silver/.test(text)) return "jewelry";
  if (/\bmascota\b|\bpet\b|\bdog\b|\bcat\b|perro|gato|correa|pelota perro|shampoo gato|shampoo perro|antipulgas|concentrado|mordedor/.test(text)) return "pet";
  if (/zapato|tenis|sandalia|botin|mocasin|shoe|sneaker/.test(text)) return "shoes";
  if (/maquill|beauty|cosmetic|shampoo|crema|esmalte|labial|facial|skin|cabello|unas|uñas|perfume|desodorante/.test(text)) return "beauty";
  if (/medic|pharmacy|pill|tablet|jarabe|gasa|curita|suero|vitamina|panal|pañal|bebe|baby|termometro|tapabocas/.test(text)) return "pharmacy";
  if (/herramient|tool|martillo|tornillo|chazo|pintura|llave|sifon|lavaplatos|corriente|bombillo|cable|plomeria|electric/.test(text)) return "hardware";
  if (/celular|phone|laptop|teclado|mouse|audifono|gamer|camara|speaker|control|tech|usb|hdmi/.test(text)) return "tech";
  if (/ropa|fashion|vestido|blusa|camisa|jean|pantalon|falda|bolso|cinturon|gorra|billetera|chaqueta/.test(text)) return "fashion";
  if (/cuaderno|notebook|lapiz|papel|resma|carpeta|grapadora|acuarela|pincel|regalo|bolsa regalo|cartulina|oficina|stationery/.test(text)) return "stationery";
  if (/arroz|azucar|aceite|leche|yogurt|banano|manzana|detergente|suavizante|galleta|papas|mercado|grocery|supermarket/.test(text)) return "grocery";
  return BUSINESS_CURATED_KEYS[businessType] || "grocery";
}

function parseSeedKeywords() {
  const seedPath = new URL("./seed-demo-stores.mjs", import.meta.url);
  const source = readFileSync(seedPath, "utf8");
  const map = new Map();
  const re = /item\("([^"]+)",\s*[0-9]+,\s*"([^"]+)"/g;
  let match = null;
  while ((match = re.exec(source))) {
    map.set(slugify(match[1]), match[2]);
  }
  return map;
}

function isRemotePlaceholder(url = "") {
  return /loremflickr|placehold|placeholder|picsum|ui-avatars|images\.unsplash/i.test(String(url || ""));
}

function shouldReplaceProduct(product = {}) {
  if (FORCE) return true;
  const urls = [product.imageUrl, product.imageCardUrl, product.imageThumbUrl].filter(Boolean).join(" ");
  const paths = [product.imagePath, product.imageCardPath, product.imageThumbPath].filter(Boolean).join(" ");
  if (!paths) return true;
  if (isRemotePlaceholder(urls)) return true;
  if (/demo-products\//.test(paths)) return true;
  return false;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchImageBuffer(url) {
  if (IMAGE_BUFFER_CACHE.has(url)) return IMAGE_BUFFER_CACHE.get(url);
  let response = null;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    response = await fetch(url, {
      headers: {
        "user-agent": "Klicor demo media repair",
        accept: "image/avif,image/webp,image/png,image/jpeg,image/*,*/*",
      },
      redirect: "follow",
    });
    if (response.ok) break;
    if (![429, 500, 502, 503, 504].includes(response.status) || attempt === 4) break;
    await wait(response.status === 429 ? attempt * 6000 : attempt * 1500);
  }
  if (!response?.ok) throw new Error(`No se pudo descargar ${url}: ${response?.status || "sin respuesta"}`);
  const type = response.headers.get("content-type") || "";
  if (!type.startsWith("image/")) throw new Error(`Respuesta no es imagen (${type}): ${url}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  IMAGE_BUFFER_CACHE.set(url, buffer);
  return buffer;
}

function scoreImage(page = {}, query = "") {
  const title = String(page.title || "").toLowerCase();
  const tokens = String(query || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);
  let score = 0;
  for (const token of tokens) {
    if (title.includes(token)) score += 2;
  }
  if (/\b(svg|logo|map|diagram|icon|seal|coat|flag)\b/i.test(title)) score -= 6;
  if (/\bposter|album|person|portrait|building|historic|museum\b/i.test(title)) score -= 2;
  return score;
}

async function findCommonsImage(query) {
  const cleanQuery = String(query || "").trim();
  if (!cleanQuery) return null;
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `${cleanQuery} file`,
    gsrnamespace: "6",
    gsrlimit: "8",
    prop: "imageinfo",
    iiprop: "url|mime|size",
    iiurlwidth: "1200",
    format: "json",
    origin: "*",
  });
  const url = `https://commons.wikimedia.org/w/api.php?${params.toString()}`;
  let response = null;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      response = await fetch(url, { headers: { "user-agent": "Klicor demo media repair" } });
      if (response.ok) break;
      if (![429, 500, 502, 503, 504].includes(response.status) || attempt === 4) break;
    } catch (error) {
      if (attempt === 4) return null;
    }
    await wait(attempt * 2500);
  }
  if (!response?.ok) return null;
  const data = await response.json();
  const pages = Object.values(data.query?.pages || {})
    .map((page) => ({ ...page, image: page.imageinfo?.[0] || null }))
    .filter((page) => page.image?.url && /^image\/(jpeg|png|webp)$/i.test(page.image.mime || ""))
    .filter((page) => Number(page.image.width || 0) >= 320 && Number(page.image.height || 0) >= 320)
    .sort((left, right) => scoreImage(right, cleanQuery) - scoreImage(left, cleanQuery));
  return pages[0]
    ? {
      url: pages[0].image.thumburl || pages[0].image.url,
      title: pages[0].title,
      query: cleanQuery,
      source: "wikimedia-commons",
    }
    : null;
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

async function buildProductMedia(bucket, uid, productId, productName, source) {
  const input = await fetchImageBuffer(source.url);
  const baseImage = sharp(input).rotate();
  const metadata = await baseImage.metadata();
  const cleanName = slugify(productName || productId) || productId;
  const imageHash = hash(`${source.url}:${productName}`);
  const basePath = `demo-products-clean/${uid}/${productId}`;
  const variants = {};

  for (const [variantName, config] of Object.entries(PRODUCT_VARIANTS)) {
    const outputPath = `${basePath}/${cleanName}-${imageHash}-${variantName}.webp`;
    const output = await baseImage.clone()
      .resize({
        width: config.size,
        height: config.size,
        fit: config.fit || "cover",
        position: "centre",
        withoutEnlargement: true,
        background: "#ffffff",
      })
      .webp({ quality: config.quality })
      .toBuffer();
    await saveWebp(bucket, outputPath, output);
    variants[variantName] = {
      path: outputPath,
      url: storageUrl(bucket.name, outputPath),
      width: config.size,
      height: config.size,
      bytes: output.length,
      contentType: "image/webp",
    };
  }

  return {
    imageUrl: variants.large.url,
    imageCardUrl: variants.card.url,
    imageThumbUrl: variants.thumb.url,
    imagePath: variants.large.path,
    imageCardPath: variants.card.path,
    imageThumbPath: variants.thumb.path,
    imageWidth: Number(metadata.width || 0) || 0,
    imageHeight: Number(metadata.height || 0) || 0,
    images: [{
      id: "image-1",
      originalUrl: source.url,
      originalTitle: source.title,
      originalQuery: source.query,
      source: source.source,
      repairedAt: new Date().toISOString(),
      imageUrl: variants.large.url,
      imageCardUrl: variants.card.url,
      imageThumbUrl: variants.thumb.url,
      imagePath: variants.large.path,
      imageCardPath: variants.card.path,
      imageThumbPath: variants.thumb.path,
      imageWidth: Number(metadata.width || 0) || 0,
      imageHeight: Number(metadata.height || 0) || 0,
      variants,
    }],
    demoMediaRepairedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

async function buildCoverMedia(bucket, uid, businessName, source) {
  const input = await fetchImageBuffer(source.url);
  const outputPath = `demo-assets-clean/${uid}/${slugify(businessName || uid)}-${hash(source.url)}-cover.webp`;
  const output = await sharp(input)
    .rotate()
    .resize({
      width: COVER_VARIANT.width,
      height: COVER_VARIANT.height,
      fit: "cover",
      position: "centre",
    })
    .webp({ quality: COVER_VARIANT.quality })
    .toBuffer();
  await saveWebp(bucket, outputPath, output);
  return {
    coverImageUrl: storageUrl(bucket.name, outputPath),
    coverImagePath: outputPath,
    coverImageSource: source,
    coverImageRepairedAt: new Date().toISOString(),
  };
}

async function buildLogoMedia(bucket, uid, businessName, color = "5B21B6") {
  const outputPath = `demo-assets-clean/${uid}/${slugify(businessName || uid)}-logo.webp`;
  const safeName = String(businessName || "Demo").replace(/[&<>]/g, "");
  const mark = initials(businessName);
  const svg = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${LOGO_VARIANT.size}" height="${LOGO_VARIANT.size}" viewBox="0 0 ${LOGO_VARIANT.size} ${LOGO_VARIANT.size}">
      <rect width="100%" height="100%" rx="112" fill="#${String(color || "5B21B6").replace(/[^0-9A-Fa-f]/g, "").slice(0, 6) || "5B21B6"}"/>
      <circle cx="256" cy="208" r="118" fill="rgba(255,255,255,0.13)"/>
      <text x="256" y="276" text-anchor="middle" font-family="Arial, sans-serif" font-size="128" font-weight="800" fill="#ffffff">${mark}</text>
      <text x="256" y="404" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" font-weight="700" fill="rgba(255,255,255,0.88)">${safeName.slice(0, 18)}</text>
    </svg>
  `);
  const output = await sharp(svg).webp({ quality: LOGO_VARIANT.quality }).toBuffer();
  await saveWebp(bucket, outputPath, output);
  return {
    photo: storageUrl(bucket.name, outputPath),
    photoThumb: storageUrl(bucket.name, outputPath),
    photoPath: outputPath,
    photoThumbPath: outputPath,
    photoMetadata: {
      source: "klicor-generated-demo-logo",
      repairedAt: new Date().toISOString(),
      width: LOGO_VARIANT.size,
      height: LOGO_VARIANT.size,
      path: outputPath,
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

async function refreshPublicSections(batch, userDoc, productsById) {
  const [categoriesSnap, productsSnap] = await Promise.all([
    userDoc.ref.collection("commerceCategories").orderBy("orderIndex").get(),
    userDoc.ref.collection("commerceProducts").where("visible", "==", true).get(),
  ]);
  const products = productsSnap.docs
    .map((doc) => productsById.get(doc.id) || { id: doc.id, ...doc.data() })
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

    batch.set(categoryDoc.ref, {
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

async function repairBusiness(userDoc, bucket, keywordMap) {
  const data = userDoc.data();
  const uid = userDoc.id;
  const db = getFirestore();
  const batch = db.batch();
  const summary = {
    uid,
    businessName: data.businessName || uid,
    logo: "skip",
    cover: "skip",
    products: 0,
    failed: 0,
  };

  const color = String(data.accentColor || data.color || data.theme?.accent || "5B21B6").replace("#", "");
  if (/demo-assets-clean\//.test(String(data.photoPath || ""))) {
    summary.logo = "clean";
  } else {
    const logo = await buildLogoMedia(bucket, uid, data.businessName || uid, color);
    summary.logo = WRITE ? "saved" : "dry";
    if (WRITE) batch.set(userDoc.ref, { ...logo, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  }

  const businessType = data.businessType || data.dorikaProfile?.businessType || "";
  const coverQuery = BUSINESS_MEDIA_QUERIES[businessType] || `${data.businessName || businessType} shop`;
  if (/demo-assets-clean\//.test(String(data.dorikaProfile?.coverImagePath || ""))) {
    summary.cover = "clean";
  } else {
    const coverSource = unsplashSource(BUSINESS_CURATED_KEYS[businessType] || "grocery", coverQuery)
      || await findCommonsImage(coverQuery);
    if (coverSource) {
      try {
        const cover = await buildCoverMedia(bucket, uid, data.businessName || uid, coverSource);
        summary.cover = WRITE ? "saved" : "dry";
        if (WRITE) {
          batch.set(userDoc.ref, {
            dorikaProfile: {
              ...(data.dorikaProfile || {}),
              ...cover,
            },
            updatedAt: FieldValue.serverTimestamp(),
          }, { merge: true });
        }
      } catch (error) {
        summary.cover = "failed";
        console.warn(`No se pudo reparar portada ${uid}: ${error.message}`);
      }
    } else {
      summary.cover = "not-found";
    }
  }

  const productsSnap = await userDoc.ref.collection("commerceProducts").get();
  const repairedProducts = new Map();
  let processed = 0;
  for (const productDoc of productsSnap.docs) {
    if (LIMIT && processed >= LIMIT) break;
    const product = productDoc.data();
    if (!shouldReplaceProduct(product)) continue;
    processed += 1;
    const keyword = keywordMap.get(slugify(product.name)) || product.name;
    const source = unsplashSource(resolveCuratedKey(product, keyword, businessType), keyword)
      || await findCommonsImage(`${keyword} product photograph`)
      || await findCommonsImage(keyword);
    if (!source) {
      summary.failed += 1;
      continue;
    }
    try {
      const media = await buildProductMedia(bucket, uid, productDoc.id, product.name, source);
      const nextProduct = { id: productDoc.id, ...product, ...media };
      repairedProducts.set(productDoc.id, nextProduct);
      summary.products += 1;
      if (WRITE) batch.set(productDoc.ref, media, { merge: true });
      if (DELAY_MS) await wait(DELAY_MS);
    } catch (error) {
      summary.failed += 1;
      console.warn(`No se pudo reparar ${uid}/${productDoc.id}: ${error.message}`);
    }
  }

  if (WRITE && repairedProducts.size) {
    await refreshPublicSections(batch, userDoc, repairedProducts);
  }
  if (WRITE) await batch.commit();
  return summary;
}

async function main() {
  initFirebaseAdmin();
  const db = getFirestore();
  const bucket = getStorage().bucket();
  const keywordMap = parseSeedKeywords();
  let docs = [];
  if (ONLY_UID) {
    const doc = await db.collection("users").doc(ONLY_UID).get();
    if (doc.exists) docs = [doc];
  } else {
    const snap = await db.collection("users").get();
    docs = snap.docs.filter((doc) => doc.id.startsWith("demo-") || String(doc.data().username || "").includes("-demo"));
  }

  const results = [];
  for (const doc of docs) {
    results.push(await repairBusiness(doc, bucket, keywordMap));
  }
  console.table(results);
  console.log(WRITE ? "Correccion aplicada." : "Dry-run: no se escribio nada. Ejecuta con --write para aplicar.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
