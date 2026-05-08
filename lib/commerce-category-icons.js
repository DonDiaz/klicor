import { TARGET_COMMERCE_CATEGORY_GROUPS, TARGET_COMMERCE_CATEGORY_SEMANTICS } from "./commerce-category-target-catalog.js";

export const COMMERCE_CATEGORY_ICON_FALLBACK = "tag";
export const COMMERCE_CATEGORY_COLOR_FALLBACK = "#6D28D9";

export const COMMERCE_CATEGORY_COLORS = [
  "#F97316",
  "#EF4444",
  "#8B5CF6",
  "#2563EB",
  "#0EA5E9",
  "#14B8A6",
  "#16A34A",
  "#CA8A04",
  "#A16207",
  "#0F172A",
  "#DB2777",
  "#7C3AED",
];

const DEFAULT_ICON_KEYS = ["tag", "tags", "store", "gift", "sparkles", "new", "bestseller"];

const BASE_CATEGORY_SEMANTICS = [
  // Comida y bebidas
  semantic("utensils", "Comida", ["food_drink"], ["plato", "platos", "platos fuertes", "almuerzo", "almuerzos", "cena", "cenas", "especiales", "menu", "menus", "entradas", "entrada", "principales", "comida"]),
  semantic("burger", "Hamburguesas", ["food_drink"], ["hamburguesa", "hamburguesas", "burger", "burgers", "sandwich", "sandwiches", "comida rapida", "rapida", "fast food", "salchipapa", "salchipapas"]),
  semantic("hotdog", "Perros", ["food_drink"], ["perro", "perros", "hot dog", "hot dogs", "choriperro"]),
  semantic("pizza", "Pizza", ["food_drink"], ["pizza", "pizzas", "pizzeria", "porciones"]),
  semantic("chicken", "Pollo", ["food_drink"], ["pollo", "pollos", "alitas", "alas", "nuggets", "broaster", "asado de pollo"]),
  semantic("beef", "Parrilla", ["food_drink"], ["carne", "carnes", "parrilla", "asado", "asados", "bbq", "churrasco", "costilla", "costillas", "steak"]),
  semantic("fish", "Pescados", ["food_drink"], ["pescado", "pescados", "filete", "mojarra"]),
  semantic("shrimp", "Mariscos", ["food_drink"], ["mariscos", "camarones", "camaron", "langostinos", "langostino", "ceviche", "ceviches"]),
  semantic("sushi", "Sushi", ["food_drink"], ["sushi", "rolls", "roll", "makis", "nigiri"]),
  semantic("soup", "Sopas", ["food_drink"], ["sopa", "sopas", "caldo", "caldos", "sancochos", "sancocho"]),
  semantic("salad", "Saludable", ["food_drink"], ["ensalada", "ensaladas", "bowls", "bowl saludable", "saludable"]),
  semantic("vegan", "Vegano", ["food_drink", "health_wellness"], ["vegetariano", "vegetarianos", "vegano", "veganos", "veggie", "plant based"]),
  semantic("cooking-pot", "Comida casera", ["food_drink"], ["casero", "casera", "corrientazo", "corrientazos", "del dia", "ejecutivo", "ejecutivos"]),
  semantic("taco", "Mexicana", ["food_drink"], ["taco", "tacos", "burrito", "burritos", "nachos", "mexicana", "mexicano"]),
  semantic("pasta", "Pasta", ["food_drink"], ["pasta", "pastas", "lasagna", "ravioli", "spaghetti", "espagueti"]),
  semantic("rice", "Arroces", ["food_drink", "retail_sales"], ["arroz", "arroces", "paella", "risotto"]),
  semantic("arepa", "Arepas", ["food_drink"], ["arepa", "arepas", "empanada", "empanadas", "pastelito", "pastelitos"]),
  semantic("coffee", "Cafe", ["food_drink"], ["cafe", "cafes", "cafeteria", "capuccino", "latte", "mocca"]),
  semantic("breakfast", "Desayunos", ["food_drink"], ["desayuno", "desayunos", "brunch", "huevos", "calentado"]),
  semantic("cup-soda", "Bebidas", ["food_drink", "retail_sales"], ["bebida", "bebidas", "gaseosa", "gaseosas", "refresco", "refrescos", "soda", "sodas"]),
  semantic("juice", "Jugos", ["food_drink", "retail_sales"], ["jugo", "jugos", "batido", "batidos", "smoothie", "smoothies"]),
  semantic("snacks", "Snacks", ["food_drink", "retail_sales"], ["snack", "snacks", "papas", "mecato", "pasabocas"]),
  semantic("fries", "Papas", ["food_drink"], ["papas fritas", "fritas", "francesas"]),
  semantic("sausage", "Embutidos", ["food_drink", "retail_sales"], ["salchicha", "salchichas", "chorizo", "chorizos"]),
  semantic("ice-cream", "Helados", ["food_drink"], ["helado", "helados", "malteada", "malteadas"]),
  semantic("cake", "Postres", ["food_drink"], ["postre", "postres", "torta", "tortas", "pastel", "pasteles", "cupcake", "cupcakes", "reposteria"]),
  semantic("cookie", "Galletas", ["food_drink", "retail_sales"], ["galleta", "galletas", "waffle", "waffles", "brownie", "brownies"]),
  semantic("candy", "Dulces", ["food_drink", "retail_sales"], ["dulce", "dulces", "chocolates", "chocolate", "gomitas", "confiteria"]),
  semantic("croissant", "Panaderia", ["food_drink", "retail_sales"], ["pan", "panes", "panaderia", "pasteleria", "croissant", "hojaldre", "hojaldres"]),
  semantic("beer", "Cervezas", ["food_drink", "retail_sales"], ["cerveza", "cervezas", "bar", "gastrobar"]),
  semantic("wine", "Vinos", ["food_drink", "retail_sales"], ["vino", "vinos", "champana", "champagne"]),
  semantic("cocktail", "Cocteles", ["food_drink"], ["coctel", "cocteles", "cocktail", "cocktails", "tragos"]),
  semantic("tea", "Te", ["food_drink", "retail_sales"], ["te", "té", "infusion", "infusiones", "aromatica", "aromaticas"]),
  semantic("water", "Agua", ["food_drink", "retail_sales"], ["agua", "aguas", "hidratacion", "hidratación"]),
  semantic("combo", "Promos", ["food_drink", "retail_sales"], ["combo", "combos", "promocion", "promociones", "oferta", "ofertas", "promo", "promos", "paquete", "paquetes"]),

  // Tiendas y ventas
  semantic("store", "Tienda", ["retail_sales"], ["tienda", "catalogo", "productos", "producto", "coleccion", "general"]),
  semantic("market", "Mercado", ["retail_sales"], ["mercado", "minimercado", "supermercado", "tienda de barrio", "abarrotes", "viveres", "víveres"]),
  semantic("fruit", "Frutas", ["retail_sales", "food_drink"], ["fruta", "frutas", "fruteria", "banano", "manzana", "verduleria"]),
  semantic("vegetable", "Verduras", ["retail_sales", "food_drink"], ["verdura", "verduras", "hortalizas", "legumbres"]),
  semantic("dairy", "Lacteos", ["retail_sales", "food_drink"], ["leche", "lacteo", "lacteos", "queso", "quesos", "yogurt"]),
  semantic("meat", "Carniceria", ["retail_sales", "food_drink"], ["carniceria", "pollo crudo", "res", "cerdo", "embutidos"]),
  semantic("shirt", "Ropa", ["retail_sales"], ["ropa", "camisa", "camisas", "camiseta", "camisetas", "blusa", "blusas", "pantalon", "pantalones", "vestido", "vestidos", "moda"]),
  semantic("dress", "Ropa mujer", ["retail_sales"], ["mujer", "damas", "femenina", "ropa mujer", "vestido mujer", "falda", "faldas"]),
  semantic("menswear", "Ropa hombre", ["retail_sales"], ["hombre", "caballero", "masculina", "ropa hombre", "camisa hombre"]),
  semantic("kidswear", "Ropa ninos", ["retail_sales"], ["ropa nino", "ropa niña", "ropa niños", "infantil", "moda infantil"]),
  semantic("underwear", "Interior", ["retail_sales"], ["ropa interior", "interior", "lenceria", "lencería", "boxer", "pijamas"]),
  semantic("sportswear", "Deportiva", ["retail_sales"], ["ropa deportiva", "deportiva", "leggins", "licras", "sudaderas"]),
  semantic("swimwear", "Playa", ["retail_sales"], ["vestido de bano", "vestido de baño", "traje de bano", "traje de baño", "playa", "bikini"]),
  semantic("uniform", "Uniformes", ["retail_sales", "services"], ["uniforme", "uniformes", "dotacion", "dotación"]),
  semantic("shoe", "Zapatos", ["retail_sales"], ["zapato", "zapatos", "calzado", "tenis", "sneakers"]),
  semantic("heels", "Tacones", ["retail_sales"], ["tacon", "tacones", "stilettos"]),
  semantic("boots", "Botas", ["retail_sales"], ["bota", "botas", "botines"]),
  semantic("sandals", "Sandalias", ["retail_sales"], ["sandalia", "sandalias", "chanclas"]),
  semantic("kids_shoes", "Zapatos ninos", ["retail_sales"], ["zapatos nino", "zapatos nina", "zapatos niños", "zapatos niñas", "calzado infantil"]),
  semantic("baby_shoes", "Zapatos bebe", ["retail_sales"], ["zapatos bebe", "zapatos bebe", "calzado bebe", "primeros pasos"]),
  semantic("sneakers", "Tenis", ["retail_sales"], ["tenis", "sneakers", "zapatillas", "zapatos deportivos"]),
  semantic("running_shoes", "Running", ["retail_sales"], ["running", "correr", "trotar", "tenis running", "zapatos running"]),
  semantic("sport_shoes", "Deportivos", ["retail_sales"], ["deportivo", "deportivos", "tenis deportivos", "calzado deportivo", "gym"]),
  semantic("casual_shoes", "Casuales", ["retail_sales"], ["casual", "casuales", "zapatos casuales", "tenis casuales"]),
  semantic("formal_shoes", "Formales", ["retail_sales"], ["formal", "formales", "zapatos formales", "elegantes", "vestir"]),
  semantic("loafers", "Mocasines", ["retail_sales"], ["mocasin", "mocasines", "loafers"]),
  semantic("flats", "Baletas", ["retail_sales"], ["baleta", "baletas", "bailarinas", "planos"]),
  semantic("platforms", "Plataformas", ["retail_sales"], ["plataforma", "plataformas"]),
  semantic("wedges", "Cuñas", ["retail_sales"], ["cuña", "cuñas", "cuna", "cunas", "wedge", "wedges"]),
  semantic("ankle_boots", "Botines", ["retail_sales"], ["botin", "botines", "ankle boots"]),
  semantic("high_boots", "Botas altas", ["retail_sales"], ["bota alta", "botas altas", "botas largas"]),
  semantic("flip_flops", "Chanclas", ["retail_sales"], ["chancla", "chanclas", "chancletas", "flip flops"]),
  semantic("slippers", "Pantuflas", ["retail_sales"], ["pantufla", "pantuflas", "babuchas", "casa"]),
  semantic("school_shoes", "Escolares", ["retail_sales"], ["escolar", "escolares", "zapatos escolares", "colegio"]),
  semantic("safety_shoes", "Seguridad", ["retail_sales"], ["seguridad", "zapatos seguridad", "botas seguridad", "industrial", "dotacion calzado"]),
  semantic("bag", "Bolsos", ["retail_sales"], ["bolso", "bolsos", "maletin", "maletines", "mochila", "mochilas", "cartera", "carteras"]),
  semantic("wallet", "Billeteras", ["retail_sales"], ["billetera", "billeteras", "monedero", "monederos"]),
  semantic("hat", "Gorras", ["retail_sales"], ["gorra", "gorras", "sombrero", "sombreros"]),
  semantic("accessories", "Accesorios", ["retail_sales"], ["accesorio", "accesorios", "complementos", "bijouteria", "bisuteria"]),
  semantic("jewelry", "Joyeria", ["retail_sales"], ["joya", "joyas", "joyeria", "bisuteria", "accesorios joyeria"]),
  semantic("rings", "Anillos", ["retail_sales"], ["anillo", "anillos", "argolla", "argollas"]),
  semantic("earrings", "Aretes", ["retail_sales"], ["arete", "aretes", "topos", "candonga", "candongas"]),
  semantic("necklaces", "Collares", ["retail_sales"], ["collar", "collares", "cadena", "cadenas", "gargantilla"]),
  semantic("bracelets", "Pulseras", ["retail_sales"], ["pulsera", "pulseras", "brazalete", "brazaletes"]),
  semantic("charms", "Dijes", ["retail_sales"], ["dije", "dijes", "charm", "charms"]),
  semantic("jewelry_set", "Sets", ["retail_sales"], ["set", "sets", "conjunto", "conjuntos", "set joyeria", "sets joyeria"]),
  semantic("watch", "Relojes", ["retail_sales"], ["reloj", "relojes"]),
  semantic("glasses", "Gafas", ["retail_sales", "health_wellness"], ["gafa", "gafas", "lentes", "anteojos", "optica", "opticas"]),
  semantic("cosmetics", "Belleza", ["retail_sales", "health_wellness"], ["belleza", "cosmeticos", "cosmetico", "cuidado personal"]),
  semantic("makeup", "Maquillaje", ["retail_sales", "health_wellness"], ["maquillaje", "maquillajes", "rubor", "base", "corrector"]),
  semantic("brushes", "Brochas", ["retail_sales", "health_wellness"], ["brocha", "brochas", "pinceles", "esponjas maquillaje"]),
  semantic("palette", "Paletas", ["retail_sales", "health_wellness"], ["paleta", "paletas", "sombras", "contorno", "iluminador"]),
  semantic("lipstick", "Labiales", ["retail_sales", "health_wellness"], ["labial", "labiales", "lipstick", "tintas", "brillo"]),
  semantic("mascara", "Pestanas", ["retail_sales", "health_wellness"], ["rimel", "mascara", "pestana", "pestanas", "pestaña", "pestañas"]),
  semantic("perfume", "Perfumes", ["retail_sales", "health_wellness"], ["perfume", "perfumes", "fragancia", "fragancias", "locion", "lociones"]),
  semantic("nails", "Unas", ["retail_sales", "health_wellness"], ["una", "unas", "uña", "uñas", "manicure", "pedicure", "esmalte", "esmaltes"]),
  semantic("pedicure", "Pedicure", ["retail_sales", "health_wellness"], ["pedicure", "pies", "spa pies"]),
  semantic("skincare", "Skincare", ["retail_sales", "health_wellness"], ["skincare", "cuidado facial", "facial", "limpieza facial", "serum", "sueros"]),
  semantic("toner", "Tonicos", ["retail_sales", "health_wellness"], ["tonico", "tónico", "tonicos", "tónicos", "agua micelar"]),
  semantic("mask", "Mascarillas", ["retail_sales", "health_wellness"], ["mascarilla", "mascarillas", "mascara facial", "mascara capilar"]),
  semantic("cream", "Cremas", ["retail_sales", "health_wellness"], ["crema", "cremas", "hidratante", "hidratantes", "protector solar", "bloqueador"]),
  semantic("sunscreen", "Solar", ["retail_sales", "health_wellness"], ["solar", "protector", "bloqueador solar", "spf"]),
  semantic("soap", "Jabones", ["retail_sales", "health_wellness"], ["jabon", "jabón", "jabones", "gel de baño"]),
  semantic("body-care", "Corporal", ["retail_sales", "health_wellness"], ["corporal", "cuidado corporal", "exfoliante", "body splash", "body"]),
  semantic("hair", "Cabello", ["retail_sales", "health_wellness"], ["cabello", "pelo", "capilar", "shampoo", "acondicionador", "tinte", "tintes"]),
  semantic("hair-tools", "Peinado", ["retail_sales", "health_wellness"], ["secador", "plancha", "rizador", "cepillo", "peinilla", "peine"]),
  semantic("oral-care", "Oral", ["retail_sales", "health_wellness"], ["oral", "dental", "cepillo dental", "crema dental", "enjuague"]),
  semantic("pharmacy", "Farmacia", ["retail_sales", "health_wellness"], ["farmacia", "drogueria", "medicamentos", "medicina", "botica"]),
  semantic("medicines", "Medicamentos", ["retail_sales", "health_wellness"], ["medicamento", "medicamentos", "pastillas", "jarabe", "jarabes"]),
  semantic("first_aid", "Botiquin", ["retail_sales", "health_wellness"], ["botiquin", "botiquín", "primeros auxilios", "curaciones", "vendas"]),
  semantic("diapers", "Panales", ["retail_sales"], ["panal", "panales", "pañal", "pañales"]),
  semantic("herbal", "Naturista", ["retail_sales", "health_wellness"], ["naturista", "natural", "hierbas", "homeopatico", "homeopático"]),
  semantic("supplements", "Suplementos", ["retail_sales", "health_wellness"], ["suplemento", "suplementos", "proteina", "proteinas", "vitaminas"]),
  semantic("smartphone", "Celulares", ["retail_sales"], ["celular", "celulares", "telefono", "telefonos", "movil", "moviles", "iphone", "android"]),
  semantic("smartwatch", "Smartwatch", ["retail_sales"], ["smartwatch", "reloj inteligente", "watch inteligente"]),
  semantic("laptop", "Tecnologia", ["retail_sales", "services"], ["computador", "computadores", "laptop", "laptops", "portatil", "portatiles", "tecnologia", "electronica"]),
  semantic("appliance", "Electrodomesticos", ["retail_sales"], ["electrodomestico", "electrodomesticos", "nevera", "lavadora", "licuadora", "freidora"]),
  semantic("audio", "Audio", ["retail_sales"], ["audio", "audifonos", "audífonos", "parlante", "parlantes", "speaker"]),
  semantic("gaming", "Gaming", ["retail_sales"], ["gaming", "gamer", "consola", "consolas", "videojuegos"]),
  semantic("camera-tech", "Camaras", ["retail_sales", "services"], ["camara", "cámara", "camaras", "cámaras", "fotografia producto"]),
  semantic("home", "Hogar", ["retail_sales", "services", "tourism_experiences"], ["hogar", "casa", "decoracion", "decoraciones", "muebles", "mueble", "sala", "sofa", "sofas"]),
  semantic("furniture", "Muebles", ["retail_sales"], ["muebleria", "muebles", "cama", "camas", "comedor", "closet"]),
  semantic("kitchen", "Cocina", ["retail_sales"], ["cocina", "cocinas", "ollas", "vajilla", "utensilios cocina"]),
  semantic("textiles", "Textiles", ["retail_sales"], ["toalla", "toallas", "sabana", "sabanas", "cobija", "cobijas", "cortinas"]),
  semantic("organizer", "Organizacion", ["retail_sales"], ["organizador", "organizadores", "canasta", "canastas", "cajas organizadoras"]),
  semantic("cleaning-products", "Limpieza", ["retail_sales"], ["aseo", "limpieza hogar", "detergente", "detergentes", "desinfectante"]),
  semantic("tool", "Herramientas", ["retail_sales", "services"], ["ferreteria", "herramienta", "herramientas", "repuesto", "repuestos"]),
  semantic("tools_manual", "Herramientas manuales", ["retail_sales", "services"], ["destornillador", "martillo", "alicate", "llave inglesa", "manuales"]),
  semantic("tools_electric", "Herramientas electricas", ["retail_sales", "services"], ["taladro", "pulidora", "sierra", "herramienta electrica", "herramientas electricas"]),
  semantic("screws", "Tornillos", ["retail_sales"], ["tornillo", "tornillos", "tuerca", "tuercas", "arandela", "arandelas"]),
  semantic("pipes", "Tubos", ["retail_sales", "services"], ["tubo", "tubos", "pvc", "tuberia", "tuberias"]),
  semantic("locks", "Cerraduras", ["retail_sales", "services"], ["cerradura", "cerraduras", "candado", "candados", "chapa", "chapas"]),
  semantic("lighting", "Iluminacion", ["retail_sales", "services"], ["bombillo", "bombillos", "lampara", "lamparas", "iluminacion", "luces"]),
  semantic("wood", "Madera", ["retail_sales"], ["madera", "tablas", "mdf", "aglomerado"]),
  semantic("paint", "Pinturas", ["retail_sales", "services"], ["pintura", "pinturas", "brocha", "vinilo", "materiales"]),
  semantic("garden", "Jardin", ["retail_sales", "services"], ["jardin", "jardineria", "plantas", "materas", "semillas"]),
  semantic("book", "Papeleria", ["retail_sales", "services"], ["libro", "libros", "papeleria", "cuaderno", "cuadernos", "agenda", "agendas", "utiles"]),
  semantic("stationery", "Oficina", ["retail_sales", "services"], ["oficina", "archivo", "impresora", "tinta", "toner"]),
  semantic("pet", "Mascotas", ["retail_sales", "services"], ["mascota", "mascotas", "perro mascota", "gato", "gatos", "alimento mascotas", "petshop"]),
  semantic("pet_food", "Alimento mascotas", ["retail_sales"], ["concentrado", "cuido", "alimento perro", "alimento gato", "comida mascotas"]),
  semantic("bike", "Deportes", ["retail_sales", "health_wellness"], ["bicicleta", "bicicletas", "ciclismo", "deporte", "deportes", "fitness"]),
  semantic("ball", "Balones", ["retail_sales"], ["balon", "balón", "balones", "futbol", "fútbol", "basket"]),
  semantic("toy", "Juguetes", ["retail_sales"], ["juguete", "juguetes", "nino", "ninos", "niño", "niños"]),
  semantic("baby", "Bebes", ["retail_sales"], ["bebe", "bebes", "bebé", "bebés", "pañales", "panales", "coche", "cunas"]),
  semantic("gift", "Regalos", ["retail_sales"], ["regalo", "regalos", "detalle", "detalles", "sorpresa", "sorpresas"]),
  semantic("flowers", "Flores", ["retail_sales", "services"], ["flor", "flores", "floristeria", "ramos", "bouquet"]),
  semantic("liquor", "Licorera", ["retail_sales", "food_drink"], ["licor", "licores", "licorera", "whisky", "aguardiente", "ron"]),
  semantic("car", "Autos", ["retail_sales", "services"], ["carro", "carros", "auto", "autos", "automotriz", "vehiculo", "vehiculos"]),
  semantic("motorcycle", "Motos", ["retail_sales", "services"], ["moto", "motos", "motocicleta", "motocicletas", "cascos"]),
  semantic("car_parts", "Repuestos auto", ["retail_sales", "services"], ["repuestos auto", "repuestos carro", "autopartes", "aceite motor", "llantas"]),
  semantic("motorcycle_parts", "Repuestos moto", ["retail_sales", "services"], ["repuestos moto", "partes moto", "cascos moto", "llantas moto"]),

  // Servicios
  semantic("professional", "Profesional", ["services"], ["servicio profesional", "servicios profesionales", "consultoria", "asesoria", "asesorias"]),
  semantic("legal", "Legal", ["services"], ["legal", "abogado", "abogados", "juridico", "juridica", "derecho"]),
  semantic("accounting", "Contable", ["services"], ["contable", "contador", "contadores", "contabilidad", "impuestos"]),
  semantic("repair", "Reparacion", ["services"], ["reparacion", "reparaciones", "arreglo", "arreglos", "mantenimiento", "tecnico"]),
  semantic("construction", "Construccion", ["services"], ["construccion", "remodelacion", "obra", "albanil", "albañil", "maestro"]),
  semantic("electrician", "Electricidad", ["services"], ["electricidad", "electricista", "electricistas", "instalacion electrica"]),
  semantic("plumbing", "Plomeria", ["services"], ["plomeria", "plomero", "plomeros", "tuberia", "fugas"]),
  semantic("cleaning", "Limpieza", ["services"], ["limpieza", "aseo", "desinfeccion", "servicio de aseo"]),
  semantic("laundry", "Lavanderia", ["services"], ["lavanderia", "lavado", "ropa limpia", "tintoreria"]),
  semantic("tailoring", "Sastreria", ["services", "retail_sales"], ["sastreria", "modisteria", "costura", "arreglos de ropa"]),
  semantic("carwash", "Lavadero", ["services"], ["lavadero", "car wash", "lavado de autos", "detailing"]),
  semantic("camera", "Fotos", ["services", "tourism_experiences"], ["fotografia", "foto", "fotos", "video", "videos", "audiovisual"]),
  semantic("education", "Clases", ["services"], ["clase", "clases", "educacion", "curso", "cursos", "tutoria", "tutorias"]),
  semantic("events", "Eventos", ["services", "tourism_experiences"], ["evento", "eventos", "decoracion eventos", "fiesta", "fiestas"]),
  semantic("delivery", "Domicilios", ["services", "food_drink", "retail_sales"], ["envio", "envios", "domicilio", "domicilios", "entrega", "entregas", "mensajeria"]),
  semantic("transport", "Transporte", ["services", "tourism_experiences"], ["transporte", "taxi", "mudanza", "trasteo", "viajes"]),
  semantic("printing", "Impresion", ["services", "retail_sales"], ["impresion", "impresiones", "litografia", "plotter", "copias"]),
  semantic("advertising", "Publicidad", ["services"], ["publicidad", "diseno", "diseño", "marketing", "redes sociales", "branding"]),
  semantic("real-estate", "Inmuebles", ["services"], ["inmobiliaria", "inmueble", "inmuebles", "arriendo", "venta de casas"]),
  semantic("security", "Seguridad", ["services"], ["seguridad", "camara seguridad", "camaras seguridad", "alarmas", "vigilancia"]),
  semantic("internet", "Internet", ["services"], ["internet", "wifi", "fibra", "telecomunicaciones"]),
  semantic("logistics", "Logistica", ["services"], ["logistica", "paqueteria", "envios nacionales", "carga"]),

  // Salud y bienestar
  semantic("barber", "Barberia", ["health_wellness"], ["barberia", "barbero", "barberos", "corte hombre", "barba"]),
  semantic("salon", "Salon", ["health_wellness"], ["salon", "salon de belleza", "peluqueria", "peinados", "tintura"]),
  semantic("spa", "Spa", ["health_wellness"], ["spa", "relajacion", "relajación", "tratamientos"]),
  semantic("massage", "Masajes", ["health_wellness"], ["masaje", "masajes", "terapia corporal"]),
  semantic("aesthetics", "Estetica", ["health_wellness"], ["estetica", "estética", "estetica facial", "estetica corporal", "tratamientos esteticos"]),
  semantic("eyebrows", "Cejas", ["health_wellness"], ["ceja", "cejas", "brow", "brows", "microblading", "laminado"]),
  semantic("lashes", "Pestanas", ["health_wellness"], ["pestana", "pestanas", "pestaña", "pestañas", "lifting", "extension pestanas", "extensiones pestanas"]),
  semantic("waxing", "Depilacion", ["health_wellness"], ["depilacion", "depilación", "cera", "wax", "waxing"]),
  semantic("laser", "Laser", ["health_wellness"], ["laser", "láser", "depilacion laser", "laser facial"]),
  semantic("botox", "Botox", ["health_wellness"], ["botox", "toxina", "relleno", "rellenos", "acido hialuronico", "ácido hialurónico"]),
  semantic("gym", "Gimnasio", ["health_wellness"], ["gimnasio", "gym", "entrenamiento", "pesas", "crossfit"]),
  semantic("yoga", "Yoga", ["health_wellness"], ["yoga", "pilates", "meditacion", "meditación"]),
  semantic("dental", "Odontologia", ["health_wellness"], ["odontologia", "odontología", "dentista", "dental", "ortodoncia"]),
  semantic("medical", "Medico", ["health_wellness"], ["medico", "médico", "consultorio", "doctor", "doctora", "salud"]),
  semantic("psychology", "Psicologia", ["health_wellness"], ["psicologia", "psicología", "psicologo", "psicóloga", "psicoterapia"]),
  semantic("therapy", "Terapias", ["health_wellness"], ["terapia", "terapias", "fisioterapia", "rehabilitacion", "rehabilitación"]),
  semantic("nutrition", "Nutricion", ["health_wellness"], ["nutricion", "nutrición", "nutricionista", "dieta", "dietas"]),
  semantic("heart", "Bienestar", ["health_wellness"], ["bienestar", "wellness", "cuidado", "vida sana"]),

  // Turismo y experiencias
  semantic("map", "Experiencias", ["tourism_experiences"], ["experiencia", "experiencias", "plan", "planes", "ruta", "rutas"]),
  semantic("hotel", "Hotel", ["tourism_experiences"], ["hotel", "hoteles", "hospedaje", "habitacion", "habitaciones"]),
  semantic("hostel", "Hostal", ["tourism_experiences"], ["hostal", "hostel", "posada"]),
  semantic("glamping", "Glamping", ["tourism_experiences"], ["glamping", "domo", "cabana", "cabaña"]),
  semantic("camping", "Camping", ["tourism_experiences"], ["camping", "campamento", "acampar"]),
  semantic("finca", "Finca", ["tourism_experiences"], ["finca", "casa campestre", "alojamiento rural", "rural"]),
  semantic("tour", "Tour", ["tourism_experiences"], ["tour", "tours", "operador turistico", "operador turístico", "recorrido"]),
  semantic("travel", "Viajes", ["tourism_experiences"], ["viaje", "viajes", "agencia de viajes", "paquete turistico", "paquete turístico"]),
  semantic("museum", "Museo", ["tourism_experiences"], ["museo", "museos", "historia", "historico", "histórico"]),
  semantic("viewpoint", "Mirador", ["tourism_experiences"], ["mirador", "panoramica", "panorámica", "vista"]),
  semantic("adventure", "Aventura", ["tourism_experiences"], ["aventura", "extremo", "canopy", "rafting", "parapente"]),
  semantic("nature", "Naturaleza", ["tourism_experiences"], ["naturaleza", "sendero", "senderos", "caminata", "ecoturismo", "cascada"]),
  semantic("culture", "Cultura", ["tourism_experiences"], ["cultura", "cultural", "centro cultural", "arte", "artesania", "artesanía"]),
  semantic("guide", "Guia", ["tourism_experiences"], ["guia", "guía", "guias", "guías", "orientador"]),

  // Transversales
  semantic("new", "Novedades", ["food_drink", "retail_sales", "services", "health_wellness", "tourism_experiences"], ["nuevo", "nuevos", "novedad", "novedades", "lanzamiento", "lanzamientos"]),
  semantic("bestseller", "Mas vendidos", ["food_drink", "retail_sales"], ["mas vendido", "mas vendidos", "top", "favorito", "favoritos"]),
  semantic("sparkles", "Especial", ["food_drink", "retail_sales", "services", "health_wellness", "tourism_experiences"], ["especial", "especiales", "destacado", "destacados", "premium"]),
  semantic("tags", "Coleccion", ["retail_sales", "services"], ["categoria", "categorias", "coleccion", "colecciones", "linea", "lineas"]),
  semantic("tag", "General", ["food_drink", "retail_sales", "services", "health_wellness", "tourism_experiences"], ["general", "otros", "otras", "varios", "varias"]),
];

