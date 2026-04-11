export const COMMERCE_CATEGORY_ICON_FALLBACK = "tag";

const PRESETS = [
  {
    iconKey: "burger",
    aliases: [
      "hamburguesa",
      "hamburguesas",
      "burger",
      "burgers",
      "comida rapida",
      "rapida",
      "fast food",
      "sandwich",
      "sandwiches",
      "perro",
      "perros",
      "hot dog",
      "hot dogs",
      "salchipapa",
      "salchipapas",
    ],
  },
  {
    iconKey: "pizza",
    aliases: ["pizza", "pizzas", "pizzeria", "porciones"],
  },
  {
    iconKey: "chicken",
    aliases: ["pollo", "pollos", "alitas", "alas", "nuggets", "broaster", "asado de pollo"],
  },
  {
    iconKey: "beef",
    aliases: ["carne", "carnes", "parrilla", "asado", "asados", "bbq", "churrasco", "costilla", "costillas", "steak"],
  },
  {
    iconKey: "fish",
    aliases: ["pescado", "pescados", "sushi", "ceviche", "ceviches"],
  },
  {
    iconKey: "shrimp",
    aliases: ["mariscos", "camarones", "camaron", "langostinos", "langostino"],
  },
  {
    iconKey: "soup",
    aliases: ["sopa", "sopas", "crema", "cremas", "caldo", "caldos"],
  },
  {
    iconKey: "salad",
    aliases: ["ensalada", "ensaladas", "bowls", "bowl saludable", "saludable"],
  },
  {
    iconKey: "vegan",
    aliases: ["vegetariano", "vegetarianos", "vegano", "veganos", "veggie", "plant based"],
  },
  {
    iconKey: "utensils",
    aliases: [
      "plato",
      "platos",
      "platos fuertes",
      "almuerzo",
      "almuerzos",
      "cena",
      "cenas",
      "especiales",
      "menu",
      "menus",
      "entradas",
      "entrada",
      "acompanantes",
      "acompanamiento",
      "acompanamientos",
      "principales",
      "comida",
    ],
  },
  {
    iconKey: "cooking-pot",
    aliases: ["casero", "casera", "corrientazo", "corrientazos", "del dia", "ejecutivo", "ejecutivos"],
  },
  {
    iconKey: "taco",
    aliases: ["taco", "tacos", "burrito", "burritos", "nachos", "mexicana", "mexicano"],
  },
  {
    iconKey: "pasta",
    aliases: ["pasta", "pastas", "lasagna", "ravioli", "spaghetti", "espagueti"],
  },
  {
    iconKey: "coffee",
    aliases: ["cafe", "cafes", "cafeteria", "capuccino", "latte", "mocca", "desayuno", "desayunos"],
  },
  {
    iconKey: "cup-soda",
    aliases: ["bebida", "bebidas", "gaseosa", "gaseosas", "refresco", "refrescos", "soda", "sodas", "jugos", "jugo"],
  },
  {
    iconKey: "ice-cream",
    aliases: ["helado", "helados", "malteada", "malteadas"],
  },
  {
    iconKey: "cake",
    aliases: ["postre", "postres", "torta", "tortas", "pastel", "pasteles", "cupcake", "cupcakes"],
  },
  {
    iconKey: "cookie",
    aliases: ["galleta", "galletas", "waffle", "waffles", "brownie", "brownies"],
  },
  {
    iconKey: "candy",
    aliases: ["dulce", "dulces", "chocolates", "chocolate", "gomitas", "confiteria"],
  },
  {
    iconKey: "croissant",
    aliases: ["pan", "panes", "panaderia", "pasteleria", "croissant", "hojaldre", "hojaldres"],
  },
  {
    iconKey: "beer",
    aliases: ["cerveza", "cervezas", "licor", "licores", "bar", "cocteles", "coctel"],
  },
  {
    iconKey: "wine",
    aliases: ["vino", "vinos", "champana"],
  },
  {
    iconKey: "combo",
    aliases: ["combo", "combos", "promocion", "promociones", "oferta", "ofertas", "promo", "promos", "paquete", "paquetes"],
  },
  {
    iconKey: "shirt",
    aliases: ["ropa", "camisa", "camisas", "camiseta", "camisetas", "blusa", "blusas", "pantalon", "pantalones", "vestido", "vestidos"],
  },
  {
    iconKey: "shoe",
    aliases: ["zapato", "zapatos", "calzado", "tenis", "sneakers", "botas", "sandalias", "tacones"],
  },
  {
    iconKey: "bag",
    aliases: ["bolso", "bolsos", "maletin", "maletines", "mochila", "mochilas", "cartera", "carteras"],
  },
  {
    iconKey: "accessories",
    aliases: ["accesorio", "accesorios", "complementos", "moda", "bijouteria", "bisuteria"],
  },
  {
    iconKey: "jewelry",
    aliases: ["joya", "joyas", "joyeria", "anillo", "anillos", "collar", "collares", "aretes", "pulsera", "pulseras"],
  },
  {
    iconKey: "watch",
    aliases: ["reloj", "relojes"],
  },
  {
    iconKey: "glasses",
    aliases: ["gafa", "gafas", "lentes", "anteojos"],
  },
  {
    iconKey: "cosmetics",
    aliases: ["maquillaje", "cosmeticos", "cosmetico", "perfume", "perfumes", "fragancias", "skincare", "cuidado facial"],
  },
  {
    iconKey: "smartphone",
    aliases: ["celular", "celulares", "telefono", "telefonos", "movil", "moviles", "iphone", "android"],
  },
  {
    iconKey: "laptop",
    aliases: ["computador", "computadores", "laptop", "laptops", "portatil", "portatiles", "tecnologia", "electronica"],
  },
  {
    iconKey: "home",
    aliases: ["hogar", "casa", "decoracion", "decoraciones", "muebles", "mueble", "sala", "sofa", "sofas"],
  },
  {
    iconKey: "pet",
    aliases: ["mascota", "mascotas", "perro mascota", "gato", "gatos", "alimento mascotas", "petshop"],
  },
  {
    iconKey: "toy",
    aliases: ["juguete", "juguetes", "nino", "ninos", "bebe", "bebes"],
  },
  {
    iconKey: "gift",
    aliases: ["regalo", "regalos", "detalle", "detalles", "sorpresa", "sorpresas"],
  },
  {
    iconKey: "book",
    aliases: ["libro", "libros", "papeleria", "cuaderno", "cuadernos", "agenda", "agendas", "utiles"],
  },
  {
    iconKey: "tool",
    aliases: ["ferreteria", "herramienta", "herramientas", "repuesto", "repuestos", "construccion"],
  },
  {
    iconKey: "bike",
    aliases: ["bicicleta", "bicicletas", "ciclismo", "deporte", "deportes", "fitness"],
  },
  {
    iconKey: "car",
    aliases: ["carro", "carros", "auto", "autos", "automotriz", "moto", "motos", "vehiculo", "vehiculos"],
  },
  {
    iconKey: "delivery",
    aliases: ["envio", "envios", "domicilio", "domicilios", "entrega", "entregas"],
  },
  {
    iconKey: "new",
    aliases: ["nuevo", "nuevos", "novedad", "novedades", "lanzamiento", "lanzamientos"],
  },
  {
    iconKey: "bestseller",
    aliases: ["mas vendido", "mas vendidos", "top", "favorito", "favoritos"],
  },
  {
    iconKey: "store",
    aliases: ["tienda", "catalogo", "productos", "producto", "coleccion"],
  },
];

export function normalizeCommerceCategoryIconText(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function resolveCommerceCategoryIcon(value = "") {
  const text = normalizeCommerceCategoryIconText(value);
  if (!text) {
    return {
      iconKey: COMMERCE_CATEGORY_ICON_FALLBACK,
      iconSource: "fallback",
      iconMatchedAlias: "",
    };
  }

  for (const preset of PRESETS) {
    for (const alias of preset.aliases) {
      const normalizedAlias = normalizeCommerceCategoryIconText(alias);
      if (text === normalizedAlias || text.includes(normalizedAlias)) {
        return {
          iconKey: preset.iconKey,
          iconSource: "preset",
          iconMatchedAlias: normalizedAlias,
        };
      }
    }
  }

  return {
    iconKey: COMMERCE_CATEGORY_ICON_FALLBACK,
    iconSource: "fallback",
    iconMatchedAlias: "",
  };
}
