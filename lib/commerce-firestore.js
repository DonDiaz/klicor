import { FieldValue, Timestamp } from "firebase-admin/firestore";
import crypto from "node:crypto";
import { revalidateTag } from "next/cache";
import sharp from "sharp";
import {
  buildCommercePublicUrl,
  COMMERCE_ALLOWED_IMAGE_TYPES,
  COMMERCE_MAX_IMAGE_SIZE_BYTES,
  COMMERCE_PRODUCT_PAGE_SIZE,
  normalizeCommerceConfig,
  normalizeCommerceMode,
  requiresCommercePrice,
  resolveCommerceModeMeta,
  resolveCommercePlanLimits,
  supportsCommerceCart,
} from "@/lib/commerce-config";
import { getAdminDb, getAdminStorage } from "@/lib/firebase-admin";
import { getUserByUid } from "@/lib/firestore";
import {
  commerceCategorySchema,
  commerceConfigSchema,
  commerceProductSchema,
  commerceSubcategorySchema,
} from "@/lib/schemas";
import { sanitizePhone, sanitizeSlug, toDate } from "@/lib/utils";

const COMMERCE_IMAGE_WIDTH = 1440;
const COMMERCE_IMAGE_THUMB_SIZE = 640;
const PUBLIC_COMMERCE_INLINE_PRODUCT_LIMIT = 72;
const PUBLIC_COMMERCE_INLINE_SECTION_LIMIT = 18;
const ORDER_STEP = 1024;

function invalidatePublicCommerceCache({ currentUsername = "", mode = "" } = {}) {
  const slug = sanitizeSlug(currentUsername);
  const normalizedMode = normalizeCommerceMode(mode);
  if (slug) revalidateTag(`public-commerce:${slug}`);
  if (slug && normalizedMode) revalidateTag(`public-commerce:${slug}:${normalizedMode}`);
}

function usersCollection() {
  return getAdminDb().collection("users");
}

function categoriesCollection(uid) {
  return usersCollection().doc(uid).collection("commerceCategories");
}

function subcategoriesCollection(uid) {
  return usersCollection().doc(uid).collection("commerceSubcategories");
}

function productsCollection(uid) {
  return usersCollection().doc(uid).collection("commerceProducts");
}

function publicSectionsCollection(uid) {
  return usersCollection().doc(uid).collection("commercePublicSections");
}

function buildCommerceId(prefix) {
  return `${prefix}_${crypto.randomBytes(6).toString("hex")}`;
}

function buildPublicCategorySectionId(categoryId = "") {
  return `cat_${categoryId}`;
}

function buildPublicSubcategorySectionId(subcategoryId = "") {
  return `subcat_${subcategoryId}`;
}

function normalizePrice(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(Math.round(parsed), 0);
}

function normalizeProductImages(value = [], fallback = {}) {
  const items = Array.isArray(value)
    ? value
      .filter(Boolean)
      .map((item, index) => ({
        id: String(item.id || `image-${index + 1}`),
        imageUrl: String(item.imageUrl || "").trim(),
        imageThumbUrl: String(item.imageThumbUrl || item.imageUrl || "").trim(),
        imagePath: String(item.imagePath || "").trim(),
        imageThumbPath: String(item.imageThumbPath || "").trim(),
        imageWidth: Number(item.imageWidth || 0) || 0,
        imageHeight: Number(item.imageHeight || 0) || 0,
      }))
      .filter((item) => item.imageUrl || item.imageThumbUrl)
    : [];

  if (items.length) return items;

  const fallbackImageUrl = String(fallback.imageUrl || "").trim();
  const fallbackThumbUrl = String(fallback.imageThumbUrl || fallback.imageUrl || "").trim();
  if (!fallbackImageUrl && !fallbackThumbUrl) return [];

  return [{
    id: "image-1",
    imageUrl: fallbackImageUrl,
    imageThumbUrl: fallbackThumbUrl,
    imagePath: String(fallback.imagePath || "").trim(),
    imageThumbPath: String(fallback.imageThumbPath || "").trim(),
    imageWidth: Number(fallback.imageWidth || 0) || 0,
    imageHeight: Number(fallback.imageHeight || 0) || 0,
  }];
}