const CATEGORY_SEMANTICS = [
  ...TARGET_COMMERCE_CATEGORY_SEMANTICS,
  ...BASE_CATEGORY_SEMANTICS,
];

const PRESETS = CATEGORY_SEMANTICS.map(({ iconKey, aliases, verticals }) => ({ iconKey, aliases, verticals }));

const CATEGORY_BY_KEY = CATEGORY_SEMANTICS.reduce((items, item) => {
  items[item.iconKey] = item;
  return items;
}, {});

const ICON_LABELS = CATEGORY_SEMANTICS.reduce((labels, item) => {
  labels[item.iconKey] = item.label;
  return labels;
}, {});

const ICON_GROUPS_BY_VERTICAL = {
  food_drink: [
    group("Mas usadas", ["utensils", "combo", "new", "bestseller", "delivery"]),
    group("Rapidas", ["burger", "hotdog", "fries", "pizza", "chicken", "sausage"]),
    group("Restaurante", ["utensils", "cooking-pot", "beef", "fish", "shrimp", "soup", "rice", "arepa"]),
    group("Internacional", ["taco", "pasta", "sushi", "vegan", "salad"]),
    group("Cafe y panaderia", ["coffee", "breakfast", "croissant", "cake", "cookie", "candy", "ice-cream"]),
    group("Bebidas", ["cup-soda", "juice", "water", "tea", "beer", "wine", "cocktail"]),
  ],
  retail_sales: [
    group("Mas usadas", ["store", "market", "combo", "new", "bestseller"]),
    group("Supermercado", ["market", "fruit", "vegetable", "dairy", "meat", "croissant", "cup-soda", "snacks", "cleaning-products", "pet", "baby"]),
    group("Moda", ["shirt", "dress", "menswear", "kidswear", "underwear", "sportswear", "swimwear", "uniform", "hat"]),
    group("Calzado", ["shoe", "sneakers", "running_shoes", "sport_shoes", "casual_shoes", "formal_shoes", "loafers", "heels", "flats", "platforms", "wedges", "boots", "ankle_boots", "high_boots", "sandals", "flip_flops", "slippers", "kids_shoes", "baby_shoes", "school_shoes", "safety_shoes"]),
    group("Accesorios de moda", ["bag", "wallet", "accessories", "jewelry", "rings", "earrings", "necklaces", "bracelets", "charms", "jewelry_set", "watch", "glasses"]),
    group("Belleza y cuidado", ["cosmetics", "makeup", "brushes", "palette", "lipstick", "mascara", "perfume", "nails", "skincare", "cream", "sunscreen", "soap", "body-care", "hair", "hair-tools", "oral-care"]),
    group("Tecnologia", ["smartphone", "smartwatch", "laptop", "audio", "gaming", "camera-tech", "appliance"]),
    group("Hogar", ["home", "furniture", "kitchen", "textiles", "organizer", "candles", "lighting"]),
    group("Ferreteria", ["tool", "tools_manual", "tools_electric", "screws", "pipes", "locks", "paint", "wood", "garden", "garden_tools"]),
    group("Farmacia y bebe", ["pharmacy", "medicines", "first_aid", "herbal", "supplements", "diapers", "baby"]),
    group("Especializadas", ["pet", "pet_food", "toy", "gift", "flowers", "liquor", "car", "car_parts", "motorcycle", "motorcycle_parts", "bike", "ball", "book", "stationery"]),
  ],
  services: [
    group("Mas usadas", ["professional", "tag", "delivery", "booking", "sparkles"].filter((key) => key !== "booking")),
    group("Profesionales", ["professional", "legal", "accounting", "advertising", "real-estate", "security", "internet"]),
    group("Hogar y obra", ["repair", "construction", "electrician", "plumbing", "cleaning", "paint", "garden", "tool", "tools_manual", "tools_electric", "pipes", "locks", "lighting"]),
    group("Tecnicos", ["laptop", "smartphone", "camera-tech", "appliance", "car", "car_parts", "motorcycle", "motorcycle_parts"]),
    group("Personales", ["laundry", "tailoring", "pet", "education", "events"]),
    group("Logistica", ["delivery", "transport", "printing", "logistics", "carwash"]),
  ],
  health_wellness: [
    group("Mas usadas", ["heart", "salon", "barber", "nails", "spa", "aesthetics"]),
    group("Belleza", ["salon", "barber", "hair", "hair-tools", "makeup", "brushes", "palette", "lipstick", "mascara", "perfume"]),
    group("Unas y estetica", ["nails", "pedicure", "eyebrows", "lashes", "waxing", "laser", "botox", "skincare", "cream", "mask", "toner", "sunscreen"]),
    group("Spa y bienestar", ["spa", "massage", "body-care", "soap", "heart", "yoga", "nutrition"]),
    group("Salud", ["medical", "dental", "psychology", "therapy", "nutrition", "pharmacy", "supplements", "oral-care", "glasses"]),
    group("Fitness", ["gym", "bike", "vegan", "salad"]),
  ],
  tourism_experiences: [
    group("Mas usadas", ["map", "tour", "camera", "travel", "hotel"]),
    group("Alojamiento", ["hotel", "hostel", "glamping", "camping", "finca", "home"]),
    group("Rutas y planes", ["tour", "guide", "museum", "culture", "viewpoint", "camera"]),
    group("Naturaleza", ["nature", "adventure", "transport"]),
    group("Viajes", ["travel", "delivery", "events", "sparkles"]),
  ],
  default: [
    group("Generales", DEFAULT_ICON_KEYS),
  ],
};

