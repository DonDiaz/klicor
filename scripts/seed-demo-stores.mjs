import { existsSync, readFileSync } from "node:fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const DEMO_PASSWORD = "KlicorDemo2026!";
const ORDER_STEP = 1024;
const PAGE_SIZE = 24;

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

function slugify(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function key(value = "") {
  return slugify(value).replace(/-/g, "_");
}

function seededPhoto(keyword, lock, size = 900) {
  const query = encodeURIComponent(String(keyword || "product").trim().replace(/\s+/g, ","));
  return `https://loremflickr.com/${size}/${size}/${query}?lock=${lock}`;
}

function logoUrl(name, color = "5B21B6") {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=ffffff&bold=true&size=512&format=png`;
}

function mapsUrl(lat, lng) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

function image(url, index = 1) {
  return {
    id: `image-${index}`,
    imageUrl: url,
    imageThumbUrl: url,
    imagePath: "",
    imageThumbPath: "",
    imageWidth: 900,
    imageHeight: 900,
  };
}

function profileLinks({ whatsapp, maps, instagram, facebook, tiktok, website }) {
  const whatsappMessage = "Hola, vi tu Klicor y quiero mas informacion.";
  return [
    {
      id: "whatsapp-main",
      type: "whatsapp",
      label: "WhatsApp",
      value: whatsapp,
      message: whatsappMessage,
      priorityTier: 1,
      url: `https://wa.me/57${whatsapp}?text=${encodeURIComponent(whatsappMessage)}`,
    },
    maps && {
      id: "maps-main",
      type: "maps",
      label: "Como llegar",
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
}

function legacyLinks(links = []) {
  return Object.fromEntries(links.map((item) => [item.type, item.value]));
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
        : [{ start: "08:00", end: "12:00" }, { start: "14:00", end: "19:00" }],
    })).concat([{ day: "sunday", isOpen: false, mode: "continuous", shifts: [{ start: "09:00", end: "13:00" }] }]),
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

function item(name, price, keyword, description = "") {
  return { name, price, keyword, description };
}

function category(name, products) {
  return { id: `cat-${slugify(name)}`, name, products };
}

const restaurant = [
  category("Platos fuertes", [
    item("Bandeja tipica", 28000, "colombian food", "Arroz, carne, tajada y ensalada de la casa."),
    item("Pechuga a la plancha", 26000, "grilled chicken", "Pechuga jugosa con acompanante a eleccion."),
    item("Carne asada", 32000, "grilled steak", "Corte asado con papa, yuca y ensalada."),
    item("Lomo en salsa", 36000, "steak sauce", "Lomo suave con salsa de champinones."),
    item("Chuleta valluna", 30000, "fried pork cutlet", "Chuleta crocante con arroz y ensalada."),
    item("Mojarra frita", 34000, "fried fish", "Mojarra dorada con patacon y ensalada."),
    item("Pollo apanado", 25000, "fried chicken", "Filete apanado con papas."),
    item("Costillas BBQ", 38000, "bbq ribs", "Costillas banadas en salsa BBQ."),
    item("Arroz con pollo", 22000, "chicken rice", "Porcion generosa con verduras."),
    item("Sobrebarriga criolla", 33000, "beef stew", "Sobrebarriga en salsa con papa."),
  ]),
  category("Comidas rapidas", [
    item("Hamburguesa clasica", 18000, "hamburger", "Carne, queso, vegetales y salsas."),
    item("Hamburguesa doble", 26000, "double burger", "Doble carne con queso cheddar."),
    item("Perro caliente", 12000, "hot dog", "Salchicha, papas y salsas."),
    item("Salchipapa", 16000, "fries sausage", "Papas, salchicha y queso."),
    item("Mazorcada", 22000, "corn cheese food", "Maiz, pollo, carne y queso."),
    item("Arepa rellena", 14000, "arepa", "Arepa con carne desmechada."),
    item("Sandwich de pollo", 17000, "chicken sandwich", "Pan artesanal y pollo."),
    item("Wrap mixto", 19000, "wrap food", "Tortilla con pollo y vegetales."),
    item("Nachos con carne", 21000, "nachos", "Totopos, carne, queso y guacamole."),
    item("Papas especiales", 15000, "loaded fries", "Papas con tocineta y queso."),
  ]),
  category("Entradas", [
    item("Patacones con hogao", 11000, "patacones", "Patacones crocantes con hogao."),
    item("Empanadas x5", 10000, "empanadas", "Empanadas caseras con aji."),
    item("Deditos de queso", 12000, "cheese sticks", "Queso apanado."),
    item("Alitas picantes", 22000, "chicken wings", "Alitas con salsa picante."),
    item("Chorizo con arepa", 13000, "chorizo arepa", "Chorizo asado con arepa."),
    item("Yuca frita", 9000, "fried cassava", "Yuca dorada."),
    item("Aros de cebolla", 12000, "onion rings", "Aros apanados."),
    item("Tostones mixtos", 18000, "plantain appetizer", "Tostones con carne y queso."),
    item("Consome", 8000, "soup", "Caldo de la casa."),
    item("Picada pequena", 28000, "mixed grill", "Carnes y acompanantes para compartir."),
  ]),
  category("Bebidas", [
    item("Limonada natural", 7000, "lemonade", "Preparada al momento."),
    item("Limonada de coco", 10000, "coconut lemonade", "Cremosa y refrescante."),
    item("Jugo de mora", 7000, "berry juice", "En agua o leche."),
    item("Jugo de maracuya", 7000, "passion fruit juice", "Fruta natural."),
    item("Gaseosa personal", 5000, "soda bottle", "Bebida fria."),
    item("Agua botella", 4000, "water bottle", "Agua sin gas."),
    item("Malteada vainilla", 12000, "milkshake", "Malteada cremosa."),
    item("Te frio", 6000, "iced tea", "Te frio personal."),
    item("Cerveza nacional", 7000, "beer bottle", "Cerveza fria."),
    item("Cafe americano", 5000, "coffee", "Cafe caliente."),
  ]),
  category("Postres", [
    item("Brownie con helado", 14000, "brownie ice cream", "Brownie tibio."),
    item("Flan de caramelo", 9000, "flan", "Postre tradicional."),
    item("Tres leches", 11000, "tres leches cake", "Porcion cremosa."),
    item("Cheesecake frutos rojos", 15000, "cheesecake", "Con salsa de frutos rojos."),
    item("Helado artesanal", 8000, "ice cream", "Dos bolas."),
    item("Torta de chocolate", 12000, "chocolate cake", "Porcion humeda."),
    item("Oblea especial", 9000, "wafer dessert", "Con arequipe y queso."),
    item("Arroz con leche", 8000, "rice pudding", "Postre casero."),
    item("Waffle con frutas", 16000, "waffle fruit", "Waffle, frutas y miel."),
    item("Mousse de maracuya", 10000, "passion fruit dessert", "Suave y frio."),
  ]),
];