function normalizeCategoryDoc(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    name: String(data.name || "").trim(),
    slug: String(data.slug || "").trim(),
    orderIndex: Number(data.orderIndex || 0) || 0,
    hasSubcategories: Boolean(data.hasSubcategories),
    productCount: Number(data.productCount || 0) || 0,
    visibleProductCount: Number(data.visibleProductCount || 0) || 0,
    subcategoryCount: Number(data.subcategoryCount || 0) || 0,
    firstSubcategoryId: String(data.firstSubcategoryId || "").trim(),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function normalizeSubcategoryDoc(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    categoryId: String(data.categoryId || "").trim(),
    name: String(data.name || "").trim(),
    slug: String(data.slug || "").trim(),
    orderIndex: Number(data.orderIndex || 0) || 0,
    productCount: Number(data.productCount || 0) || 0,
    visibleProductCount: Number(data.visibleProductCount || 0) || 0,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function normalizeProductDoc(doc) {
  const data = doc.data();
  const images = normalizeProductImages(data.images, data);
  const primaryImage = images[0] || null;
  return {
    id: doc.id,
    mode: normalizeCommerceMode(data.mode),
    categoryId: String(data.categoryId || "").trim(),
    subcategoryId: String(data.subcategoryId || "").trim(),
    name: String(data.name || "").trim(),
    description: String(data.description || "").trim(),
    price: normalizePrice(data.price),
    visible: data.visible !== false,
    orderIndex: Number(data.orderIndex || 0) || 0,
    imageUrl: String(data.imageUrl || primaryImage?.imageUrl || "").trim(),
    imageThumbUrl: String(data.imageThumbUrl || primaryImage?.imageThumbUrl || data.imageUrl || primaryImage?.imageUrl || "").trim(),
    imagePath: String(data.imagePath || primaryImage?.imagePath || "").trim(),
    imageThumbPath: String(data.imageThumbPath || primaryImage?.imageThumbPath || "").trim(),
    imageWidth: Number(data.imageWidth || primaryImage?.imageWidth || 0) || 0,
    imageHeight: Number(data.imageHeight || primaryImage?.imageHeight || 0) || 0,
    images,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function normalizePublicSectionDoc(doc) {
  const data = doc.data();
  const pagination = normalizePublicSectionProducts(data.products || []);
  return {
    id: doc.id,
    type: String(data.type || "").trim(),
    categoryId: String(data.categoryId || "").trim(),
    subcategoryId: String(data.subcategoryId || "").trim(),
    subcategories: Array.isArray(data.subcategories)
      ? data.subcategories.map((item) => ({
        id: String(item.id || "").trim(),
        categoryId: String(item.categoryId || "").trim(),
        name: String(item.name || "").trim(),
        slug: String(item.slug || "").trim(),
        orderIndex: Number(item.orderIndex || 0) || 0,
        productCount: Number(item.productCount || 0) || 0,
        visibleProductCount: Number(item.visibleProductCount || 0) || 0,
      })).filter((item) => item.id)
      : [],
    products: pagination.items,
    hasMore: Boolean(data.hasMore),
    nextCursor: data.nextCursor ?? null,
  };
}

function shouldPreloadPublicSections(config = {}) {
  const productsCount = Number(config.productsCount || 0) || 0;
  const sectionsCount = (Number(config.categoriesCount || 0) || 0) + (Number(config.subcategoriesCount || 0) || 0);
  return productsCount > 0
    && productsCount <= PUBLIC_COMMERCE_INLINE_PRODUCT_LIMIT
    && sectionsCount <= PUBLIC_COMMERCE_INLINE_SECTION_LIMIT;
}

function toPublicSubcategorySummary(subcategory) {
  return {
    id: subcategory.id,
    categoryId: subcategory.categoryId,
    name: subcategory.name,
    slug: subcategory.slug,
    orderIndex: subcategory.orderIndex,
    productCount: subcategory.productCount,
    visibleProductCount: subcategory.visibleProductCount,
  };
}

function toPublicProductSummary(product) {
  return {
    id: product.id,
    mode: product.mode,
    categoryId: product.categoryId,
    subcategoryId: product.subcategoryId,
    name: product.name,
    description: product.description,
    price: product.price,
    orderIndex: product.orderIndex,
    imageUrl: product.imageUrl,
    imageThumbUrl: product.imageThumbUrl,
    imageWidth: product.imageWidth,
    imageHeight: product.imageHeight,
    images: normalizeProductImages(product.images, product).map((image) => ({
      id: image.id,
      imageUrl: image.imageUrl,
      imageThumbUrl: image.imageThumbUrl,
      imageWidth: image.imageWidth,
      imageHeight: image.imageHeight,
    })),
  };
}

function normalizePublicSectionProducts(products = []) {
  const items = Array.isArray(products) ? products.slice(0, COMMERCE_PRODUCT_PAGE_SIZE) : [];
  const hasMore = Array.isArray(products) && products.length > COMMERCE_PRODUCT_PAGE_SIZE;
  return {
    items,
    hasMore,
    nextCursor: hasMore ? items.at(-1)?.orderIndex || null : null,
  };
}

async function syncPublicCommerceSections(uid) {
  const [categorySnap, subcategorySnap, productSnap, existingSnap] = await Promise.all([
    categoriesCollection(uid).orderBy("orderIndex").get(),
    subcategoriesCollection(uid).orderBy("orderIndex").get(),
    productsCollection(uid).where("visible", "==", true).get(),
    publicSectionsCollection(uid).get(),
  ]);
  const categories = categorySnap.docs.map(normalizeCategoryDoc);
  const subcategories = subcategorySnap.docs.map(normalizeSubcategoryDoc);
  const products = productSnap.docs.map(normalizeProductDoc).sort((left, right) => left.orderIndex - right.orderIndex);
  const subcategoriesByCategory = new Map();
  const productsBySubcategory = new Map();
  const directProductsByCategory = new Map();

  subcategories.forEach((subcategory) => {
    const current = subcategoriesByCategory.get(subcategory.categoryId) || [];
    current.push(subcategory);
    subcategoriesByCategory.set(subcategory.categoryId, current);
  });

  products.forEach((product) => {
    if (product.subcategoryId) {
      const current = productsBySubcategory.get(product.subcategoryId) || [];
      current.push(product);
      productsBySubcategory.set(product.subcategoryId, current);
      return;
    }

    const current = directProductsByCategory.get(product.categoryId) || [];
    current.push(product);
    directProductsByCategory.set(product.categoryId, current);
  });

  const sectionsRef = publicSectionsCollection(uid);
  const batch = getAdminDb().batch();
  const nextIds = new Set();
  let writeCount = 0;

  function queueSection(sectionId, data) {
    nextIds.add(sectionId);
    batch.set(sectionsRef.doc(sectionId), {
      ...data,
      pageSize: COMMERCE_PRODUCT_PAGE_SIZE,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    writeCount += 1;
  }

  categories.forEach((category) => {
    const sectionSubcategories = (subcategoriesByCategory.get(category.id) || []).sort((left, right) => left.orderIndex - right.orderIndex);
    if (sectionSubcategories.length) {
      const firstSubcategory = sectionSubcategories[0];
      const firstProducts = (productsBySubcategory.get(firstSubcategory.id) || []).sort((left, right) => left.orderIndex - right.orderIndex).map(toPublicProductSummary);
      const firstPage = normalizePublicSectionProducts(firstProducts);
      queueSection(buildPublicCategorySectionId(category.id), {
        type: "category",
        categoryId: category.id,
        subcategoryId: firstSubcategory.id,
        subcategories: sectionSubcategories.map(toPublicSubcategorySummary),
        products: firstPage.items,
        hasMore: firstPage.hasMore,
        nextCursor: firstPage.nextCursor,
      });

      sectionSubcategories.forEach((subcategory) => {
        const sectionProducts = (productsBySubcategory.get(subcategory.id) || []).sort((left, right) => left.orderIndex - right.orderIndex).map(toPublicProductSummary);
        const page = normalizePublicSectionProducts(sectionProducts);
        queueSection(buildPublicSubcategorySectionId(subcategory.id), {
          type: "subcategory",
          categoryId: category.id,
          subcategoryId: subcategory.id,
          products: page.items,
          hasMore: page.hasMore,
          nextCursor: page.nextCursor,
        });
      });
      return;
    }

    const directProducts = (directProductsByCategory.get(category.id) || []).sort((left, right) => left.orderIndex - right.orderIndex).map(toPublicProductSummary);
    const page = normalizePublicSectionProducts(directProducts);
    queueSection(buildPublicCategorySectionId(category.id), {
      type: "category",
      categoryId: category.id,
      subcategoryId: "",
      subcategories: [],
      products: page.items,
      hasMore: page.hasMore,
      nextCursor: page.nextCursor,
    });
  });

  existingSnap.docs.forEach((doc) => {
    if (!nextIds.has(doc.id)) {
      batch.delete(doc.ref);
      writeCount += 1;
    }
  });

  if (writeCount) {
    await batch.commit();
  }
}

async function removeStoragePaths(paths = []) {
  const bucket = getAdminStorage();
  await Promise.all(paths.filter(Boolean).map(async (path) => {
    try {
      await bucket.file(path).delete({ ignoreNotFound: true });
    } catch {
      // Ignore missing or already deleted files.
    }
  }));
}

function getProductStoragePaths(product = {}) {
  const galleryPaths = normalizeProductImages(product.images, product).flatMap((image) => [image.imagePath, image.imageThumbPath]);
  return [...new Set([
    product.imagePath,
    product.imageThumbPath,
    ...galleryPaths,
  ].filter(Boolean))];
}

async function optimizeCommerceProductImage(uid, productId, file, imageId = buildCommerceId("img")) {
  if (!file) return null;
  if (file.size > COMMERCE_MAX_IMAGE_SIZE_BYTES) {
    throw new Error("La imagen del producto debe pesar menos de 5MB.");
  }
  if (!COMMERCE_ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Sube la imagen en JPG, PNG o WEBP.");
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const image = sharp(inputBuffer).rotate();
  const metadata = await image.metadata();
  const bucket = getAdminStorage();
  const basePath = `commerce-products/${uid}/${productId}/${imageId}`;
  const mainPath = `${basePath}/main.webp`;
  const thumbPath = `${basePath}/thumb.webp`;

  const mainBuffer = await image
    .clone()
    .resize({
      width: COMMERCE_IMAGE_WIDTH,
      height: COMMERCE_IMAGE_WIDTH,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer();

  const thumbBuffer = await image
    .clone()
    .resize(COMMERCE_IMAGE_THUMB_SIZE, COMMERCE_IMAGE_THUMB_SIZE, {
      fit: "cover",
      position: "centre",
    })
    .webp({ quality: 76 })
    .toBuffer();

  await Promise.all([
    bucket.file(mainPath).save(mainBuffer, {
      contentType: "image/webp",
      resumable: false,
      public: true,
    }),
    bucket.file(thumbPath).save(thumbBuffer, {
      contentType: "image/webp",
      resumable: false,
      public: true,
    }),
  ]);

  return {
    id: imageId,
    imageUrl: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(mainPath)}?alt=media`,
    imageThumbUrl: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(thumbPath)}?alt=media`,
    imagePath: mainPath,
    imageThumbPath: thumbPath,
    imageWidth: Number(metadata.width || 0) || 0,
    imageHeight: Number(metadata.height || 0) || 0,
  };
}

async function getNextOrderIndex(query) {
  const snap = await query.get();
  const lastDoc = snap.docs.at(-1);
  if (!lastDoc) return ORDER_STEP;
  return (Number(lastDoc.data()?.orderIndex || 0) || 0) + ORDER_STEP;
}

async function refreshSubcategoryStats(uid, subcategoryId) {
  if (!subcategoryId) return;
  const productQuery = productsCollection(uid).where("subcategoryId", "==", subcategoryId);
  const [productCountSnap, visibleCountSnap] = await Promise.all([
    productQuery.count().get(),
    productQuery.where("visible", "==", true).count().get(),
  ]);
  await subcategoriesCollection(uid).doc(subcategoryId).set({
    productCount: productCountSnap.data().count || 0,
    visibleProductCount: visibleCountSnap.data().count || 0,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

async function refreshCategoryStats(uid, categoryId) {
  if (!categoryId) return;
  const categoryRef = categoriesCollection(uid).doc(categoryId);
  const [subcatCountSnap, productCountSnap, visibleCountSnap, firstSubcategorySnap] = await Promise.all([
    subcategoriesCollection(uid).where("categoryId", "==", categoryId).count().get(),
    productsCollection(uid).where("categoryId", "==", categoryId).count().get(),
    productsCollection(uid).where("categoryId", "==", categoryId).where("visible", "==", true).count().get(),
    subcategoriesCollection(uid).where("categoryId", "==", categoryId).orderBy("orderIndex").limit(1).get(),
  ]);

  const subcategoryCount = subcatCountSnap.data().count || 0;
  await categoryRef.set({
    subcategoryCount,
    hasSubcategories: subcategoryCount > 0,
    firstSubcategoryId: firstSubcategorySnap.docs[0]?.id || "",
    productCount: productCountSnap.data().count || 0,
    visibleProductCount: visibleCountSnap.data().count || 0,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

async function refreshCommerceSummary(uid, user = null) {
  const [categoriesCountSnap, subcategoriesCountSnap, productsCountSnap, visibleProductsCountSnap] = await Promise.all([
    categoriesCollection(uid).count().get(),
    subcategoriesCollection(uid).count().get(),
    productsCollection(uid).count().get(),
    productsCollection(uid).where("visible", "==", true).count().get(),
  ]);

  const summary = {
    categoriesCount: categoriesCountSnap.data().count || 0,
    subcategoriesCount: subcategoriesCountSnap.data().count || 0,
    productsCount: productsCountSnap.data().count || 0,
    visibleProductsCount: visibleProductsCountSnap.data().count || 0,
  };

  await usersCollection().doc(uid).set({
    commerce: {
      ...(user?.commerce || {}),
      ...summary,
      hasContent: summary.productsCount > 0 || summary.categoriesCount > 0,
      updatedAt: FieldValue.serverTimestamp(),
    },
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  return summary;
}

async function ensureCategoryPlacement(uid, categoryId, subcategoryId = "") {
  const categorySnap = await categoriesCollection(uid).doc(categoryId).get();
  if (!categorySnap.exists) {
    throw new Error("La categoría seleccionada ya no existe.");
  }

  const category = normalizeCategoryDoc(categorySnap);
  if (category.hasSubcategories) {
    if (!subcategoryId) {
      throw new Error("Esta categoría usa subcategorías. Debes elegir una subcategoría.");
    }
    const subcategorySnap = await subcategoriesCollection(uid).doc(subcategoryId).get();
    if (!subcategorySnap.exists) {
      throw new Error("La subcategoría seleccionada ya no existe.");
    }
    const subcategory = normalizeSubcategoryDoc(subcategorySnap);
    if (subcategory.categoryId !== categoryId) {
      throw new Error("La subcategoría no pertenece a la categoría seleccionada.");
    }
    return { category, subcategory };
  }

  if (subcategoryId) {
    throw new Error("Esta categoría no usa subcategorías. Guarda el producto directamente en la categoría.");
  }

  return { category, subcategory: null };
}

function resolveCommerceWhatsapp(user = {}) {
  const configured = sanitizePhone(user?.commerce?.orderWhatsapp || "");
  if (configured) return configured;
  const whatsappLink = Array.isArray(user?.profileLinks)
    ? user.profileLinks.find((item) => item?.type === "whatsapp")?.value || ""
    : user?.links?.whatsapp || "";
  return sanitizePhone(whatsappLink);
}

function buildPublicCommerceViewUser(user = {}) {
  return {
    uid: user.uid,
    username: user.username || "",
    usernameLower: user.usernameLower || "",
    businessName: user.businessName || "Tu negocio",
    businessHeadline: user.businessHeadline || "",
    businessSubheadline: user.businessSubheadline || "",
    businessCategory: user.businessCategory || "services",
    photo: user.photo || "",
    photoThumb: user.photoThumb || user.photo || "",
    settings: user.settings || {},
    profileLinks: Array.isArray(user.profileLinks) ? user.profileLinks : [],
    contactCardEnabled: Boolean(user.contactCardEnabled),
    contactCardName: user.contactCardName || "",
    contactCardTitle: user.contactCardTitle || "",
    contactCardWhatsappLinkId: user.contactCardWhatsappLinkId || "",
    contactCardPhone: user.contactCardPhone || "",
  };
}

export async function getCommerceAdminState(uid, user = null) {
  const owner = user || await getUserByUid(uid);
  if (!owner) {
    throw new Error("Usuario no encontrado.");
  }

  const [categorySnap, subcategorySnap, productSnap] = await Promise.all([
    categoriesCollection(uid).orderBy("orderIndex").get(),
    subcategoriesCollection(uid).orderBy("orderIndex").get(),
    productsCollection(uid).get(),
  ]);

  const categories = categorySnap.docs.map(normalizeCategoryDoc);
  const subcategories = subcategorySnap.docs.map(normalizeSubcategoryDoc);
  const products = productSnap.docs.map(normalizeProductDoc).sort((left, right) => left.orderIndex - right.orderIndex);

  const groupedSubcategories = new Map();
  subcategories.forEach((subcategory) => {
    const currentList = groupedSubcategories.get(subcategory.categoryId) || [];
    currentList.push(subcategory);
    groupedSubcategories.set(subcategory.categoryId, currentList);
  });

  const directProductsMap = new Map();
  const subcategoryProductsMap = new Map();
  products.forEach((product) => {
    if (product.subcategoryId) {
      const currentList = subcategoryProductsMap.get(product.subcategoryId) || [];
      currentList.push(product);
      subcategoryProductsMap.set(product.subcategoryId, currentList);
      return;
    }

    const currentList = directProductsMap.get(product.categoryId) || [];
    currentList.push(product);
    directProductsMap.set(product.categoryId, currentList);
  });

  const normalizedConfig = normalizeCommerceConfig(owner.commerce, owner);
  const limits = resolveCommercePlanLimits(owner.plan || owner.status);

  return {
    config: normalizedConfig,
    publicUrl: buildCommercePublicUrl(owner.username, normalizedConfig.activeMode),
    limits,
    summary: {
      categoriesCount: normalizedConfig.categoriesCount,
      subcategoriesCount: normalizedConfig.subcategoriesCount,
      productsCount: normalizedConfig.productsCount,
      visibleProductsCount: normalizedConfig.visibleProductsCount,
      hasContent: normalizedConfig.hasContent,
    },
    categories: categories.map((category) => ({
      ...category,
      subcategories: (groupedSubcategories.get(category.id) || []).map((subcategory) => ({
        ...subcategory,
        products: (subcategoryProductsMap.get(subcategory.id) || []).sort((left, right) => left.orderIndex - right.orderIndex),
      })),
      products: (directProductsMap.get(category.id) || []).sort((left, right) => left.orderIndex - right.orderIndex),
    })),
  };
}

function buildCommerceAdminBaseState(owner = {}) {
  const normalizedConfig = normalizeCommerceConfig(owner.commerce, owner);
  const limits = resolveCommercePlanLimits(owner.plan || owner.status);

  return {
    config: normalizedConfig,
    publicUrl: buildCommercePublicUrl(owner.username, normalizedConfig.activeMode),
    limits,
    summary: {
      categoriesCount: normalizedConfig.categoriesCount,
      subcategoriesCount: normalizedConfig.subcategoriesCount,
      productsCount: normalizedConfig.productsCount,
      visibleProductsCount: normalizedConfig.visibleProductsCount,
      hasContent: normalizedConfig.hasContent,
    },
  };
}

export async function getCommerceAdminStructure(uid, user = null) {
  const owner = user || await getUserByUid(uid);
  if (!owner) {
    throw new Error("Usuario no encontrado.");
  }

  const [categorySnap, subcategorySnap] = await Promise.all([
    categoriesCollection(uid).orderBy("orderIndex").get(),
    subcategoriesCollection(uid).orderBy("orderIndex").get(),
  ]);

  const categories = categorySnap.docs.map(normalizeCategoryDoc);
  const subcategories = subcategorySnap.docs.map(normalizeSubcategoryDoc);
  const groupedSubcategories = new Map();

  subcategories.forEach((subcategory) => {
    const currentList = groupedSubcategories.get(subcategory.categoryId) || [];
    currentList.push(subcategory);
    groupedSubcategories.set(subcategory.categoryId, currentList);
  });

  return {
    ...buildCommerceAdminBaseState(owner),
    categories: categories.map((category) => ({
      ...category,
      subcategories: (groupedSubcategories.get(category.id) || []).sort((left, right) => left.orderIndex - right.orderIndex),
    })),
  };
}

async function resolveAdminSectionSelection(uid, categoryId, subcategoryId = "") {
  const categorySnap = await categoriesCollection(uid).doc(categoryId).get();
  if (!categorySnap.exists) {
    throw new Error("La categoría seleccionada ya no existe.");
  }

  const category = normalizeCategoryDoc(categorySnap);
  if (!category.hasSubcategories) {
    if (subcategoryId) {
      throw new Error("Esta categoría no usa subcategorías.");
    }
    return { category, subcategory: null };
  }

  let subcategorySnap = null;
  if (subcategoryId) {
    subcategorySnap = await subcategoriesCollection(uid).doc(subcategoryId).get();
    if (!subcategorySnap.exists) {
      throw new Error("La subcategoría seleccionada ya no existe.");
    }
  } else if (category.firstSubcategoryId) {
    subcategorySnap = await subcategoriesCollection(uid).doc(category.firstSubcategoryId).get();
  }

  if (!subcategorySnap?.exists) {
    const firstSubcategorySnap = await subcategoriesCollection(uid)
      .where("categoryId", "==", categoryId)
      .orderBy("orderIndex")
      .limit(1)
      .get();
    subcategorySnap = firstSubcategorySnap.docs[0] || null;
  }

  if (!subcategorySnap?.exists) {
    return { category, subcategory: null };
  }

  const subcategory = normalizeSubcategoryDoc(subcategorySnap);
  if (subcategory.categoryId !== category.id) {
    throw new Error("La subcategoría no pertenece a la categoría seleccionada.");
  }

  return { category, subcategory };
}

export async function getCommerceAdminSectionProducts(uid, { categoryId = "", subcategoryId = "" } = {}, user = null) {
  const owner = user || await getUserByUid(uid);
  if (!owner) {
    throw new Error("Usuario no encontrado.");
  }

  if (!categoryId) {
    return {
      categoryId: "",
      subcategoryId: "",
      products: [],
    };
  }

  const { category, subcategory } = await resolveAdminSectionSelection(uid, categoryId, subcategoryId);
  let query = null;

  if (subcategory?.id) {
    query = productsCollection(uid).where("subcategoryId", "==", subcategory.id).orderBy("orderIndex");
  } else {
    query = productsCollection(uid)
      .where("categoryId", "==", category.id)
      .where("subcategoryId", "==", "")
      .orderBy("orderIndex");
  }

  const snap = await query.get();
  return {
    categoryId: category.id,
    subcategoryId: subcategory?.id || "",
    products: snap.docs.map(normalizeProductDoc),
  };
}

export async function saveCommerceConfig(uid, input, user = null) {
  const owner = user || await getUserByUid(uid);
  if (!owner) {
    throw new Error("Usuario no encontrado.");
  }

  const parsed = commerceConfigSchema.parse({
    activeMode: normalizeCommerceMode(input.activeMode),
    orderWhatsapp: sanitizePhone(input.orderWhatsapp || ""),
    currency: String(input.currency || "COP").trim().toUpperCase(),
  });

  await usersCollection().doc(uid).set({
    commerceMode: parsed.activeMode,
    commerce: {
      ...normalizeCommerceConfig(owner.commerce, owner),
      activeMode: parsed.activeMode,
      orderWhatsapp: parsed.orderWhatsapp,
      currency: parsed.currency || "COP",
      updatedAt: FieldValue.serverTimestamp(),
    },
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  await syncPublicCommerceSections(uid);
  invalidatePublicCommerceCache({
    currentUsername: owner.usernameLower || owner.username,
    mode: parsed.activeMode,
  });
  return {
    config: {
      activeMode: parsed.activeMode,
      orderWhatsapp: parsed.orderWhatsapp,
      currency: parsed.currency || "COP",
    },
  };
}

export async function createCommerceCategory(uid, input, user = null) {
  const owner = user || await getUserByUid(uid);
  if (!owner) throw new Error("Usuario no encontrado.");

  const limits = resolveCommercePlanLimits(owner.plan || owner.status);
  const existingCount = (await categoriesCollection(uid).count().get()).data().count || 0;
  if (existingCount >= limits.maxCategories) {
    throw new Error(`Tu plan permite hasta ${limits.maxCategories} categorías.`);
  }

  const parsed = commerceCategorySchema.parse(input);
  const ref = categoriesCollection(uid).doc(buildCommerceId("cat"));
  const orderIndex = await getNextOrderIndex(categoriesCollection(uid).orderBy("orderIndex"));
  const now = FieldValue.serverTimestamp();
  await ref.set({
    name: parsed.name,
    slug: sanitizeSlug(parsed.name),
    orderIndex,
    hasSubcategories: false,
    subcategoryCount: 0,
    firstSubcategoryId: "",
    productCount: 0,
    visibleProductCount: 0,
    createdAt: now,
    updatedAt: now,
  });

  await refreshCommerceSummary(uid, owner);
  await syncPublicCommerceSections(uid);
  invalidatePublicCommerceCache({
    currentUsername: owner.usernameLower || owner.username,
    mode: owner.commerceMode || owner.commerce?.activeMode,
  });
  return { categoryId: ref.id };
}

export async function updateCommerceCategory(uid, input, user = null) {
  const owner = user || await getUserByUid(uid);
  const parsed = commerceCategorySchema.parse(input);
  if (!parsed.id) throw new Error("Categoría no encontrada.");
  await categoriesCollection(uid).doc(parsed.id).set({
    name: parsed.name,
    slug: sanitizeSlug(parsed.name),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  await syncPublicCommerceSections(uid);
  invalidatePublicCommerceCache({
    currentUsername: owner?.usernameLower || owner?.username,
    mode: owner?.commerceMode || owner?.commerce?.activeMode,
  });
  return { categoryId: parsed.id };
}

export async function deleteCommerceCategory(uid, categoryId, user = null) {
  const owner = user || await getUserByUid(uid);
  const categorySnap = await categoriesCollection(uid).doc(categoryId).get();
  if (!categorySnap.exists) throw new Error("Categoría no encontrada.");
  const category = normalizeCategoryDoc(categorySnap);
  if (category.subcategoryCount > 0 || category.productCount > 0) {
    throw new Error("Vacía primero la categoría antes de eliminarla.");
  }

  await categoriesCollection(uid).doc(categoryId).delete();
  await refreshCommerceSummary(uid, owner);
  await syncPublicCommerceSections(uid);
  invalidatePublicCommerceCache({
    currentUsername: owner?.usernameLower || owner?.username,
    mode: owner?.commerceMode || owner?.commerce?.activeMode,
  });
  return {};
}

export async function moveCommerceCategory(uid, categoryId, direction, user = null) {
  const owner = user || await getUserByUid(uid);
  const categoriesSnap = await categoriesCollection(uid).orderBy("orderIndex").get();
  const categories = categoriesSnap.docs.map(normalizeCategoryDoc);
  const index = categories.findIndex((category) => category.id === categoryId);
  if (index === -1) throw new Error("Categoría no encontrada.");
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= categories.length) {
    return { categoryId };
  }

  const current = categories[index];
  const adjacent = categories[targetIndex];
  await Promise.all([
    categoriesCollection(uid).doc(current.id).set({ orderIndex: adjacent.orderIndex, updatedAt: FieldValue.serverTimestamp() }, { merge: true }),
    categoriesCollection(uid).doc(adjacent.id).set({ orderIndex: current.orderIndex, updatedAt: FieldValue.serverTimestamp() }, { merge: true }),
  ]);

  await syncPublicCommerceSections(uid);
  invalidatePublicCommerceCache({
    currentUsername: owner?.usernameLower || owner?.username,
    mode: owner?.commerceMode || owner?.commerce?.activeMode,
  });
  return { categoryId };
}

export async function createCommerceSubcategory(uid, input, user = null) {
  const owner = user || await getUserByUid(uid);
  if (!owner) throw new Error("Usuario no encontrado.");

  const limits = resolveCommercePlanLimits(owner.plan || owner.status);
  const existingCount = (await subcategoriesCollection(uid).count().get()).data().count || 0;
  if (existingCount >= limits.maxSubcategories) {
    throw new Error(`Tu plan permite hasta ${limits.maxSubcategories} subcategorías.`);
  }

  const parsed = commerceSubcategorySchema.parse(input);
  const categorySnap = await categoriesCollection(uid).doc(parsed.categoryId).get();
  if (!categorySnap.exists) {
    throw new Error("La categoría seleccionada ya no existe.");
  }
  const category = normalizeCategoryDoc(categorySnap);
  if (!category.hasSubcategories && category.productCount > 0) {
    throw new Error("No puedes agregar subcategorías a una categoría que ya tiene productos directos.");
  }

  const orderIndex = await getNextOrderIndex(
    subcategoriesCollection(uid).where("categoryId", "==", parsed.categoryId).orderBy("orderIndex"),
  );

  const ref = subcategoriesCollection(uid).doc(buildCommerceId("subcat"));
  await ref.set({
    categoryId: parsed.categoryId,
    name: parsed.name,
    slug: sanitizeSlug(parsed.name),
    orderIndex,
    productCount: 0,
    visibleProductCount: 0,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await refreshCategoryStats(uid, parsed.categoryId);
  await refreshCommerceSummary(uid, owner);
  await syncPublicCommerceSections(uid);
  invalidatePublicCommerceCache({
    currentUsername: owner.usernameLower || owner.username,
    mode: owner.commerceMode || owner.commerce?.activeMode,
  });
  return { categoryId: parsed.categoryId, subcategoryId: ref.id };
}

export async function updateCommerceSubcategory(uid, input, user = null) {
  const owner = user || await getUserByUid(uid);
  const parsed = commerceSubcategorySchema.parse(input);
  if (!parsed.id) throw new Error("Subcategoría no encontrada.");

  const subcategoryRef = subcategoriesCollection(uid).doc(parsed.id);
  const currentSnap = await subcategoryRef.get();
  if (!currentSnap.exists) throw new Error("Subcategoría no encontrada.");
  const current = normalizeSubcategoryDoc(currentSnap);
  const targetCategorySnap = await categoriesCollection(uid).doc(parsed.categoryId).get();
  if (!targetCategorySnap.exists) throw new Error("La categoría seleccionada ya no existe.");
  const targetCategory = normalizeCategoryDoc(targetCategorySnap);
  if (!targetCategory.hasSubcategories && targetCategory.productCount > 0 && current.categoryId !== parsed.categoryId) {
    throw new Error("No puedes mover esta subcategoría a una categoría que ya tiene productos directos.");
  }

  await subcategoryRef.set({
    categoryId: parsed.categoryId,
    name: parsed.name,
    slug: sanitizeSlug(parsed.name),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  await refreshCategoryStats(uid, current.categoryId);
  if (current.categoryId !== parsed.categoryId) {
    await refreshCategoryStats(uid, parsed.categoryId);
  }

  await syncPublicCommerceSections(uid);
  invalidatePublicCommerceCache({
    currentUsername: owner?.usernameLower || owner?.username,
    mode: owner?.commerceMode || owner?.commerce?.activeMode,
  });
  return { categoryId: parsed.categoryId, subcategoryId: parsed.id };
}

export async function deleteCommerceSubcategory(uid, subcategoryId, user = null) {
  const owner = user || await getUserByUid(uid);
  const snap = await subcategoriesCollection(uid).doc(subcategoryId).get();
  if (!snap.exists) throw new Error("Subcategoría no encontrada.");
  const subcategory = normalizeSubcategoryDoc(snap);
  if (subcategory.productCount > 0) {
    throw new Error("Vacía primero la subcategoría antes de eliminarla.");
  }

  await subcategoriesCollection(uid).doc(subcategoryId).delete();
  await refreshCategoryStats(uid, subcategory.categoryId);
  await refreshCommerceSummary(uid, owner);
  await syncPublicCommerceSections(uid);
  invalidatePublicCommerceCache({
    currentUsername: owner?.usernameLower || owner?.username,
    mode: owner?.commerceMode || owner?.commerce?.activeMode,
  });
  return { categoryId: subcategory.categoryId };
}

export async function moveCommerceSubcategory(uid, subcategoryId, direction, user = null) {
  const owner = user || await getUserByUid(uid);
  const currentSnap = await subcategoriesCollection(uid).doc(subcategoryId).get();
  if (!currentSnap.exists) throw new Error("Subcategoría no encontrada.");
  const current = normalizeSubcategoryDoc(currentSnap);
  const siblingsSnap = await subcategoriesCollection(uid)
    .where("categoryId", "==", current.categoryId)
    .orderBy("orderIndex")
    .get();
  const siblings = siblingsSnap.docs.map(normalizeSubcategoryDoc);
  const index = siblings.findIndex((item) => item.id === subcategoryId);
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || targetIndex < 0 || targetIndex >= siblings.length) {
    return { categoryId: current.categoryId, subcategoryId };
  }

  const adjacent = siblings[targetIndex];
  await Promise.all([
    subcategoriesCollection(uid).doc(current.id).set({ orderIndex: adjacent.orderIndex, updatedAt: FieldValue.serverTimestamp() }, { merge: true }),
    subcategoriesCollection(uid).doc(adjacent.id).set({ orderIndex: current.orderIndex, updatedAt: FieldValue.serverTimestamp() }, { merge: true }),
  ]);
  await refreshCategoryStats(uid, current.categoryId);
  await syncPublicCommerceSections(uid);
  invalidatePublicCommerceCache({
    currentUsername: owner?.usernameLower || owner?.username,
    mode: owner?.commerceMode || owner?.commerce?.activeMode,
  });
  return { categoryId: current.categoryId, subcategoryId };
}

export async function saveCommerceProduct(uid, rawInput, assets = {}, user = null) {
  const owner = user || await getUserByUid(uid);
  if (!owner) throw new Error("Usuario no encontrado.");

  const activeMode = normalizeCommerceMode(rawInput.mode || owner.commerceMode || owner.commerce?.activeMode);
  if (!activeMode) {
    throw new Error("Activa Mi tienda, Mi menú o Mi catálogo antes de crear productos.");
  }

  const parsed = commerceProductSchema.parse({
    ...rawInput,
    mode: activeMode,
    visible: rawInput.visible !== false,
  });

  const limits = resolveCommercePlanLimits(owner.plan || owner.status);
  const ref = parsed.id ? productsCollection(uid).doc(parsed.id) : productsCollection(uid).doc(buildCommerceId("prod"));
  const existingSnap = await ref.get();
  const existing = existingSnap.exists ? normalizeProductDoc(existingSnap) : null;

  if (!existing) {
    const productCount = (await productsCollection(uid).count().get()).data().count || 0;
    if (productCount >= limits.maxProducts) {
      throw new Error(`Tu plan permite hasta ${limits.maxProducts} productos publicados.`);
    }
  }

  const { category, subcategory } = await ensureCategoryPlacement(uid, parsed.categoryId, parsed.subcategoryId);
  const normalizedPrice = normalizePrice(parsed.price);
  if (requiresCommercePrice(activeMode) && normalizedPrice === null) {
    throw new Error("El precio es obligatorio en Mi tienda y Mi menú.");
  }

  let productImages = normalizeProductImages(existing?.images, existing || {});
  if (Array.isArray(assets.images) && assets.images.length) {
    productImages = await Promise.all(
      assets.images.map((file, index) => optimizeCommerceProductImage(uid, ref.id, file, `${String(index + 1).padStart(2, "0")}_${buildCommerceId("img")}`)),
    );
  } else if (!productImages.length) {
    throw new Error("La imagen del producto es obligatoria.");
  }
  const primaryImage = productImages[0] || null;

  const siblingQuery = subcategory
    ? productsCollection(uid).where("subcategoryId", "==", subcategory.id).orderBy("orderIndex")
    : productsCollection(uid).where("categoryId", "==", category.id).where("subcategoryId", "==", "").orderBy("orderIndex");
  const orderIndex = existing?.orderIndex || await getNextOrderIndex(siblingQuery);

  await ref.set({
    mode: activeMode,
    categoryId: category.id,
    subcategoryId: subcategory?.id || "",
    name: parsed.name,
    description: parsed.description || "",
    price: normalizedPrice,
    visible: parsed.visible,
    orderIndex,
    imageUrl: primaryImage?.imageUrl || "",
    imageThumbUrl: primaryImage?.imageThumbUrl || primaryImage?.imageUrl || "",
    imagePath: primaryImage?.imagePath || "",
    imageThumbPath: primaryImage?.imageThumbPath || "",
    imageWidth: primaryImage?.imageWidth || 0,
    imageHeight: primaryImage?.imageHeight || 0,
    images: productImages,
    createdAt: existing?.createdAt ? Timestamp.fromDate(existing.createdAt) : FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  if (Array.isArray(assets.images) && assets.images.length && existing) {
    await removeStoragePaths(getProductStoragePaths(existing));
  }

  if (existing?.subcategoryId) {
    await refreshSubcategoryStats(uid, existing.subcategoryId);
  }
  if (subcategory?.id) {
    await refreshSubcategoryStats(uid, subcategory.id);
  }
  if (existing?.categoryId) {
    await refreshCategoryStats(uid, existing.categoryId);
  }
  await refreshCategoryStats(uid, category.id);
  await refreshCommerceSummary(uid, owner);
  await syncPublicCommerceSections(uid);
  invalidatePublicCommerceCache({
    currentUsername: owner.usernameLower || owner.username,
    mode: activeMode,
  });
  return { categoryId: category.id, subcategoryId: subcategory?.id || "", productId: ref.id };
}

export async function deleteCommerceProduct(uid, productId, user = null) {
  const owner = user || await getUserByUid(uid);
  const snap = await productsCollection(uid).doc(productId).get();
  if (!snap.exists) throw new Error("Producto no encontrado.");
  const product = normalizeProductDoc(snap);

  await productsCollection(uid).doc(productId).delete();
  await removeStoragePaths(getProductStoragePaths(product));
  if (product.subcategoryId) {
    await refreshSubcategoryStats(uid, product.subcategoryId);
  }
  await refreshCategoryStats(uid, product.categoryId);
  await refreshCommerceSummary(uid, owner);
  await syncPublicCommerceSections(uid);
  invalidatePublicCommerceCache({
    currentUsername: owner?.usernameLower || owner?.username,
    mode: owner?.commerceMode || owner?.commerce?.activeMode,
  });
  return { categoryId: product.categoryId, subcategoryId: product.subcategoryId || "", productId };
}

export async function moveCommerceProduct(uid, productId, direction, user = null) {
  const owner = user || await getUserByUid(uid);
  const snap = await productsCollection(uid).doc(productId).get();
  if (!snap.exists) throw new Error("Producto no encontrado.");
  const product = normalizeProductDoc(snap);
  const siblingsQuery = product.subcategoryId
    ? productsCollection(uid).where("subcategoryId", "==", product.subcategoryId).orderBy("orderIndex")
    : productsCollection(uid).where("categoryId", "==", product.categoryId).where("subcategoryId", "==", "").orderBy("orderIndex");
  const siblingsSnap = await siblingsQuery.get();
  const siblings = siblingsSnap.docs.map(normalizeProductDoc);
  const index = siblings.findIndex((item) => item.id === productId);
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || targetIndex < 0 || targetIndex >= siblings.length) {
    return { categoryId: product.categoryId, subcategoryId: product.subcategoryId || "", productId };
  }

  const adjacent = siblings[targetIndex];
  await Promise.all([
    productsCollection(uid).doc(product.id).set({ orderIndex: adjacent.orderIndex, updatedAt: FieldValue.serverTimestamp() }, { merge: true }),
    productsCollection(uid).doc(adjacent.id).set({ orderIndex: product.orderIndex, updatedAt: FieldValue.serverTimestamp() }, { merge: true }),
  ]);

  await syncPublicCommerceSections(uid);
  invalidatePublicCommerceCache({
    currentUsername: owner?.usernameLower || owner?.username,
    mode: owner?.commerceMode || owner?.commerce?.activeMode,
  });
  return { categoryId: product.categoryId, subcategoryId: product.subcategoryId || "", productId };
}

export async function toggleCommerceProductVisibility(uid, productId, visible, user = null) {
  const owner = user || await getUserByUid(uid);
  const snap = await productsCollection(uid).doc(productId).get();
  if (!snap.exists) throw new Error("Producto no encontrado.");
  const product = normalizeProductDoc(snap);
  await productsCollection(uid).doc(productId).set({
    visible: Boolean(visible),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  if (product.subcategoryId) {
    await refreshSubcategoryStats(uid, product.subcategoryId);
  }
  await refreshCategoryStats(uid, product.categoryId);
  await refreshCommerceSummary(uid, owner);
  await syncPublicCommerceSections(uid);
  invalidatePublicCommerceCache({
    currentUsername: owner?.usernameLower || owner?.username,
    mode: owner?.commerceMode || owner?.commerce?.activeMode,
  });
  return { categoryId: product.categoryId, subcategoryId: product.subcategoryId || "", productId };
}

async function readPublicCategories(uid) {
  const snap = await categoriesCollection(uid).orderBy("orderIndex").get();
  return snap.docs.map(normalizeCategoryDoc);
}

async function readPublicSubcategories(uid, categoryId) {
  const snap = await subcategoriesCollection(uid)
    .where("categoryId", "==", categoryId)
    .orderBy("orderIndex")
    .get();
  return snap.docs.map(normalizeSubcategoryDoc);
}

async function readPublicProducts(uid, { categoryId = "", subcategoryId = "", limit = COMMERCE_PRODUCT_PAGE_SIZE, after = null } = {}) {
  let query = productsCollection(uid).where("visible", "==", true);
  if (subcategoryId) {
    query = query.where("subcategoryId", "==", subcategoryId);
  } else {
    query = query.where("categoryId", "==", categoryId).where("subcategoryId", "==", "");
  }
  query = query.orderBy("orderIndex");
  if (after !== null && after !== undefined && after !== "") {
    query = query.startAfter(Number(after));
  }
  const snap = await query.limit(limit + 1).get();
  const docs = snap.docs.map(normalizeProductDoc);
  const hasMore = docs.length > limit;
  const items = hasMore ? docs.slice(0, limit) : docs;
  return {
    items,
    hasMore,
    nextCursor: hasMore ? items.at(-1)?.orderIndex || null : null,
  };
}

async function readPublicSectionSnapshot(uid, { categoryId = "", subcategoryId = "", includeSubcategories = true, after = null } = {}) {
  if (after !== null && after !== undefined && after !== "") return null;
  const sectionId = includeSubcategories && categoryId
    ? buildPublicCategorySectionId(categoryId)
    : subcategoryId
      ? buildPublicSubcategorySectionId(subcategoryId)
      : categoryId
        ? buildPublicCategorySectionId(categoryId)
        : "";
  if (!sectionId) return null;

  const snap = await publicSectionsCollection(uid).doc(sectionId).get();
  if (!snap.exists) return null;
  const section = normalizePublicSectionDoc(snap);
  return {
    categoryId: section.categoryId || categoryId,
    subcategoryId: section.subcategoryId || subcategoryId,
    ...(includeSubcategories ? { subcategories: section.subcategories } : {}),
    products: section.products,
    hasMore: section.hasMore,
    nextCursor: section.nextCursor,
    pageSize: COMMERCE_PRODUCT_PAGE_SIZE,
  };
}

async function readAllPublicSectionSnapshots(uid) {
  const snap = await publicSectionsCollection(uid).get();
  return snap.docs.map(normalizePublicSectionDoc);
}

function buildPrefetchedPublicSections(sections = []) {
  const subcategoriesByCategory = new Map();
  const prefetched = [];

  sections.forEach((section) => {
    if (section.type === "category" && section.categoryId) {
      subcategoriesByCategory.set(section.categoryId, section.subcategories || []);
    }
  });

  sections.forEach((section) => {
    if (!section.categoryId) return;
    const subcategories = section.type === "category"
      ? section.subcategories || []
      : subcategoriesByCategory.get(section.categoryId) || [];

    prefetched.push({
      key: `${section.categoryId}:${section.subcategoryId || ""}`,
      categoryId: section.categoryId,
      subcategoryId: section.subcategoryId || "",
      subcategories,
      products: section.products || [],
      hasMore: Boolean(section.hasMore),
      nextCursor: section.nextCursor ?? null,
    });
  });

  return prefetched;
}

export async function getPublicCommerceBootstrap(owner) {
  const user = buildPublicCommerceViewUser(owner);
  const config = normalizeCommerceConfig(owner.commerce, owner);
  const activeMode = normalizeCommerceMode(config.activeMode || owner.commerceMode);
  if (!activeMode || ["suspended", "cancelled"].includes(owner.status)) return null;

  const categories = await readPublicCategories(owner.uid);
  const prefetchedSections = shouldPreloadPublicSections(config)
    ? buildPrefetchedPublicSections(await readAllPublicSectionSnapshots(owner.uid))
    : [];
  const firstCategory = categories[0] || null;
  let initialSubcategories = [];
  let initialProducts = [];
  let initialSubcategoryId = "";

  if (firstCategory) {
    const snapshot = await readPublicSectionSnapshot(owner.uid, { categoryId: firstCategory.id, includeSubcategories: true });
    if (snapshot) {
      return {
        business: user,
        config,
        mode: activeMode,
        modeMeta: resolveCommerceModeMeta(activeMode),
        supportsCart: supportsCommerceCart(activeMode),
        requiresPrice: requiresCommercePrice(activeMode),
        orderWhatsapp: resolveCommerceWhatsapp(owner),
        categories,
        initialSelection: {
          categoryId: snapshot.categoryId || firstCategory.id,
          subcategoryId: snapshot.subcategoryId || "",
        },
        initialSubcategories: snapshot.subcategories || [],
        initialProducts: snapshot.products || [],
        initialPagination: {
          hasMore: snapshot.hasMore,
          nextCursor: snapshot.nextCursor,
        },
        prefetchedSections,
        publicUrl: buildCommercePublicUrl(owner.username, activeMode),
      };
    }

    initialSubcategories = await readPublicSubcategories(owner.uid, firstCategory.id);
    if (firstCategory.hasSubcategories && initialSubcategories.length) {
      initialSubcategoryId = initialSubcategories[0].id;
      const result = await readPublicProducts(owner.uid, { subcategoryId: initialSubcategoryId });
      initialProducts = result.items;
      initialSubcategories = initialSubcategories.map((item) => ({ ...item }));
      return {
        business: user,
        config,
        mode: activeMode,
        modeMeta: resolveCommerceModeMeta(activeMode),
        supportsCart: supportsCommerceCart(activeMode),
        requiresPrice: requiresCommercePrice(activeMode),
        orderWhatsapp: resolveCommerceWhatsapp(owner),
        categories,
        initialSelection: {
          categoryId: firstCategory?.id || "",
          subcategoryId: initialSubcategoryId,
        },
        initialSubcategories,
        initialProducts,
        initialPagination: {
          hasMore: result.hasMore,
          nextCursor: result.nextCursor,
        },
        prefetchedSections,
        publicUrl: buildCommercePublicUrl(owner.username, activeMode),
      };
    } else {
      const result = await readPublicProducts(owner.uid, { categoryId: firstCategory.id });
      initialProducts = result.items;
      return {
        business: user,
        config,
        mode: activeMode,
        modeMeta: resolveCommerceModeMeta(activeMode),
        supportsCart: supportsCommerceCart(activeMode),
        requiresPrice: requiresCommercePrice(activeMode),
        orderWhatsapp: resolveCommerceWhatsapp(owner),
        categories,
        initialSelection: {
          categoryId: firstCategory?.id || "",
          subcategoryId: initialSubcategoryId,
        },
        initialSubcategories,
        initialProducts,
        initialPagination: {
          hasMore: result.hasMore,
          nextCursor: result.nextCursor,
        },
        prefetchedSections,
        publicUrl: buildCommercePublicUrl(owner.username, activeMode),
      };
    }
  }

  return {
    business: user,
    config,
    mode: activeMode,
    modeMeta: resolveCommerceModeMeta(activeMode),
    supportsCart: supportsCommerceCart(activeMode),
    requiresPrice: requiresCommercePrice(activeMode),
    orderWhatsapp: resolveCommerceWhatsapp(owner),
    categories,
    initialSelection: {
      categoryId: firstCategory?.id || "",
      subcategoryId: initialSubcategoryId,
    },
    initialSubcategories,
    initialProducts,
    initialPagination: {
      hasMore: false,
      nextCursor: null,
    },
    prefetchedSections,
    publicUrl: buildCommercePublicUrl(owner.username, activeMode),
  };
}

export async function getPublicCommerceChunk(uid, { categoryId = "", subcategoryId = "", after = null, includeSubcategories = true } = {}) {
  if (!categoryId && !subcategoryId) {
    throw new Error("Selecciona una categoría para cargar productos.");
  }

  const resolvedCategoryId = categoryId || (
    subcategoryId
      ? (await subcategoriesCollection(uid).doc(subcategoryId).get()).data()?.categoryId || ""
      : ""
  );
  const snapshot = await readPublicSectionSnapshot(uid, { categoryId: resolvedCategoryId, subcategoryId, includeSubcategories, after });
  if (snapshot) return snapshot;

  const subcategories = includeSubcategories && resolvedCategoryId ? await readPublicSubcategories(uid, resolvedCategoryId) : [];
  const resolvedSubcategoryId = subcategoryId || subcategories[0]?.id || "";
  const productsResult = await readPublicProducts(uid, { categoryId: resolvedCategoryId, subcategoryId: resolvedSubcategoryId, after });

  return {
    categoryId: resolvedCategoryId,
    subcategoryId: resolvedSubcategoryId,
    ...(includeSubcategories ? { subcategories } : {}),
    products: productsResult.items,
    hasMore: productsResult.hasMore,
    nextCursor: productsResult.nextCursor,
    pageSize: COMMERCE_PRODUCT_PAGE_SIZE,
  };
}