Object.entries(TARGET_COMMERCE_CATEGORY_GROUPS).forEach(([vertical, targetGroups]) => {
  ICON_GROUPS_BY_VERTICAL[vertical] = [
    ...targetGroups,
    ...(ICON_GROUPS_BY_VERTICAL[vertical] || []),
  ];
});

const ICON_KEYS_BY_VERTICAL = CATEGORY_SEMANTICS.reduce((groups, item) => {
  item.verticals.forEach((vertical) => {
    if (!groups[vertical]) groups[vertical] = [];
    groups[vertical].push(item.iconKey);
  });
  return groups;
}, { default: DEFAULT_ICON_KEYS });

function semantic(iconKey, label, verticals, aliases) {
  return { iconKey, label, verticals, aliases };
}

function group(title, keys) {
  return { title, keys };
}

function uniqueIconKeys(keys = []) {
  return [...new Set(keys.filter(Boolean))];
}

function buildOption(iconKey) {
  return {
    iconKey,
    label: ICON_LABELS[iconKey] || "Icono",
  };
}

function buildContextText(context = {}) {
  if (!context || typeof context !== "object") return normalizeCommerceCategoryIconText(context);
  return normalizeCommerceCategoryIconText([
    context.businessCategory,
    context.businessType,
    context.businessTypeLabel,
    context.activeMode,
    context.module,
    context.subcategory,
    context.variant,
    context.theme,
  ].filter(Boolean).join(" "));
}