const pharmacy = [
  category("Medicamentos", [
    item("Acetaminofen 500 mg", 4500, "medicine pills", "Caja por 10 tabletas."),
    item("Ibuprofeno 400 mg", 7200, "medicine tablets", "Caja por 10 tabletas."),
    item("Loratadina 10 mg", 9800, "allergy pills", "Antialergico."),
    item("Omeprazol 20 mg", 11500, "capsules medicine", "Caja por 14 capsulas."),
    item("Suero oral", 6200, "oral rehydration", "Sobre para hidratacion."),
    item("Antigripal noche", 13500, "cold medicine", "Formula para resfriado."),
    item("Jarabe para tos", 18000, "cough syrup", "Frasco familiar."),
    item("Vitamina C", 16000, "vitamin c", "Tabletas masticables."),
    item("Diclofenaco gel", 14500, "pain relief gel", "Gel topico."),
    item("Sales de rehidratacion", 5200, "electrolyte powder", "Sobre individual."),
  ]),
  category("Primeros auxilios", [
    item("Curitas x20", 6500, "bandage", "Adhesivos surtidos."),
    item("Gasa esteril", 4800, "gauze", "Paquete esteril."),
    item("Micropore", 7200, "medical tape", "Cinta hipoalergenica."),
    item("Alcohol antiseptico", 9800, "antiseptic alcohol", "Frasco 700 ml."),
    item("Agua oxigenada", 6200, "hydrogen peroxide", "Frasco 120 ml."),
    item("Venda elastica", 11000, "elastic bandage", "Venda mediana."),
    item("Termometro digital", 26000, "digital thermometer", "Lectura rapida."),
    item("Guantes latex", 12500, "medical gloves", "Caja pequena."),
    item("Tapabocas x10", 9000, "face mask", "Paquete por 10."),
    item("Botiquin basico", 42000, "first aid kit", "Kit para hogar."),
  ]),
  category("Cuidado personal", [
    item("Bloqueador solar SPF50", 42000, "sunscreen", "Proteccion diaria."),
    item("Crema hidratante", 28000, "moisturizer", "Piel normal a seca."),
    item("Protector labial", 9000, "lip balm", "Con vitamina E."),
    item("Shampoo anticaspa", 24500, "shampoo", "Uso frecuente."),
    item("Crema dental", 8500, "toothpaste", "Proteccion completa."),
    item("Cepillo dental", 7200, "toothbrush", "Cerdas suaves."),
    item("Enjuague bucal", 19000, "mouthwash", "Frescura prolongada."),
    item("Desodorante roll-on", 13500, "deodorant", "Proteccion 48 horas."),
    item("Jabon antibacterial", 7800, "soap", "Barra antibacterial."),
    item("Panitos humedos", 11200, "wet wipes", "Paquete familiar."),
  ]),
  category("Bebe", [
    item("Panales etapa 3", 38500, "diapers", "Paquete mediano."),
    item("Crema antipanalitis", 18500, "baby cream", "Proteccion suave."),
    item("Toallitas bebe", 14500, "baby wipes", "Paquete grande."),
    item("Aceite bebe", 16000, "baby oil", "Frasco 100 ml."),
    item("Shampoo bebe", 19500, "baby shampoo", "Formula suave."),
    item("Tetero 8 oz", 22000, "baby bottle", "Libre de BPA."),
    item("Chupo ortodontico", 14500, "pacifier", "Silicona suave."),
    item("Talco bebe", 12500, "baby powder", "Aroma suave."),
    item("Cereal infantil", 21000, "baby cereal", "Multicereal."),
    item("Compota fruta", 6800, "baby food", "Fruta natural."),
  ]),
  category("Bienestar", [
    item("Multivitaminico", 39000, "multivitamin", "Frasco por 30."),
    item("Colageno polvo", 52000, "collagen powder", "Suplemento diario."),
    item("Omega 3", 48000, "omega 3", "Capsulas blandas."),
    item("Magnesio", 35000, "magnesium supplement", "Tabletas."),
    item("Proteina sachet", 12000, "protein supplement", "Porcion individual."),
    item("Gel antibacterial", 9800, "hand sanitizer", "Frasco 250 ml."),
    item("Repelente", 21000, "insect repellent", "Proteccion familiar."),
    item("Gotas lubricantes", 24000, "eye drops", "Ojos secos."),
    item("Pastillero semanal", 13000, "pill organizer", "Organizador diario."),
    item("Tensiometro digital", 115000, "blood pressure monitor", "Monitor digital."),
  ]),
];

const stationery = [
  category("Escolar", [
    item("Cuaderno rayado", 6500, "notebook", "100 hojas."),
    item("Cuaderno cuadriculado", 6500, "notebook grid", "100 hojas."),
    item("Lapiz grafito x12", 9800, "pencils", "Caja escolar."),
    item("Borrador nata", 1800, "eraser", "Borrador suave."),
    item("Sacapuntas metalico", 2500, "pencil sharpener", "Doble entrada."),
    item("Colores x24", 22000, "colored pencils", "Caja de colores."),
    item("Marcadores x12", 18500, "markers", "Punta fina."),
    item("Cartuchera", 16000, "pencil case", "Tela resistente."),
    item("Regla 30 cm", 3000, "ruler", "Regla plastica."),
    item("Compas escolar", 9500, "compass stationery", "Con lapiz."),
  ]),
  category("Oficina", [
    item("Resma carta", 22500, "paper ream", "Papel blanco."),
    item("Carpeta legajadora", 2500, "file folder", "Carton resistente."),
    item("Archivador A-Z", 14500, "binder folder", "Tamano oficio."),
    item("Grapadora", 18000, "stapler", "Metalica."),
    item("Grapas", 3500, "staples", "Caja pequena."),
    item("Clips x100", 4200, "paper clips", "Clips metalicos."),
    item("Notas adhesivas", 6500, "sticky notes", "Pack colores."),
    item("Cinta transparente", 4500, "tape roll", "Rollo pequeno."),
    item("Tijeras oficina", 8500, "scissors", "Acero inoxidable."),
    item("Corrector liquido", 5200, "correction fluid", "Punta fina."),
  ]),
  category("Arte", [
    item("Acuarelas x12", 18000, "watercolor paint", "Caja escolar."),
    item("Pinceles x6", 14500, "paint brushes", "Set surtido."),
    item("Cartulina blanca", 1800, "cardstock", "Pliego."),
    item("Foamy escarchado", 3200, "craft foam", "Hoja color."),
    item("Silicona liquida", 6500, "craft glue", "Frasco."),
    item("Papel iris", 9000, "color paper", "Paquete."),
    item("Vinilos x6", 16500, "acrylic paint", "Colores basicos."),
    item("Lienzo pequeno", 22000, "canvas painting", "Bastidor pequeno."),
    item("Plastilina", 7200, "modeling clay", "Barra colores."),
    item("Escarcha", 4500, "glitter", "Frasco pequeno."),
  ]),
  category("Tecnologia oficina", [
    item("Memoria USB 32GB", 28000, "usb flash drive", "USB 3.0."),
    item("Mouse inalambrico", 35000, "wireless mouse", "Conexion USB."),
    item("Teclado basico", 42000, "keyboard", "Teclado compacto."),
    item("Cable HDMI", 18000, "hdmi cable", "1.5 metros."),
    item("Cable USB-C", 16000, "usb c cable", "Carga rapida."),
    item("Calculadora", 26000, "calculator", "Basica."),
    item("Tinta impresora negra", 45000, "printer ink", "Compatible."),
    item("Tinta impresora color", 52000, "printer ink color", "Compatible."),
    item("Audifonos cable", 22000, "earphones", "Con microfono."),
    item("Base laptop", 48000, "laptop stand", "Ergonomica."),
  ]),
  category("Regalos", [
    item("Bolsa regalo pequena", 2500, "gift bag", "Diseno surtido."),
    item("Bolsa regalo grande", 4500, "gift bag", "Diseno surtido."),
    item("Papel regalo", 2800, "wrapping paper", "Pliego decorativo."),
    item("Tarjeta felicitacion", 3500, "greeting card", "Mensaje especial."),
    item("Cinta decorativa", 4000, "ribbon", "Rollo pequeno."),
    item("Globo metalizado", 9500, "foil balloon", "Diseno celebracion."),
    item("Caja sorpresa", 12000, "gift box", "Caja decorada."),
    item("Sticker decorativo", 5000, "stickers", "Plancha."),
    item("Moño regalo", 2500, "gift bow", "Adhesivo."),
    item("Peluche pequeno", 28000, "plush toy", "Detalle pequeno."),
  ]),
];

