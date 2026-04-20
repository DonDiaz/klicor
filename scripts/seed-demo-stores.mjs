import { existsSync, readFileSync } from "node:fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const DEMO_PASSWORD = "KlicorDemo2026!";
const ORDER_STEP = 1024;

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
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
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

function slugify(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function categoryKey(value = "") {
  return slugify(value).replace(/-/g, "_");
}

function image(url, index = 1) {
  const cleanUrl = String(url || "").trim();
  return {
    id: `image-${index}`,
    imageUrl: cleanUrl,
    imageThumbUrl: cleanUrl,
    imagePath: "",
    imageThumbPath: "",
    imageWidth: 1200,
    imageHeight: 900,
  };
}

function unsplash(id, width = 1200, height = 900) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&h=${height}&q=82`;
}

function logoUrl(name, color = "22A98A") {
  const initials = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${initials}&background=${color}&color=ffffff&bold=true&size=512&format=png`;
}

function mapsUrl(lat, lng) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

function profileLinks({ whatsapp, maps, instagram, facebook, tiktok, website }) {
  const items = [
    {
      id: "whatsapp-main",
      type: "whatsapp",
      label: "WhatsApp",
      value: whatsapp,
      message: "Hola, vi tu Klicor y quiero más información.",
      priorityTier: 1,
      url: `https://wa.me/57${whatsapp}?text=${encodeURIComponent("Hola, vi tu Klicor y quiero más información.")}`,
    },
    maps && {
      id: "maps-main",
      type: "maps",
      label: "Cómo llegar",
      value: maps,
      message: "",
      priorityTier: 2,
      url: maps,
    },
    website && {
      id: "website-main",
      type: "website",
      label: "Sitio web",
      value: website,
      message: "",
      priorityTier: 2,
      url: website,
    },
    instagram && {
      id: "instagram-main",
      type: "instagram",
      label: "Instagram",
      value: instagram,
      message: "",
      priorityTier: 3,
      url: instagram,
    },
    facebook && {
      id: "facebook-main",
      type: "facebook",
      label: "Facebook",
      value: facebook,
      message: "",
      priorityTier: 3,
      url: facebook,
    },
    tiktok && {
      id: "tiktok-main",
      type: "tiktok",
      label: "TikTok",
      value: tiktok,
      message: "",
      priorityTier: 3,
      url: tiktok,
    },
  ].filter(Boolean);

  return items;
}

function legacyLinks(links = []) {
  return Object.fromEntries(links.map((item) => [item.type, item.value]));
}