const CONTEXT_RULES = [
  {
    intent: "shoes",
    terms: ["shoes", "shoe", "zapatos", "zapato", "calzado", "sandalias", "sandalia", "botas", "bota", "tacones", "tacon"],
    groupOrder: ["Calzado", "Calzado ampliado", "Accesorios de moda", "Moda", "Mas usadas", "Belleza y cuidado", "Especializadas", "Colecciones retail"],
    allowedPrefixes: ["target_shoes_", "target_accessories_", "target_jewelry_", "target_apparel_"],
    allowedKeys: [
      "shoe", "sneakers", "running_shoes", "sport_shoes", "casual_shoes", "formal_shoes", "loafers", "heels", "flats", "platforms", "wedges", "boots", "ankle_boots", "high_boots", "sandals", "flip_flops", "slippers", "kids_shoes", "baby_shoes", "school_shoes", "safety_shoes",
      "bag", "wallet", "accessories", "jewelry", "rings", "earrings", "necklaces", "bracelets", "charms", "jewelry_set", "watch", "glasses",
      "shirt", "dress", "menswear", "kidswear", "underwear", "sportswear", "swimwear", "uniform", "hat",
      "store", "combo", "new", "bestseller", "sparkles", "tags", "tag",
    ],
  },
  {
    intent: "fashion",
    terms: ["fashion", "moda", "ropa", "clothing", "clothing female", "clothing male", "clothing mixed"],
    groupOrder: ["Moda", "Ropa ampliada", "Calzado", "Calzado ampliado", "Accesorios de moda", "Joyeria y accesorios ampliados", "Mas usadas", "Belleza y cuidado", "Especializadas", "Colecciones retail"],
    allowedPrefixes: ["target_apparel_", "target_shoes_", "target_jewelry_", "target_accessories_"],
    allowedKeys: [
      "shirt", "dress", "menswear", "kidswear", "underwear", "sportswear", "swimwear", "uniform", "hat",
      "shoe", "sneakers", "running_shoes", "sport_shoes", "casual_shoes", "formal_shoes", "loafers", "heels", "flats", "platforms", "wedges", "boots", "ankle_boots", "high_boots", "sandals", "flip_flops", "slippers", "kids_shoes", "baby_shoes", "school_shoes", "safety_shoes", "bag", "wallet", "accessories", "jewelry", "rings", "earrings", "necklaces", "bracelets", "charms", "jewelry_set", "watch", "glasses",
      "store", "combo", "new", "bestseller", "sparkles", "tags", "tag",
    ],
  },
  {
    intent: "grocery",
    terms: ["grocery", "supermarket", "mercado", "supermercado", "minimercado", "neighborhood store", "tienda de barrio", "viveres"],
    groupOrder: ["Supermercado", "Mas usadas", "Especializadas", "Hogar"],
  },
  {
    intent: "beauty",
    terms: ["beauty", "belleza", "cosmeticos", "cosmetico", "maquillaje", "cuidado personal"],
    groupOrder: ["Belleza y cuidado", "Mas usadas", "Moda", "Especializadas"],
  },
  {
    intent: "tech",
    terms: ["tech", "technology", "tecnologia", "electronica", "celulares", "computadores"],
    groupOrder: ["Tecnologia", "Mas usadas", "Especializadas"],
  },
  {
    intent: "pharmacy",
    terms: ["pharmacy", "farmacia", "drogueria", "salud", "supplements", "suplementos"],
    groupOrder: ["Farmacia y bebe", "Belleza y cuidado", "Mas usadas"],
  },
  {
    intent: "hardware",
    terms: ["hardware", "ferreteria", "herramientas", "construction", "construccion"],
    groupOrder: ["Ferreteria", "Hogar", "Mas usadas"],
  },
  {
    intent: "pet",
    terms: ["pet", "mascotas", "mascota", "petshop"],
    groupOrder: ["Especializadas", "Mas usadas", "Supermercado"],
  },
];