const supermarket = [
  category("Frutas y verduras", [
    item("Banano libra", 2800, "bananas", "Fruta fresca."),
    item("Manzana roja unidad", 2200, "red apple", "Unidad seleccionada."),
    item("Tomate libra", 3600, "tomatoes", "Tomate fresco."),
    item("Cebolla cabezona libra", 3000, "onions", "Seleccionada."),
    item("Papa libra", 2500, "potatoes", "Papa limpia."),
    item("Zanahoria libra", 2800, "carrots", "Fresca."),
    item("Aguacate unidad", 5500, "avocado", "Unidad mediana."),
    item("Lechuga unidad", 4200, "lettuce", "Lechuga fresca."),
    item("Limon libra", 3500, "limes", "Limon jugoso."),
    item("Mango unidad", 3000, "mango", "Fruta madura."),
  ]),
  category("Lacteos", [
    item("Leche entera 1L", 5200, "milk carton", "Bolsa o caja."),
    item("Yogurt familiar", 9800, "yogurt", "Botella familiar."),
    item("Queso campesino", 14500, "fresh cheese", "Porcion."),
    item("Mantequilla", 7800, "butter", "Barra pequena."),
    item("Kumis", 6500, "yogurt drink", "Botella."),
    item("Crema de leche", 5200, "cream carton", "Caja pequena."),
    item("Queso tajado", 12500, "sliced cheese", "Paquete."),
    item("Arequipe", 9000, "dulce de leche", "Tarro."),
    item("Leche deslactosada", 5800, "milk carton", "1 litro."),
    item("Bebida avena", 6200, "oat drink", "Botella."),
  ]),
  category("Despensa", [
    item("Arroz 1 kg", 5800, "rice", "Bolsa."),
    item("Azucar 1 kg", 4900, "sugar", "Bolsa."),
    item("Aceite 1 L", 10800, "cooking oil", "Botella."),
    item("Pasta spaghetti", 4200, "spaghetti", "Paquete."),
    item("Lenteja 500 g", 4600, "lentils", "Bolsa."),
    item("Frijol 500 g", 6800, "beans", "Bolsa."),
    item("Harina de maiz", 5200, "corn flour", "Bolsa."),
    item("Atun lata", 7800, "tuna can", "Lata."),
    item("Cafe molido", 14500, "coffee bag", "Paquete."),
    item("Chocolate mesa", 9800, "hot chocolate", "Caja."),
  ]),
  category("Aseo hogar", [
    item("Detergente polvo", 13500, "laundry detergent", "Bolsa."),
    item("Suavizante", 11200, "fabric softener", "Botella."),
    item("Cloro", 6500, "bleach bottle", "Botella."),
    item("Lavaloza", 7200, "dish soap", "Crema."),
    item("Esponja x3", 4800, "kitchen sponge", "Paquete."),
    item("Trapero", 12500, "mop", "Unidad."),
    item("Escoba", 15000, "broom", "Unidad."),
    item("Papel higienico x4", 13500, "toilet paper", "Paquete."),
    item("Servilletas", 6200, "napkins", "Paquete."),
    item("Ambientador", 11000, "air freshener", "Aerosol."),
  ]),
  category("Snacks y bebidas", [
    item("Papas paquete", 3800, "potato chips", "Snack."),
    item("Galletas dulces", 5200, "cookies", "Paquete."),
    item("Chocolate barra", 4200, "chocolate bar", "Unidad."),
    item("Mani salado", 4800, "peanuts", "Paquete."),
    item("Gaseosa 1.5 L", 7200, "soda bottle", "Botella."),
    item("Agua 600 ml", 2500, "water bottle", "Botella."),
    item("Jugo caja", 3200, "juice box", "Caja."),
    item("Cereal caja", 16500, "cereal box", "Caja."),
    item("Granola", 14500, "granola", "Bolsa."),
    item("Gelatina", 2800, "jelly dessert", "Caja."),
  ]),
];

const hardware = [
  category("Herramientas", [
    item("Martillo", 28000, "hammer", "Mango comodo."),
    item("Destornillador estrella", 9000, "screwdriver", "Punta estrella."),
    item("Destornillador pala", 9000, "screwdriver", "Punta plana."),
    item("Alicate universal", 26000, "pliers", "Acero resistente."),
    item("Llave inglesa", 32000, "wrench", "Ajustable."),
    item("Flexometro 5 m", 18000, "measuring tape", "Cinta metrica."),
    item("Nivel pequeno", 22000, "spirit level", "Nivel de burbuja."),
    item("Serrucho", 38000, "hand saw", "Hoja dentada."),
    item("Taladro basico", 165000, "drill", "Uso domestico."),
    item("Caja herramientas", 58000, "toolbox", "Plastica."),
  ]),
  category("Tornilleria", [
    item("Tornillo drywall x100", 12000, "screws", "Bolsa."),
    item("Chazo plastico x50", 9000, "wall plugs", "Paquete."),
    item("Puntilla 1 pulgada", 6500, "nails", "Libra."),
    item("Puntilla 2 pulgadas", 7200, "nails", "Libra."),
    item("Arandela plana", 4800, "washers", "Paquete."),
    item("Tuerca hexagonal", 5200, "nuts bolts", "Paquete."),
    item("Tornillo madera", 9500, "wood screws", "Bolsa."),
    item("Gancho pared", 6000, "wall hooks", "Paquete."),
    item("Abrazadera metalica", 4200, "metal clamp", "Unidad."),
    item("Remache pop", 8500, "rivets", "Bolsa."),
  ]),
  category("Pintura", [
    item("Pintura blanca galon", 65000, "paint bucket", "Interior."),
    item("Pintura vinilo color", 72000, "paint cans", "Color a eleccion."),
    item("Brocha 2 pulgadas", 8500, "paint brush", "Unidad."),
    item("Rodillo pequeno", 12000, "paint roller", "Unidad."),
    item("Bandeja pintura", 10000, "paint tray", "Plastica."),
    item("Cinta enmascarar", 6500, "masking tape", "Rollo."),
    item("Lija pared", 1800, "sandpaper", "Hoja."),
    item("Estuco kilo", 9500, "wall putty", "Bolsa."),
    item("Thinner botella", 12500, "paint thinner", "Botella."),
    item("Sellador", 28000, "paint primer", "Cuarto."),
  ]),
  category("Electricidad", [
    item("Bombillo LED", 8500, "led bulb", "Luz blanca."),
    item("Toma corriente", 9500, "electric outlet", "Doble."),
    item("Interruptor sencillo", 7800, "light switch", "Unidad."),
    item("Cable electrico metro", 3500, "electric cable", "Metro."),
    item("Cinta aislante", 4200, "electrical tape", "Rollo."),
    item("Extension 3 metros", 28000, "extension cord", "Multitoma."),
    item("Multitoma", 32000, "power strip", "4 salidas."),
    item("Breaker 20A", 24000, "circuit breaker", "Unidad."),
    item("Plafon", 12500, "ceiling lamp holder", "Unidad."),
    item("Linterna", 22000, "flashlight", "LED."),
  ]),
  category("Plomeria", [
    item("Llave lavamanos", 42000, "faucet", "Cromada."),
    item("Sifon lavaplatos", 18000, "sink drain", "Unidad."),
    item("Tubo PVC metro", 12500, "pvc pipe", "Metro."),
    item("Codo PVC", 3200, "pvc elbow", "Unidad."),
    item("Pegante PVC", 11000, "pvc glue", "Frasco."),
    item("Teflon", 3500, "teflon tape", "Rollo."),
    item("Manguera flexible", 16500, "flexible hose", "Unidad."),
    item("Ducha sencilla", 22000, "shower head", "Unidad."),
    item("Valvula sanitaria", 18000, "toilet valve", "Unidad."),
    item("Destapador", 15000, "plunger", "Unidad."),
  ]),
];