function businessHours() {
  return {
    enabled: true,
    timezone: "America/Bogota",
    allowOrdersWhenClosed: false,
    days: [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ].map((day) => ({
      day,
      isOpen: true,
      mode: day === "saturday" ? "continuous" : "split",
      shifts: day === "saturday"
        ? [{ start: "08:00", end: "14:00" }]
        : [
          { start: "08:00", end: "12:00" },
          { start: "14:00", end: "19:00" },
        ],
    })).concat([{
      day: "sunday",
      isOpen: false,
      mode: "continuous",
      shifts: [{ start: "09:00", end: "13:00" }],
    }]),
  };
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

const DEMO_BUSINESSES = [
  {
    uid: "demo-palermo-pizzeria",
    email: "donjhonnathan+klicor.palermo@gmail.com",
    username: "palermo-pizzeria-demo",
    publicLinkId: "demo-palermo-pizzeria",
    businessName: "Palermo Pizzería",
    businessCategory: "food_drink",
    businessType: "pizza",
    headline: "Pizza artesanal, entradas y bebidas para pedir fácil",
    subheadline: "Haz tu pedido aquí.",
    whatsapp: "3175001001",
    color: "E07A5F",
    lat: 8.23792,
    lng: -73.35611,
    zone: "Centro",
    address: "Centro, Ocaña",
    placeName: "Zona histórica",
    reference: "A dos cuadras del parque principal",
    cover: unsplash("photo-1513104890138-7c749659a591"),
    dorikaDescription: "Pizzería artesanal para comer rico en el centro de Ocaña.",
    mode: "mimenu",
    categories: [
      {
        id: "cat-pizzas",
        name: "Pizzas",
        subcategories: [
          {
            id: "sub-tradicionales",
            name: "Tradicionales",
            products: [
              ["Pizza margarita", 22000, "Tomate, queso mozzarella y albahaca fresca.", "photo-1513104890138-7c749659a591", true],
              ["Pizza hawaiana", 25000, "Jamón, piña y queso gratinado.", "photo-1565299624946-b28f40a0ae38", false],
            ],
          },
          {
            id: "sub-especiales",
            name: "Especiales",
            products: [
              ["Pizza Palermo", 32000, "Pepperoni, champiñones, maíz y queso extra.", "photo-1604382354936-07c5d9983bd3", true],
              ["Pizza cuatro quesos", 30000, "Mezcla cremosa de quesos sobre masa artesanal.", "photo-1594007654729-407eedc4be65", false],
            ],
          },
        ],
      },
      {
        id: "cat-entradas",
        name: "Entradas",
        products: [
          ["Pan de ajo", 9000, "Pan tostado con mantequilla de ajo y queso.", "photo-1573140247632-f8fd74997d5c", false],
          ["Palitos de queso", 12000, "Crujientes por fuera y suaves por dentro.", "photo-1541592106381-b31e9677c0e5", false],
        ],
      },
      {
        id: "cat-bebidas",
        name: "Bebidas",
        products: [
          ["Limonada natural", 7000, "Refrescante y preparada al momento.", "photo-1621263764928-df1444c5e859", false],
          ["Gaseosa personal", 5000, "Bebida fría para acompañar tu pedido.", "photo-1581006852262-e4307cf6283a", false],
        ],
      },
    ],
  },
  {
    uid: "demo-cafe-cenia",
    email: "donjhonnathan+klicor.cenia@gmail.com",
    username: "cafe-cenia-demo",
    publicLinkId: "demo-cafe-cenia",
    businessName: "Café Cenia",
    businessCategory: "food_drink",
    businessType: "cafe",
    headline: "Café, panadería y desayunos para comenzar bien",
    subheadline: "Pide aquí y recoge en tienda.",
    whatsapp: "3175001002",
    color: "8B5E34",
    lat: 8.23852,
    lng: -73.35492,
    zone: "Centro histórico",
    address: "Centro histórico, Ocaña",
    placeName: "Calle de las cafeterías",
    reference: "Frente a la esquina del parque",
    cover: unsplash("photo-1495474472287-4d71bcdd2085"),
    dorikaDescription: "Café de especialidad, pan fresco y desayunos cerca del centro.",
    mode: "mimenu",
    categories: [
      {
        id: "cat-cafe",
        name: "Café",
        products: [
          ["Café americano", 5000, "Café suave y aromático.", "photo-1509042239860-f550ce710b93", true],
          ["Capuchino", 7500, "Espuma cremosa y café balanceado.", "photo-1517701604599-bb29b565090c", true],
          ["Latte vainilla", 9000, "Café con leche y toque de vainilla.", "photo-1461023058943-07fcbe16d735", false],
        ],
      },
      {
        id: "cat-panaderia",
        name: "Panadería",
        products: [
          ["Croissant", 6500, "Hojaldre fresco y dorado.", "photo-1555507036-ab1f4038808a", true],
          ["Pan de chocolate", 7000, "Pan suave con relleno de chocolate.", "photo-1620146344904-097a0002d797", false],
        ],
      },
      {
        id: "cat-desayunos",
        name: "Desayunos",
        subcategories: [
          {
            id: "sub-ligeros",
            name: "Ligeros",
            products: [
              ["Tostadas con huevo", 14000, "Tostadas, huevo y bebida caliente.", "photo-1525351484163-7529414344d8", false],
              ["Bowl de frutas", 12000, "Frutas frescas con granola.", "photo-1511690743698-d9d85f2fbf38", false],
            ],
          },
          {
            id: "sub-completos",
            name: "Completos",
            products: [
              ["Desayuno Cenia", 18000, "Huevos, pan artesanal, fruta y café.", "photo-1533089860892-a7c6f0a88666", false],
            ],
          },
        ],
      },
    ],
  },
  {
    uid: "demo-la-esquina-market",
    email: "donjhonnathan+klicor.market@gmail.com",
    username: "la-esquina-market-demo",
    publicLinkId: "demo-la-esquina-market",
    businessName: "La Esquina Market",
    businessCategory: "retail_sales",
    businessType: "neighborhood_store",
    headline: "Mercado, bebidas y básicos del día cerca de ti",
    subheadline: "Compra rápido por WhatsApp.",
    whatsapp: "3175001003",
    color: "22A98A",
    lat: 8.23694,
    lng: -73.35802,
    zone: "La Primavera",
    address: "Barrio La Primavera, Ocaña",
    placeName: "Tienda de esquina",
    reference: "Local verde junto a la panadería",
    cover: unsplash("photo-1542838132-92c53300491e"),
    dorikaDescription: "Tienda de barrio con víveres, snacks, aseo y bebidas frías.",
    mode: "mitienda",
    categories: [
      {
        id: "cat-despensa",
        name: "Despensa",
        products: [
          ["Arroz Diana 500 g", 2800, "Arroz blanco para el mercado diario.", "photo-1586201375761-83865001e31c", true],
          ["Aceite vegetal 1 L", 9800, "Aceite para cocina familiar.", "photo-1620706857370-e1b9770e8bb1", false],
          ["Lenteja 500 g", 4200, "Grano seleccionado.", "photo-1606787366850-de6330128bfc", false],
        ],
      },
      {
        id: "cat-bebidas",
        name: "Bebidas",
        products: [
          ["Agua fría 600 ml", 2500, "Botella personal fría.", "photo-1523362628745-0c100150b504", true],
          ["Gaseosa 1.5 L", 6500, "Ideal para compartir.", "photo-1581006852262-e4307cf6283a", false],
        ],
      },
      {
        id: "cat-snacks",
        name: "Snacks",
        products: [
          ["Papas naturales", 3500, "Snack crocante para cualquier momento.", "photo-1566478989037-eec170784d0b", false],
          ["Galletas surtidas", 4500, "Paquete familiar.", "photo-1590080875515-8a3a8dc5735e", false],
        ],
      },
      {
        id: "cat-aseo",
        name: "Aseo",
        products: [
          ["Jabón líquido", 8500, "Presentación para el hogar.", "photo-1584464491033-06628f3a6b7b", false],
          ["Papel higiénico", 12000, "Paquete de uso familiar.", "photo-1583947215259-38e31be8751f", false],
        ],
      },
    ],
  },
  {
    uid: "demo-arte-y-tradicion",
    email: "donjhonnathan+klicor.arte@gmail.com",
    username: "arte-y-tradicion-demo",
    publicLinkId: "demo-arte-y-tradicion",
    businessName: "Arte y Tradición",
    businessCategory: "retail_sales",
    businessType: "gifts",
    headline: "Detalles artesanales, accesorios y regalos con identidad",
    subheadline: "Pregunta por disponibilidad.",
    whatsapp: "3175001004",
    color: "E07A5F",
    lat: 8.23916,
    lng: -73.35721,
    zone: "Centro",
    address: "Centro, Ocaña",
    placeName: "Pasaje artesanal",
    reference: "Local 4, entrando por la puerta principal",
    cover: unsplash("photo-1584917865442-de89df76afd3"),
    dorikaDescription: "Vitrina de regalos, bolsos, accesorios y piezas artesanales.",
    mode: "micatalogo",
    categories: [
      {
        id: "cat-bolsos",
        name: "Bolsos",
        products: [
          ["Mochila Wayúu colorida", 120000, "Mochila tejida con diseño tradicional.", "photo-1584917865442-de89df76afd3", true],
          ["Bolso tejido pequeño", 68000, "Bolso liviano para uso diario.", "photo-1523779105320-d1cd346ff52b", false],
        ],
      },
      {
        id: "cat-accesorios",
        name: "Accesorios",
        products: [
          ["Pulsera artesanal", 18000, "Pulsera ajustable hecha a mano.", "photo-1515562141207-7a88fb7ce338", true],
          ["Aretes tejidos", 25000, "Aretes ligeros con color local.", "photo-1535632066927-ab7c9ab60908", false],
          ["Collar de semillas", 32000, "Pieza natural de estilo artesanal.", "photo-1599643478518-a784e5dc4c8f", false],
        ],
      },
      {
        id: "cat-regalos",
        name: "Regalos",
        products: [
          ["Caja detalle", 55000, "Caja lista para regalar con productos locales.", "photo-1512909006721-3d6018887383", true],
          ["Taza ilustrada", 28000, "Taza con diseño inspirado en Ocaña.", "photo-1514228742587-6b1558fcf93a", false],
        ],
      },
    ],
  },
  {
    uid: "demo-paso-fino-calzado",
    email: "donjhonnathan+klicor.calzado@gmail.com",
    username: "paso-fino-calzado-demo",
    publicLinkId: "demo-paso-fino-calzado",
    businessName: "Paso Fino Calzado",
    businessCategory: "retail_sales",
    businessType: "shoes",
    headline: "Zapatos, tenis y sandalias para estrenar sin enredos",
    subheadline: "Elige tu referencia y pide por WhatsApp.",
    whatsapp: "3175001005",
    color: "355E3B",
    lat: 8.23598,
    lng: -73.35543,
    zone: "Centro comercial",
    address: "Centro comercial, Ocaña",
    placeName: "Centro comercial Plaza Real",
    floor: "Piso 2",
    unit: "Local 208",
    reference: "Subiendo las escaleras, pasillo derecho",
    cover: unsplash("photo-1549298916-b41d501d3772"),
    dorikaDescription: "Calzado para mujer y hombre con referencias listas para pedir.",
    mode: "mitienda",
    categories: [
      {
        id: "cat-tenis",
        name: "Tenis",
        subcategories: [
          {
            id: "sub-dama",
            name: "Dama",
            products: [
              ["Tenis urbano blanco", 135000, "Tenis cómodo para uso diario.", "photo-1549298916-b41d501d3772", true],
              ["Tenis plataforma beige", 155000, "Diseño moderno con suela alta.", "photo-1543508282-6319a3e2621f", false],
            ],
          },
          {
            id: "sub-caballero",
            name: "Caballero",
            products: [
              ["Tenis casual negro", 145000, "Diseño versátil para diario.", "photo-1460353581641-37baddab0fa2", true],
              ["Tenis deportivo gris", 168000, "Suela liviana y cómoda.", "photo-1542291026-7eec264c27ff", false],
            ],
          },
        ],
      },
      {
        id: "cat-sandalias",
        name: "Sandalias",
        products: [
          ["Sandalia plana café", 78000, "Sandalia cómoda para clima cálido.", "photo-1603487742131-4160ec999306", false],
          ["Sandalia elegante", 98000, "Diseño sencillo para ocasiones especiales.", "photo-1596703263926-eb0762ee17e4", false],
        ],
      },
      {
        id: "cat-accesorios",
        name: "Accesorios",
        products: [
          ["Plantillas confort", 22000, "Soporte suave para caminar mejor.", "photo-1582897085656-c636d006a246", false],
          ["Limpiador de calzado", 18000, "Espuma limpiadora para tenis y zapatos.", "photo-1607166452427-7e4477079cb9", false],
        ],
      },
    ],
  },
];

function buildProduct(raw, business, category, subcategory, productIndex) {
  const [name, price, description, imageId, featured] = raw;
  const primaryImage = unsplash(imageId);
  const gallery = [
    image(primaryImage, 1),
    image(unsplash(imageId, 900, 900), 2),
  ];

  return {
    id: `prod-${slugify(name)}`,
    mode: business.mode,
    categoryId: category.id,
    subcategoryId: subcategory?.id || "",
    name,
    description,
    price,
    visible: true,
    featuredInDorika: Boolean(featured),
    orderIndex: productIndex * ORDER_STEP,
    imageUrl: primaryImage,
    imageThumbUrl: primaryImage,
    imagePath: "",
    imageThumbPath: "",
    imageWidth: 1200,
    imageHeight: 900,
    images: gallery,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

function flattenCommerce(business) {
  const categories = [];
  const subcategories = [];
  const products = [];

  business.categories.forEach((category, categoryIndex) => {
    const categoryProducts = [];
    const categorySubcategories = [];
    let firstSubcategoryId = "";

    (category.subcategories || []).forEach((subcategory, subcategoryIndex) => {
      if (!firstSubcategoryId) firstSubcategoryId = subcategory.id;
      const subcategoryProducts = (subcategory.products || []).map((product, productIndex) => buildProduct(
        product,
        business,
        category,
        subcategory,
        productIndex + 1,
      ));
      products.push(...subcategoryProducts);
      categorySubcategories.push({
        id: subcategory.id,
        categoryId: category.id,
        name: subcategory.name,
        slug: slugify(subcategory.name),
        normalizedKey: categoryKey(subcategory.name),
        iconKey: categoryKey(subcategory.name),
        iconSource: "seed",
        iconMatchedAlias: "",
        orderIndex: (subcategoryIndex + 1) * ORDER_STEP,
        productCount: subcategoryProducts.length,
        visibleProductCount: subcategoryProducts.filter((product) => product.visible).length,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    (category.products || []).forEach((product, productIndex) => {
      const nextProduct = buildProduct(product, business, category, null, productIndex + 1);
      products.push(nextProduct);
      categoryProducts.push(nextProduct);
    });

    const allCategoryProducts = products.filter((product) => product.categoryId === category.id);
    const previewProduct = allCategoryProducts[0];
    categories.push({
      id: category.id,
      name: category.name,
      slug: slugify(category.name),
      normalizedKey: categoryKey(category.name),
      iconKey: categoryKey(category.name),
      iconSource: "seed",
      iconMatchedAlias: "",
      imageUrl: previewProduct?.imageUrl || business.cover,
      imageThumbUrl: previewProduct?.imageThumbUrl || business.cover,
      orderIndex: (categoryIndex + 1) * ORDER_STEP,
      hasSubcategories: categorySubcategories.length > 0,
      subcategoryCount: categorySubcategories.length,
      firstSubcategoryId,
      productCount: allCategoryProducts.length,
      visibleProductCount: allCategoryProducts.filter((product) => product.visible).length,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    subcategories.push(...categorySubcategories);
  });

  return { categories, subcategories, products };
}

function productSummary(product) {
  return {
    id: product.id,
    mode: product.mode,
    categoryId: product.categoryId,
    subcategoryId: product.subcategoryId,
    name: product.name,
    description: product.description,
    price: product.price,
    featuredInDorika: product.featuredInDorika,
    orderIndex: product.orderIndex,
    imageUrl: product.imageUrl,
    imageThumbUrl: product.imageThumbUrl,
    imageWidth: product.imageWidth,
    imageHeight: product.imageHeight,
    images: product.images.map((item) => ({
      id: item.id,
      imageUrl: item.imageUrl,
      imageThumbUrl: item.imageThumbUrl,
      imageWidth: item.imageWidth,
      imageHeight: item.imageHeight,
    })),
  };
}

function subcategorySummary(subcategory) {
  return {
    id: subcategory.id,
    categoryId: subcategory.categoryId,
    name: subcategory.name,
    slug: subcategory.slug,
    normalizedKey: subcategory.normalizedKey,
    iconKey: subcategory.iconKey,
    iconSource: subcategory.iconSource,
    iconMatchedAlias: subcategory.iconMatchedAlias,
    orderIndex: subcategory.orderIndex,
    productCount: subcategory.productCount,
    visibleProductCount: subcategory.visibleProductCount,
  };
}

function publicSections(categories, subcategories, products) {
  const sections = [];
  const subcategoriesByCategory = new Map();
  const productsBySubcategory = new Map();
  const productsByCategory = new Map();

  for (const subcategory of subcategories) {
    const current = subcategoriesByCategory.get(subcategory.categoryId) || [];
    current.push(subcategory);
    subcategoriesByCategory.set(subcategory.categoryId, current);
  }

  for (const product of products.filter((item) => item.visible)) {
    const categoryProducts = productsByCategory.get(product.categoryId) || [];
    categoryProducts.push(product);
    productsByCategory.set(product.categoryId, categoryProducts);

    if (product.subcategoryId) {
      const current = productsBySubcategory.get(product.subcategoryId) || [];
      current.push(product);
      productsBySubcategory.set(product.subcategoryId, current);
    }
  }

  for (const category of categories) {
    const categoryProducts = (productsByCategory.get(category.id) || []).sort((a, b) => a.orderIndex - b.orderIndex);
    const previewImage = categoryProducts[0]
      ? {
        imageUrl: categoryProducts[0].imageUrl,
        imageThumbUrl: categoryProducts[0].imageThumbUrl,
      }
      : null;

    const categorySubcategories = (subcategoriesByCategory.get(category.id) || [])
      .filter((subcategory) => Number(subcategory.visibleProductCount || 0) > 0)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    if (categorySubcategories.length) {
      const firstSubcategory = categorySubcategories[0];
      sections.push({
        id: `cat_${category.id}`,
        data: {
          type: "category",
          categoryId: category.id,
          subcategoryId: firstSubcategory.id,
          subcategories: categorySubcategories.map(subcategorySummary),
          products: (productsBySubcategory.get(firstSubcategory.id) || [])
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .slice(0, 24)
            .map(productSummary),
          previewImage,
          hasMore: false,
          nextCursor: null,
          pageSize: 24,
          updatedAt: FieldValue.serverTimestamp(),
        },
      });

      for (const subcategory of categorySubcategories) {
        sections.push({
          id: `subcat_${subcategory.id}`,
          data: {
            type: "subcategory",
            categoryId: category.id,
            subcategoryId: subcategory.id,
            products: (productsBySubcategory.get(subcategory.id) || [])
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .slice(0, 24)
              .map(productSummary),
            hasMore: false,
            nextCursor: null,
            pageSize: 24,
            updatedAt: FieldValue.serverTimestamp(),
          },
        });
      }
      continue;
    }

    sections.push({
      id: `cat_${category.id}`,
      data: {
        type: "category",
        categoryId: category.id,
        subcategoryId: "",
        subcategories: [],
        products: categoryProducts.slice(0, 24).map(productSummary),
        previewImage,
        hasMore: false,
        nextCursor: null,
        pageSize: 24,
        updatedAt: FieldValue.serverTimestamp(),
      },
    });
  }

  return sections;
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

async function upsertAuthUser(auth, business) {
  try {
    await auth.getUser(business.uid);
    await auth.updateUser(business.uid, {
      email: business.email,
      displayName: business.businessName,
      photoURL: logoUrl(business.businessName, business.color),
      password: DEMO_PASSWORD,
      disabled: false,
      emailVerified: true,
    });
  } catch (error) {
    if (error.code !== "auth/user-not-found") throw error;
    await auth.createUser({
      uid: business.uid,
      email: business.email,
      displayName: business.businessName,
      photoURL: logoUrl(business.businessName, business.color),
      password: DEMO_PASSWORD,
      disabled: false,
      emailVerified: true,
    });
  }
}

async function seedBusiness(db, auth, business) {
  await upsertAuthUser(auth, business);

  const userRef = db.collection("users").doc(business.uid);
  const { categories, subcategories, products } = flattenCommerce(business);
  const links = profileLinks({
    whatsapp: business.whatsapp,
    maps: mapsUrl(business.lat, business.lng),
    instagram: `https://instagram.com/${business.username}`,
    facebook: `https://facebook.com/${business.username}`,
    tiktok: `https://tiktok.com/@${business.username}`,
  });

  await Promise.all([
    deleteCollection(userRef.collection("commerceCategories")),
    deleteCollection(userRef.collection("commerceSubcategories")),
    deleteCollection(userRef.collection("commerceProducts")),
    deleteCollection(userRef.collection("commercePublicSections")),
  ]);

  await userRef.set({
    uid: business.uid,
    email: business.email,
    username: business.username,
    usernameLower: business.username,
    publicLinkId: business.publicLinkId,
    role: "user",
    status: "trial",
    plan: "commercial",
    trialEndsAt: null,
    accountState: "active",
    subscriptionStatus: "trialing",
    onboardingCompleted: true,
    businessName: business.businessName,
    businessCategory: business.businessCategory,
    businessType: business.businessType,
    businessHeadline: business.headline,
    businessSubheadline: business.subheadline,
    city: "Ocaña",
    phone: business.whatsapp,
    photo: logoUrl(business.businessName, business.color),
    photoThumb: logoUrl(business.businessName, business.color),
    photoPath: "",
    photoThumbPath: "",
    profileLinks: links,
    links: legacyLinks(links),
    paymentMethods: paymentMethods(),
    paymentQrUrl: "",
    paymentQrPath: "",
    contactCardEnabled: true,
    contactCardName: business.businessName,
    contactCardTitle: business.businessType,
    contactCardWhatsappLinkId: "whatsapp-main",
    contactCardPhone: business.whatsapp,
    billingProfile: {
      businessName: business.businessName,
      billingEmail: business.email,
      billingPhone: business.whatsapp,
      address: business.address,
      city: "Ocaña",
      department: "Norte de Santander",
      country: "Colombia",
    },
    businessHours: businessHours(),
    dorikaProfile: {
      enabled: true,
      showLocation: true,
      locationPrivacy: "exact",
      city: "Ocaña",
      zone: business.zone,
      address: business.address,
      placeName: business.placeName,
      floor: business.floor || "",
      unit: business.unit || "",
      reference: business.reference,
      arrivalInstructions: business.reference,
      latitude: business.lat,
      longitude: business.lng,
      locationAccuracyMeters: 12,
      mapLocationUpdatedAt: new Date().toISOString(),
      coverImageUrl: business.cover,
      coverImagePath: "",
      description: business.dorikaDescription,
      category: business.businessCategory,
      businessType: business.businessType,
      featuredProductIds: products.filter((product) => product.featuredInDorika).map((product) => product.id),
    },
    commerceMode: business.mode,
    commerce: {
      activeMode: business.mode,
      orderWhatsapp: business.whatsapp,
      currency: "COP",
      categoriesCount: categories.length,
      subcategoriesCount: subcategories.length,
      productsCount: products.length,
      visibleProductsCount: products.filter((product) => product.visible).length,
      hasContent: true,
      updatedAt: FieldValue.serverTimestamp(),
    },
    settings: {
      theme: "light",
      primaryColor: "#5B21B6",
      secondaryColor: "#22A98A",
      accentColor: "#E07A5F",
      buttonStyle: "solid",
      cardStyle: "solid",
      buttonRadius: "rounded",
      imageShape: "rounded",
      nameSize: "m",
      fontFamily: "Inter",
    },
    customThemes: [],
    bookingConfig: {
      enabled: false,
    },
    updatedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  await Promise.all([
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
  ]);

  const batch = db.batch();
  for (const category of categories) {
    batch.set(userRef.collection("commerceCategories").doc(category.id), category, { merge: true });
  }
  for (const subcategory of subcategories) {
    batch.set(userRef.collection("commerceSubcategories").doc(subcategory.id), subcategory, { merge: true });
  }
  for (const product of products) {
    batch.set(userRef.collection("commerceProducts").doc(product.id), product, { merge: true });
  }
  for (const section of publicSections(categories, subcategories, products)) {
    batch.set(userRef.collection("commercePublicSections").doc(section.id), section.data, { merge: true });
  }
  await batch.commit();

  return {
    name: business.businessName,
    email: business.email,
    username: business.username,
    mode: business.mode,
    categories: categories.length,
    subcategories: subcategories.length,
    products: products.length,
  };
}

async function main() {
  initFirebaseAdmin();
  const db = getFirestore();
  const auth = getAuth();
  const results = [];

  for (const business of DEMO_BUSINESSES) {
    results.push(await seedBusiness(db, auth, business));
  }

  console.table(results);
  console.log(`Contraseña demo: ${DEMO_PASSWORD}`);
  console.log("Listo: 5 negocios de prueba creados/actualizados.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