function resolveContextRule(context = {}) {
  const contextText = buildContextText(context);
  if (!contextText) return null;
  return CONTEXT_RULES.find((rule) => rule.terms.some((term) => contextText.includes(normalizeCommerceCategoryIconText(term)))) || null;
}

function orderGroupDefinitions(definitions = [], rule = null) {
  if (!rule?.groupOrder?.length) return definitions;
  const score = (title) => {
    const index = rule.groupOrder.indexOf(title);
    return index === -1 ? 100 : index;
  };
  return [...definitions].sort((left, right) => score(left.title) - score(right.title));
}

function isContextAllowed(iconKey, rule = null) {
  if (rule?.allowedPrefixes?.some((prefix) => iconKey.startsWith(prefix))) return true;
  if (!rule?.allowedKeys?.length) return true;
  return rule.allowedKeys.includes(iconKey);
}

export function normalizeCommerceCategoryColor(value = "") {
  const cleanValue = String(value || "").trim();
  return /^#([A-Fa-f0-9]{6})$/.test(cleanValue) ? cleanValue.toUpperCase() : COMMERCE_CATEGORY_COLOR_FALLBACK;
}

export function normalizeCommerceCategoryIconKey(value = "") {
  const cleanValue = String(value || "").trim().toLowerCase();
  return ICON_LABELS[cleanValue] ? cleanValue : COMMERCE_CATEGORY_ICON_FALLBACK;
}