const beauty = [
  category("Cuidado facial", [
    item("Limpiador facial", 32000, "face cleanser", "Uso diario."),
    item("Tonico facial", 28000, "face toner", "Piel mixta."),
    item("Serum vitamina C", 52000, "vitamin c serum", "Luminosidad."),
    item("Crema hidratante rostro", 42000, "face cream", "Hidratacion ligera."),
    item("Protector solar facial", 48000, "facial sunscreen", "SPF50."),
    item("Agua micelar", 30000, "micellar water", "Desmaquillante."),
    item("Mascarilla arcilla", 26000, "face mask skincare", "Limpieza profunda."),
    item("Contorno ojos", 36000, "eye cream", "Hidratante."),
    item("Exfoliante facial", 29000, "face scrub", "Suave."),
    item("Gel aloe vera", 24000, "aloe vera gel", "Calmante."),
  ]),
  category("Maquillaje", [
    item("Base liquida", 45000, "makeup foundation", "Cobertura media."),
    item("Corrector", 28000, "makeup concealer", "Tono natural."),
    item("Polvo compacto", 32000, "makeup powder", "Acabado mate."),
    item("Rubor", 26000, "blush makeup", "Tono suave."),
    item("Iluminador", 30000, "highlighter makeup", "Brillo sutil."),
    item("Pestaneina", 24000, "mascara makeup", "Volumen."),
    item("Delineador", 18000, "eyeliner", "Negro."),
    item("Labial mate", 22000, "lipstick", "Larga duracion."),
    item("Brillo labial", 16000, "lip gloss", "Tono natural."),
    item("Paleta sombras", 58000, "eyeshadow palette", "Tonos combinables."),
  ]),
  category("Cabello", [
    item("Shampoo nutritivo", 26000, "shampoo bottle", "Cabello seco."),
    item("Acondicionador", 26000, "conditioner bottle", "Suavidad."),
    item("Mascarilla capilar", 38000, "hair mask", "Reparacion."),
    item("Aceite argan", 32000, "hair oil", "Brillo."),
    item("Crema peinar", 24000, "hair cream", "Control frizz."),
    item("Tinte cabello", 28000, "hair dye", "Color permanente."),
    item("Tratamiento keratina", 52000, "keratin treatment", "Alisado suave."),
    item("Cepillo desenredante", 18000, "hair brush", "Cerdas flexibles."),
    item("Plancha mini", 95000, "hair straightener", "Compacta."),
    item("Secador", 125000, "hair dryer", "Potencia media."),
  ]),
  category("Unas", [
    item("Esmalte rojo", 9000, "nail polish red", "Color intenso."),
    item("Esmalte nude", 9000, "nail polish nude", "Tono natural."),
    item("Base fortalecedora", 12000, "nail base coat", "Proteccion."),
    item("Top coat", 12000, "nail top coat", "Brillo."),
    item("Removedor esmalte", 8500, "nail polish remover", "Sin acetona."),
    item("Lima unas", 3500, "nail file", "Unidad."),
    item("Cortaunas", 6500, "nail clipper", "Metalico."),
    item("Kit manicure", 32000, "manicure kit", "Basico."),
    item("Aceite cuticula", 15000, "cuticle oil", "Hidratante."),
    item("Lampara UV", 85000, "uv nail lamp", "Para semipermanente."),
  ]),
  category("Perfumeria", [
    item("Splash floral", 28000, "body splash", "Aroma fresco."),
    item("Perfume dulce", 65000, "perfume bottle", "Aroma femenino."),
    item("Perfume amaderado", 72000, "perfume bottle", "Aroma intenso."),
    item("Crema corporal", 24000, "body lotion", "Hidratacion."),
    item("Jabon exfoliante", 16000, "body scrub", "Uso corporal."),
    item("Desodorante mujer", 15000, "deodorant", "Proteccion diaria."),
    item("Desodorante hombre", 15000, "deodorant men", "Proteccion diaria."),
    item("Talco corporal", 12000, "body powder", "Aroma suave."),
    item("Kit regalo belleza", 58000, "beauty gift set", "Set especial."),
    item("Vela aromatica", 22000, "scented candle", "Ambiente relajante."),
  ]),
];