export function getCommerceCategoryIconOptions(category = "") {
  const vertical = String(category || "").trim();
  const keys = uniqueIconKeys([
    ...(ICON_KEYS_BY_VERTICAL[vertical] || []),
    ...ICON_KEYS_BY_VERTICAL.default,
  ]);

  return keys.map((iconKey) => ({
    iconKey,
    label: ICON_LABELS[iconKey] || "Icono",
  }));
}

export function getCommerceCategoryIconGroups(category = "", query = "", suggestedIconKey = "", context = {}) {
  const vertical = String(category || "").trim();
  const cleanQuery = normalizeCommerceCategoryIconText(query);
  const contextRule = resolveContextRule({ businessCategory: vertical, ...context });
  const includeAll = Boolean(context?.includeAll);

  if (cleanQuery) {
    const matches = CATEGORY_SEMANTICS
      .filter((item) => isContextAllowed(item.iconKey, contextRule))
      .map((item) => {
        const label = normalizeCommerceCategoryIconText(item.label);
        const aliasMatch = item.aliases.some((alias) => normalizeCommerceCategoryIconText(alias).includes(cleanQuery));
        const labelMatch = label.includes(cleanQuery);
        const verticalScore = vertical && item.verticals.includes(vertical) ? 30 : 0;
        const baseScore = label === cleanQuery ? 100 : labelMatch ? 80 : aliasMatch ? 65 : 0;
        const score = baseScore ? baseScore + verticalScore : 0;
        return { item, score };
      })
      .filter(({ score }) => score > 0)
      .sort((left, right) => right.score - left.score || left.item.label.localeCompare(right.item.label))
      .slice(0, includeAll ? 96 : 48)
      .map(({ item }) => buildOption(item.iconKey));

    return matches.length ? [{ title: "Resultados", options: matches }] : [{ title: "Sin resultados", options: [buildOption(COMMERCE_CATEGORY_ICON_FALLBACK)] }];
  }

  const seen = new Set();
  const groups = [];
  const suggested = normalizeCommerceCategoryIconKey(suggestedIconKey);

  if (suggested && suggested !== COMMERCE_CATEGORY_ICON_FALLBACK && CATEGORY_BY_KEY[suggested]) {
    seen.add(suggested);
    groups.push({ title: "Sugerido", options: [buildOption(suggested)] });
  }

  const definitions = orderGroupDefinitions(ICON_GROUPS_BY_VERTICAL[vertical] || ICON_GROUPS_BY_VERTICAL.default, contextRule);
  definitions.forEach((definition) => {
    const options = definition.keys
      .filter((iconKey) => isContextAllowed(iconKey, contextRule))
      .filter((iconKey) => CATEGORY_BY_KEY[iconKey] && !seen.has(iconKey))
      .map((iconKey) => {
        seen.add(iconKey);
        return buildOption(iconKey);
      });
    if (options.length) groups.push({ title: definition.title, options });
  });

  DEFAULT_ICON_KEYS.forEach((iconKey) => {
    if (!seen.has(iconKey) && CATEGORY_BY_KEY[iconKey]) {
      seen.add(iconKey);
      if (!groups.some((item) => item.title === "Generales")) {
        groups.push({ title: "Generales", options: [] });
      }
      groups.find((item) => item.title === "Generales").options.push(buildOption(iconKey));
    }
  });

  return groups;
}

export function normalizeCommerceCategoryIconText(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const NORMALIZED_KEY_TOKEN_OVERRIDES = {
  accesorios: "accesorio",
  bebidas: "bebida",
  bolsos: "bolso",
  botas: "bota",
  cafes: "cafe",
  camisetas: "camiseta",
  carnes: "carne",
  celulares: "celular",
  computadores: "computador",
  cosmeticos: "cosmetico",
  dulces: "dulce",
  ensaladas: "ensalada",
  gaseosas: "gaseosa",
  hamburguesas: "hamburguesa",
  helados: "helado",
  juguetes: "juguete",
  jugos: "jugo",
  laptops: "laptop",
  mariscos: "marisco",
  maletines: "maletin",
  mochilas: "mochila",
  pastas: "pasta",
  perros: "perro",
  pescados: "pescado",
  pizzas: "pizza",
  platos: "plato",
  promociones: "promocion",
  rapidas: "rapida",
  regalos: "regalo",
  relojes: "reloj",
  servicios: "servicio",
  zapatos: "zapato",
};

function normalizeCommerceCategoryKeyToken(token = "") {
  const normalized = String(token || "").trim();
  if (!normalized) return "";
  if (NORMALIZED_KEY_TOKEN_OVERRIDES[normalized]) return NORMALIZED_KEY_TOKEN_OVERRIDES[normalized];
  if (normalized.length > 3 && normalized.endsWith("s")) return normalized.slice(0, -1);
  return normalized;
}

export function buildCommerceCategoryNormalizedKey(value = "") {
  return normalizeCommerceCategoryIconText(value)
    .split(" ")
    .map(normalizeCommerceCategoryKeyToken)
    .filter(Boolean)
    .join("_");
}

function calculatePresetMatchScore(text, alias, preset, vertical) {
  const normalizedAlias = normalizeCommerceCategoryIconText(alias);
  if (!normalizedAlias) return 0;

  let score = 0;
  if (text === normalizedAlias) {
    score = 100;
  } else if (normalizedAlias.length >= 4 && text.includes(normalizedAlias)) {
    score = 80;
  } else if (normalizedAlias.includes(text) && text.length >= 4) {
    score = 55;
  }

  if (!score) return 0;
  if (vertical && preset.verticals?.includes(vertical)) score += 30;
  if (preset.iconKey?.startsWith("target_")) score += 12;
  return score;
}

export function resolveCommerceCategoryIcon(value = "", category = "") {
  const text = normalizeCommerceCategoryIconText(value);
  const vertical = String(category || "").trim();
  if (!text) {
    return {
      iconKey: COMMERCE_CATEGORY_ICON_FALLBACK,
      iconSource: "fallback",
      iconMatchedAlias: "",
    };
  }

  let bestMatch = null;
  for (const preset of PRESETS) {
    for (const alias of preset.aliases) {
      const score = calculatePresetMatchScore(text, alias, preset, vertical);
      if (score && (!bestMatch || score > bestMatch.score)) {
        bestMatch = {
          score,
          iconKey: preset.iconKey,
          iconMatchedAlias: normalizeCommerceCategoryIconText(alias),
        };
      }
    }
  }

  if (bestMatch) {
    return {
      iconKey: bestMatch.iconKey,
      iconSource: "preset",
      iconMatchedAlias: bestMatch.iconMatchedAlias,
    };
  }

  return {
    iconKey: COMMERCE_CATEGORY_ICON_FALLBACK,
    iconSource: "fallback",
    iconMatchedAlias: "",
  };
}