const technology = [
  category("Celulares", [
    item("Celular gama media", 899000, "smartphone", "128 GB."),
    item("Celular premium", 2499000, "smartphone premium", "Camara avanzada."),
    item("Celular basico", 389000, "smartphone", "Uso diario."),
    item("Cargador tipo C", 45000, "phone charger", "Carga rapida."),
    item("Cable tipo C", 22000, "usb c cable", "1 metro."),
    item("Vidrio templado", 18000, "phone screen protector", "Protector."),
    item("Forro transparente", 20000, "phone case", "Silicona."),
    item("Power bank", 85000, "power bank", "10000 mAh."),
    item("Soporte celular", 32000, "phone stand", "Escritorio."),
    item("Adaptador carga", 38000, "charger adapter", "USB-C."),
  ]),
  category("Audio", [
    item("Audifonos inalambricos", 125000, "wireless earbuds", "Bluetooth."),
    item("Audifonos diadema", 165000, "headphones", "Sonido envolvente."),
    item("Parlante Bluetooth", 110000, "bluetooth speaker", "Portatil."),
    item("Barra de sonido", 480000, "soundbar", "Para TV."),
    item("Microfono USB", 150000, "usb microphone", "Para contenido."),
    item("Cable auxiliar", 12000, "audio cable", "3.5 mm."),
    item("Audifonos cable", 28000, "earphones", "Con microfono."),
    item("Parlante pequeno", 65000, "small speaker", "Compacto."),
    item("Radio portatil", 78000, "portable radio", "FM/AM."),
    item("Tripode microfono", 42000, "microphone stand", "Ajustable."),
  ]),
  category("Computacion", [
    item("Mouse gamer", 85000, "gaming mouse", "RGB."),
    item("Teclado mecanico", 190000, "mechanical keyboard", "Switch azul."),
    item("Mousepad grande", 42000, "mousepad", "Superficie amplia."),
    item("Memoria USB 64GB", 38000, "usb flash drive", "USB 3.0."),
    item("Disco SSD 480GB", 230000, "ssd drive", "SATA."),
    item("Monitor 24 pulgadas", 620000, "computer monitor", "Full HD."),
    item("Webcam HD", 120000, "webcam", "Con microfono."),
    item("Hub USB", 65000, "usb hub", "4 puertos."),
    item("Base refrigerante", 95000, "laptop cooling pad", "Para portatil."),
    item("Maletin laptop", 78000, "laptop bag", "15 pulgadas."),
  ]),
  category("Gaming", [
    item("Control inalambrico", 180000, "game controller", "Bluetooth."),
    item("Silla gamer", 650000, "gaming chair", "Ergonomica."),
    item("Audifonos gamer", 220000, "gaming headset", "Microfono."),
    item("Luces LED RGB", 58000, "rgb lights", "Tira LED."),
    item("Pad control", 35000, "controller grip", "Antideslizante."),
    item("Soporte audifonos", 48000, "headphone stand", "Escritorio."),
    item("Camara streaming", 260000, "streaming camera", "HD."),
    item("Capturadora", 320000, "capture card", "HDMI."),
    item("Kit teclado mouse", 150000, "gaming keyboard mouse", "Combo."),
    item("Mesa gamer", 720000, "gaming desk", "Amplia."),
  ]),
  category("Hogar tech", [
    item("Bombillo inteligente", 55000, "smart bulb", "WiFi."),
    item("Camara seguridad", 180000, "security camera", "WiFi."),
    item("Enchufe inteligente", 62000, "smart plug", "Control app."),
    item("Router WiFi", 210000, "wifi router", "Doble banda."),
    item("Repetidor WiFi", 120000, "wifi extender", "Mayor cobertura."),
    item("Alexa speaker", 250000, "smart speaker", "Asistente."),
    item("Timbre inteligente", 280000, "smart doorbell", "Camara."),
    item("Sensor movimiento", 85000, "motion sensor", "Smart home."),
    item("Control universal", 70000, "universal remote", "Smart."),
    item("Regleta inteligente", 145000, "smart power strip", "WiFi."),
  ]),
];

const petShop = [
  category("Alimentos", [
    item("Concentrado perro adulto", 85000, "dog food bag", "Bulto mediano."),
    item("Concentrado cachorro", 92000, "puppy food", "Bulto mediano."),
    item("Concentrado gato adulto", 78000, "cat food bag", "Bulto mediano."),
    item("Comida humeda perro", 8500, "wet dog food", "Lata."),
    item("Comida humeda gato", 7800, "wet cat food", "Sobre."),
    item("Snack dental perro", 14500, "dog treats", "Paquete."),
    item("Galletas perro", 12000, "dog biscuits", "Paquete."),
    item("Premios gato", 11000, "cat treats", "Paquete."),
    item("Leche para cachorro", 28000, "puppy milk", "Tarro."),
    item("Alimento peces", 9500, "fish food", "Frasco."),
  ]),
  category("Higiene", [
    item("Shampoo perro", 22000, "dog shampoo", "Aroma suave."),
    item("Shampoo gato", 24000, "cat shampoo", "Formula suave."),
    item("Arena gato", 32000, "cat litter", "Bolsa."),
    item("Tapete sanitario", 28000, "pet pads", "Paquete."),
    item("Cepillo pelaje", 18000, "pet brush", "Unidad."),
    item("Cortaunas mascota", 16000, "pet nail clipper", "Unidad."),
    item("Limpiador oidos", 19000, "pet ear cleaner", "Frasco."),
    item("Panitos mascota", 13500, "pet wipes", "Paquete."),
    item("Eliminador olores", 26000, "pet odor spray", "Spray."),
    item("Talco mascota", 15000, "pet powder", "Frasco."),
  ]),
  category("Accesorios", [
    item("Collar perro", 18000, "dog collar", "Ajustable."),
    item("Correa paseo", 22000, "dog leash", "Resistente."),
    item("Arnes perro", 38000, "dog harness", "Comodo."),
    item("Plato comida", 16000, "pet bowl", "Acero."),
    item("Bebedero", 22000, "pet water bowl", "Antideslizante."),
    item("Cama mascota", 75000, "pet bed", "Suave."),
    item("Guacal pequeno", 98000, "pet carrier", "Transporte."),
    item("Ropa mascota", 35000, "dog clothes", "Talla pequena."),
    item("Bozal", 18000, "dog muzzle", "Ajustable."),
    item("Identificador placa", 12000, "pet tag", "Placa grabable."),
  ]),
  category("Juguetes", [
    item("Pelota perro", 12000, "dog ball toy", "Resistente."),
    item("Cuerda mordedor", 16000, "dog rope toy", "Juego activo."),
    item("Hueso juguete", 18000, "dog chew toy", "Mordedor."),
    item("Raton juguete gato", 9000, "cat toy mouse", "Unidad."),
    item("Varita gato", 14000, "cat wand toy", "Con plumas."),
    item("Tunel gato", 42000, "cat tunnel", "Plegable."),
    item("Pelota cascabel", 8000, "cat ball toy", "Sonido."),
    item("Frisbee perro", 22000, "dog frisbee", "Flexible."),
    item("Dispensador premios", 35000, "treat dispenser toy", "Interactivo."),
    item("Rascador gato", 85000, "cat scratching post", "Mediano."),
  ]),
  category("Salud mascota", [
    item("Antipulgas perro", 42000, "dog flea treatment", "Pipeta."),
    item("Antipulgas gato", 39000, "cat flea treatment", "Pipeta."),
    item("Desparasitante", 26000, "pet dewormer", "Segun peso."),
    item("Vitaminas mascota", 32000, "pet vitamins", "Frasco."),
    item("Collar antipulgas", 48000, "flea collar", "Proteccion."),
    item("Spray cicatrizante", 28000, "pet wound spray", "Frasco."),
    item("Suplemento articulaciones", 52000, "pet joint supplement", "Tabletas."),
    item("Jeringa dosificadora", 8000, "oral syringe", "Unidad."),
    item("Solucion ocular", 22000, "pet eye drops", "Frasco."),
    item("Calmante natural", 36000, "pet calming supplement", "Gotas."),
  ]),
];

const fashionCatalog = [
  category("Mujer", [
    item("Vestido floral", 89900, "floral dress", "Tela fresca para el dia."),
    item("Blusa satinada", 64900, "satin blouse", "Corte elegante."),
    item("Jean mom fit", 119900, "women jeans", "Tiro alto."),
    item("Falda midi", 84900, "midi skirt", "Movimiento suave."),
    item("Top basico", 39900, "women top", "Algodon."),
    item("Camisa oversize", 79900, "oversize shirt women", "Fit amplio."),
    item("Pantalon palazzo", 109900, "palazzo pants", "Tela ligera."),
    item("Chaqueta denim", 139900, "denim jacket women", "Lavado claro."),
    item("Blazer nude", 159900, "women blazer", "Formal casual."),
    item("Set deportivo", 129900, "women activewear", "Dos piezas."),
  ]),
  category("Hombre", [
    item("Camisa lino", 89900, "men linen shirt", "Fresca y sobria."),
    item("Jean slim", 119900, "men jeans", "Azul clasico."),
    item("Polo basico", 59900, "men polo shirt", "Algodon."),
    item("Camiseta premium", 49900, "men tshirt", "Cuello redondo."),
    item("Pantalon chino", 129900, "men chinos", "Casual elegante."),
    item("Chaqueta bomber", 169900, "men bomber jacket", "Ligera."),
    item("Bermuda casual", 74900, "men shorts", "Tela fresca."),
    item("Buzo cuello redondo", 99900, "men sweatshirt", "Suave."),
    item("Camisa cuadros", 79900, "men plaid shirt", "Uso diario."),
    item("Blazer azul", 189900, "men blazer", "Corte moderno."),
  ]),
  category("Zapatos", [
    item("Tenis blancos", 159900, "white sneakers", "Unisex."),
    item("Botin cuero", 219900, "leather boots", "Color cafe."),
    item("Sandalia plana", 79900, "flat sandals", "Comoda."),
    item("Tacones nude", 139900, "nude heels", "Altura media."),
    item("Mocasines negros", 169900, "black loafers", "Clasicos."),
    item("Tenis running", 189900, "running shoes", "Livianos."),
    item("Baletas", 89900, "ballet flats", "Uso diario."),
    item("Botas urbanas", 239900, "urban boots", "Suela fuerte."),
    item("Sandalia hombre", 89900, "men sandals", "Casual."),
    item("Zapato formal", 229900, "formal shoes", "Cuero sintetico."),
  ]),
  category("Accesorios", [
    item("Bolso tote", 119900, "tote bag", "Amplio."),
    item("Cinturon cuero", 59900, "leather belt", "Hebilla metalica."),
    item("Gorra basica", 39900, "baseball cap", "Ajustable."),
    item("Bufanda ligera", 49900, "scarf", "Textura suave."),
    item("Gafas sol", 79900, "sunglasses", "Proteccion UV."),
    item("Billetera", 69900, "wallet", "Compacta."),
    item("Morral urbano", 139900, "backpack fashion", "Uso diario."),
    item("Aretes pequenos", 29900, "earrings fashion", "Dorados."),
    item("Pulsera minimal", 24900, "bracelet fashion", "Ajustable."),
    item("Sombrero playa", 59900, "summer hat", "Fibra natural."),
  ]),
  category("Ofertas", [
    item("Combo camiseta x2", 79900, "tshirts", "Dos camisetas basicas."),
    item("Jean promocion", 89900, "jeans sale", "Unidades seleccionadas."),
    item("Vestido outlet", 69900, "dress sale", "Referencia seleccionada."),
    item("Tenis descuento", 129900, "sneakers sale", "Ultimas tallas."),
    item("Bolso promo", 89900, "handbag sale", "Color disponible."),
    item("Chaqueta final", 119900, "jacket sale", "Ultimas unidades."),
    item("Camisa combo", 99900, "shirts sale", "Pack por dos."),
    item("Accesorio sorpresa", 19900, "fashion accessories", "Unidad surtida."),
    item("Sandalias promo", 59900, "sandals sale", "Modelos surtidos."),
    item("Blusa outlet", 49900, "blouse sale", "Oferta especial."),
  ]),
];

const jewelryCatalog = [
  category("Aretes", [
    item("Aretes perla", 45000, "pearl earrings", "Diseno clasico."),
    item("Candongas doradas", 52000, "gold hoop earrings", "Tono dorado."),
    item("Aretes zirconia", 68000, "zircon earrings", "Brillo sutil."),
    item("Topos minimal", 35000, "stud earrings", "Uso diario."),
    item("Aretes largos", 72000, "long earrings", "Para ocasion."),
    item("Aretes florales", 58000, "flower earrings", "Detalle delicado."),
    item("Candonga pequena", 42000, "small hoop earrings", "Liviana."),
    item("Aretes plata", 76000, "silver earrings", "Plata 925."),
    item("Ear cuff", 39000, "ear cuff", "Sin perforacion."),
    item("Set aretes x3", 85000, "earring set", "Tres pares."),
  ]),
  category("Collares", [
    item("Collar inicial", 65000, "initial necklace", "Letra a eleccion."),
    item("Cadena dorada", 78000, "gold necklace", "Tono dorado."),
    item("Collar perla", 89000, "pearl necklace", "Elegante."),
    item("Choker minimal", 52000, "choker necklace", "Delicado."),
    item("Collar corazon", 62000, "heart necklace", "Dije pequeno."),
    item("Cadena plata", 95000, "silver chain", "Plata 925."),
    item("Collar capas", 88000, "layered necklace", "Doble cadena."),
    item("Dije cruz", 49000, "cross pendant", "Metal dorado."),
    item("Collar piedra natural", 105000, "gemstone necklace", "Piedra natural."),
    item("Gargantilla fina", 56000, "fine necklace", "Uso diario."),
  ]),
  category("Pulseras", [
    item("Pulsera tenis", 85000, "tennis bracelet", "Brillo lineal."),
    item("Pulsera cadena", 58000, "chain bracelet", "Ajustable."),
    item("Pulsera perlas", 62000, "pearl bracelet", "Delicada."),
    item("Pulsera cuero", 42000, "leather bracelet", "Unisex."),
    item("Pulsera dijes", 68000, "charm bracelet", "Con dijes."),
    item("Brazalete dorado", 76000, "gold bracelet", "Rigido."),
    item("Pulsera plata", 92000, "silver bracelet", "Plata 925."),
    item("Pulsera tejido", 30000, "woven bracelet", "Artesanal."),
    item("Set pulseras", 79000, "bracelet set", "Tres piezas."),
    item("Pulsera inicial", 55000, "initial bracelet", "Letra personalizada."),
  ]),
  category("Anillos", [
    item("Anillo solitario", 95000, "solitaire ring", "Zirconia central."),
    item("Anillo minimal", 42000, "minimal ring", "Delgado."),
    item("Anillo ajustable", 38000, "adjustable ring", "Talla flexible."),
    item("Anillo sello", 78000, "signet ring", "Diseno moderno."),
    item("Anillo perla", 62000, "pearl ring", "Detalle perla."),
    item("Anillo plata", 89000, "silver ring", "Plata 925."),
    item("Set anillos", 68000, "ring set", "Cinco piezas."),
    item("Anillo corazon", 48000, "heart ring", "Tono dorado."),
    item("Anillo piedra", 99000, "gemstone ring", "Piedra natural."),
    item("Anillo trenzado", 56000, "braided ring", "Textura fina."),
  ]),
  category("Sets", [
    item("Set novia", 180000, "bridal jewelry set", "Collar y aretes."),
    item("Set perlas", 150000, "pearl jewelry set", "Collar, aretes y pulsera."),
    item("Set dorado diario", 120000, "gold jewelry set", "Piezas basicas."),
    item("Set plata", 165000, "silver jewelry set", "Plata 925."),
    item("Set regalo", 99000, "jewelry gift box", "Caja lista para regalar."),
    item("Set minimal", 88000, "minimal jewelry set", "Piezas delicadas."),
    item("Set fiesta", 135000, "party jewelry set", "Brillo especial."),
    item("Set inicial", 110000, "initial jewelry", "Personalizable."),
    item("Set juvenil", 76000, "fashion jewelry set", "Colorido."),
    item("Set elegante", 190000, "elegant jewelry set", "Acabado premium."),
  ]),
];

const DEMO_BUSINESSES = [
  {
    uid: "demo-restaurante-la-casona",
    email: "donjhonnathan+klicor.restaurante@gmail.com",
    username: "restaurante-la-casona-demo",
    publicLinkId: "demo-restaurante-la-casona",
    businessName: "Restaurante La Casona",
    businessCategory: "food_drink",
    businessType: "restaurant",
    headline: "Almuerzos, comidas rapidas y platos de la casa por WhatsApp",
    subheadline: "Haz tu pedido aqui.",
    whatsapp: "3175011001",
    color: "E85D04",
    lat: 8.23792,
    lng: -73.35611,
    zone: "Centro",
    address: "Centro, Ocana",
    placeName: "La Casona",
    reference: "Cerca al parque principal",
    mode: "mimenu",
    categories: restaurant,
  },
  {
    uid: "demo-drogueria-vida",
    email: "donjhonnathan+klicor.drogueria@gmail.com",
    username: "drogueria-vida-demo",
    publicLinkId: "demo-drogueria-vida",
    businessName: "Drogueria Vida",
    businessCategory: "retail_sales",
    businessType: "pharmacy",
    headline: "Medicamentos, cuidado personal y bienestar cerca de ti",
    subheadline: "Pregunta y recibe orientacion por WhatsApp.",
    whatsapp: "3175011002",
    color: "0D9488",
    lat: 8.23842,
    lng: -73.35572,
    zone: "Centro",
    address: "Centro, Ocana",
    placeName: "Drogueria Vida",
    reference: "Esquina de la avenida principal",
    mode: "mitienda",
    categories: pharmacy,
  },
  {
    uid: "demo-papeleria-trazos",
    email: "donjhonnathan+klicor.papeleria@gmail.com",
    username: "papeleria-trazos-demo",
    publicLinkId: "demo-papeleria-trazos",
    businessName: "Papeleria Trazos",
    businessCategory: "retail_sales",
    businessType: "stationery",
    headline: "Utiles, oficina, arte e impresiones para resolver rapido",
    subheadline: "Compra o cotiza por WhatsApp.",
    whatsapp: "3175011003",
    color: "2563EB",
    lat: 8.23682,
    lng: -73.35721,
    zone: "Buenos Aires",
    address: "Barrio Buenos Aires, Ocana",
    placeName: "Papeleria Trazos",
    reference: "Al lado del colegio",
    mode: "mitienda",
    categories: stationery,
  },
  {
    uid: "demo-supermercado-fresco",
    email: "donjhonnathan+klicor.supermercado@gmail.com",
    username: "supermercado-fresco-demo",
    publicLinkId: "demo-supermercado-fresco",
    businessName: "Supermercado Fresco",
    businessCategory: "retail_sales",
    businessType: "supermarket",
    headline: "Mercado completo, frutas, despensa y aseo por WhatsApp",
    subheadline: "Haz tu compra aqui.",
    whatsapp: "3175011004",
    color: "15803D",
    lat: 8.23592,
    lng: -73.35811,
    zone: "La Primavera",
    address: "La Primavera, Ocana",
    placeName: "Supermercado Fresco",
    reference: "Entrada del barrio",
    mode: "mitienda",
    categories: supermarket,
  },
  {
    uid: "demo-ferreteria-el-tornillo",
    email: "donjhonnathan+klicor.ferreteria@gmail.com",
    username: "ferreteria-el-tornillo-demo",
    publicLinkId: "demo-ferreteria-el-tornillo",
    businessName: "Ferreteria El Tornillo",
    businessCategory: "retail_sales",
    businessType: "hardware",
    headline: "Herramientas, pintura, electricidad y plomeria en un solo lugar",
    subheadline: "Cotiza y aparta por WhatsApp.",
    whatsapp: "3175011005",
    color: "B45309",
    lat: 8.24013,
    lng: -73.35654,
    zone: "Mercado",
    address: "Zona de mercado, Ocana",
    placeName: "Ferreteria El Tornillo",
    reference: "Frente al parqueadero",
    mode: "mitienda",
    categories: hardware,
  },
  {
    uid: "demo-belleza-luna",
    email: "donjhonnathan+klicor.belleza@gmail.com",
    username: "belleza-luna-demo",
    publicLinkId: "demo-belleza-luna",
    businessName: "Belleza Luna",
    businessCategory: "retail_sales",
    businessType: "beauty_products",
    headline: "Skincare, maquillaje, cabello y cuidado personal",
    subheadline: "Pregunta por disponibilidad.",
    whatsapp: "3175011006",
    color: "DB2777",
    lat: 8.23701,
    lng: -73.35421,
    zone: "Centro comercial",
    address: "Centro comercial, Ocana",
    placeName: "Belleza Luna",
    reference: "Local 12",
    mode: "mitienda",
    categories: beauty,
  },
  {
    uid: "demo-tech-norte",
    email: "donjhonnathan+klicor.tecnologia@gmail.com",
    username: "tech-norte-demo",
    publicLinkId: "demo-tech-norte",
    businessName: "Tech Norte",
    businessCategory: "retail_sales",
    businessType: "technology",
    headline: "Celulares, audio, computacion y tecnologia para el hogar",
    subheadline: "Compra por WhatsApp.",
    whatsapp: "3175011007",
    color: "0F5EC8",
    lat: 8.23922,
    lng: -73.35871,
    zone: "Centro",
    address: "Centro, Ocana",
    placeName: "Tech Norte",
    reference: "Pasaje comercial",
    mode: "mitienda",
    categories: technology,
  },
  {
    uid: "demo-mascotas-amigos",
    email: "donjhonnathan+klicor.mascotas@gmail.com",
    username: "mascotas-amigos-demo",
    publicLinkId: "demo-mascotas-amigos",
    businessName: "Mascotas Amigos",
    businessCategory: "retail_sales",
    businessType: "pet_shop",
    headline: "Alimentos, accesorios, higiene y bienestar para tu mascota",
    subheadline: "Pide por WhatsApp.",
    whatsapp: "3175011008",
    color: "7C3AED",
    lat: 8.23492,
    lng: -73.35691,
    zone: "Santa Clara",
    address: "Santa Clara, Ocana",
    placeName: "Mascotas Amigos",
    reference: "Local naranja",
    mode: "mitienda",
    categories: petShop,
  },
  {
    uid: "demo-moda-aurora",
    email: "donjhonnathan+klicor.moda@gmail.com",
    username: "moda-aurora-demo",
    publicLinkId: "demo-moda-aurora",
    businessName: "Moda Aurora",
    businessCategory: "retail_sales",
    businessType: "clothing_mixed",
    headline: "Ropa, zapatos y accesorios para explorar como catalogo visual",
    subheadline: "Pregunta por la referencia que te guste.",
    whatsapp: "3175011009",
    color: "1F2937",
    lat: 8.23872,
    lng: -73.35781,
    zone: "Centro",
    address: "Centro, Ocana",
    placeName: "Moda Aurora",
    reference: "Segundo piso",
    mode: "micatalogo",
    categories: fashionCatalog,
  },
  {
    uid: "demo-brillo-norte",
    email: "donjhonnathan+klicor.joyeria@gmail.com",
    username: "brillo-norte-demo",
    publicLinkId: "demo-brillo-norte",
    businessName: "Brillo Norte",
    businessCategory: "retail_sales",
    businessType: "jewelry",
    headline: "Joyeria, bisuteria y detalles para regalar",
    subheadline: "Consulta disponibilidad por WhatsApp.",
    whatsapp: "3175011010",
    color: "B76E79",
    lat: 8.23622,
    lng: -73.35481,
    zone: "Centro",
    address: "Centro, Ocana",
    placeName: "Brillo Norte",
    reference: "Local vitrina dorada",
    mode: "micatalogo",
    categories: jewelryCatalog,
  },
];

function buildProduct(raw, business, category, productIndex, globalIndex) {
  const photo = seededPhoto(raw.keyword, 7000 + globalIndex);
  return {
    id: `prod-${slugify(raw.name)}`,
    mode: business.mode,
    categoryId: category.id,
    subcategoryId: "",
    name: raw.name,
    description: raw.description || "",
    price: raw.price,
    visible: true,
    featuredInDorika: productIndex <= 2,
    orderIndex: productIndex * ORDER_STEP,
    imageUrl: photo,
    imageThumbUrl: photo,
    imagePath: "",
    imageThumbPath: "",
    imageWidth: 900,
    imageHeight: 900,
    images: [image(photo, 1)],
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

function flattenCommerce(business) {
  const categories = [];
  const products = [];
  let globalProductIndex = 0;

  business.categories.forEach((rawCategory, categoryIndex) => {
    const categoryProducts = rawCategory.products.map((rawProduct, productIndex) => {
      globalProductIndex += 1;
      return buildProduct(rawProduct, business, rawCategory, productIndex + 1, globalProductIndex);
    });
    products.push(...categoryProducts);
    const preview = categoryProducts[0];
    categories.push({
      id: rawCategory.id,
      name: rawCategory.name,
      slug: slugify(rawCategory.name),
      normalizedKey: key(rawCategory.name),
      iconKey: key(rawCategory.name),
      iconSource: "seed",
      iconMatchedAlias: "",
      imageUrl: preview?.imageUrl || "",
      imageThumbUrl: preview?.imageThumbUrl || "",
      orderIndex: (categoryIndex + 1) * ORDER_STEP,
      hasSubcategories: false,
      subcategoryCount: 0,
      firstSubcategoryId: "",
      productCount: categoryProducts.length,
      visibleProductCount: categoryProducts.filter((product) => product.visible).length,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return { categories, subcategories: [], products };
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

function publicSections(categories, products) {
  return categories.map((category) => {
    const categoryProducts = products
      .filter((product) => product.visible && product.categoryId === category.id)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    const pageProducts = categoryProducts.slice(0, PAGE_SIZE);
    return {
      id: `cat_${category.id}`,
      data: {
        type: "category",
        categoryId: category.id,
        subcategoryId: "",
        subcategories: [],
        products: pageProducts.map(productSummary),
        previewImage: categoryProducts[0]
          ? { imageUrl: categoryProducts[0].imageUrl, imageThumbUrl: categoryProducts[0].imageThumbUrl }
          : null,
        hasMore: categoryProducts.length > PAGE_SIZE,
        nextCursor: categoryProducts.length > PAGE_SIZE ? pageProducts.at(-1)?.orderIndex || null : null,
        pageSize: PAGE_SIZE,
        updatedAt: FieldValue.serverTimestamp(),
      },
    };
  });
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
  const photoURL = logoUrl(business.businessName, business.color);
  try {
    await auth.getUser(business.uid);
    await auth.updateUser(business.uid, {
      email: business.email,
      displayName: business.businessName,
      photoURL,
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
      photoURL,
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
  const businessLogo = logoUrl(business.businessName, business.color);

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
    status: "active",
    accountStatus: "active",
    plan: "commercial",
    trialEndsAt: null,
    expiresAt: null,
    onboardingCompleted: true,
    businessName: business.businessName,
    businessCategory: business.businessCategory,
    businessType: business.businessType,
    businessHeadline: business.headline,
    businessSubheadline: business.subheadline,
    city: "Ocana",
    phone: business.whatsapp,
    photo: businessLogo,
    photoThumb: businessLogo,
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
      legalName: business.businessName,
      documentType: "nit",
      documentNumber: "",
      verificationDigit: "",
      taxResponsibility: "",
      billingEmail: business.email,
      billingPhone: business.whatsapp,
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
      floor: business.floor || "",
      unit: business.unit || "",
      reference: business.reference,
      arrivalInstructions: business.reference,
      latitude: business.lat,
      longitude: business.lng,
      locationAccuracyMeters: 12,
      mapLocationUpdatedAt: new Date().toISOString(),
      coverImageUrl: products[0]?.imageUrl || "",
      coverImagePath: "",
      description: business.headline,
      category: business.businessCategory,
      businessType: business.businessType,
      featuredProductIds: products.filter((product) => product.featuredInDorika).map((product) => product.id).slice(0, 24),
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
      presetId: "klicor",
      advancedEnabled: false,
      primaryColor: `#${business.color}`,
      secondaryColor: "#22A98A",
      tertiaryColor: "#F4EEFF",
      backgroundColor: "#FFFFFF",
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
      socialStyle: "brand-circles",
      fontFamily: "inter",
      nameSize: "m",
      nameWeight: "bold",
      avatarShape: "circle",
    },
    customThemes: [],
    bookingConfig: { enabled: false },
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
  for (const commerceCategory of categories) {
    batch.set(userRef.collection("commerceCategories").doc(commerceCategory.id), commerceCategory, { merge: true });
  }
  for (const subcategory of subcategories) {
    batch.set(userRef.collection("commerceSubcategories").doc(subcategory.id), subcategory, { merge: true });
  }
  for (const product of products) {
    batch.set(userRef.collection("commerceProducts").doc(product.id), product, { merge: true });
  }
  for (const section of publicSections(categories, products)) {
    batch.set(userRef.collection("commercePublicSections").doc(section.id), section.data, { merge: true });
  }
  await batch.commit();

  return {
    name: business.businessName,
    username: business.username,
    mode: business.mode,
    categories: categories.length,
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
  console.log(`Contrasena demo: ${DEMO_PASSWORD}`);
  console.log(`Listo: ${results.length} negocios demo creados/actualizados con 50 productos cada uno.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
