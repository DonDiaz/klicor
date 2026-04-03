import divisions from "@/lib/colombia-divipola.json";

const LOWERCASE_WORDS = new Set(["de", "del", "la", "las", "el", "los", "y", "e", "o", "u", "al"]);
const COLLATOR = new Intl.Collator("es-CO", { sensitivity: "base" });

const DEPARTMENT_NAME_OVERRIDES = {
  "08": "Atl\u00e1ntico",
  "11": "Bogot\u00e1, D.C.",
  "13": "Bol\u00edvar",
  "15": "Boyac\u00e1",
  "18": "Caquet\u00e1",
  "23": "C\u00f3rdoba",
  "27": "Choc\u00f3",
  "41": "Huila",
  "44": "La Guajira",
  "52": "Nari\u00f1o",
  "63": "Quind\u00edo",
  "76": "Valle del Cauca",
  "94": "Guain\u00eda",
  "97": "Vaup\u00e9s",
};

const CITY_NAME_OVERRIDES = {
  "05001": "Medell\u00edn",
  "08001": "Barranquilla",
  "11001": "Bogot\u00e1, D.C.",
  "13001": "Cartagena de Indias",
  "19001": "Popay\u00e1n",
  "23001": "Monter\u00eda",
  "27001": "Quibd\u00f3",
  "44001": "Riohacha",
  "54001": "C\u00facuta",
  "73001": "Ibagu\u00e9",
  "94001": "In\u00edrida",
  "95001": "San Jos\u00e9 del Guaviare",
  "97001": "Mit\u00fa",
  "99001": "Puerto Carre\u00f1o",
};

function normalizeLookupKey(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function formatLocationName(value = "") {
  const normalized = String(value || "").trim().replace(/\s+/g, " ");
  if (!normalized) return "";

  return normalized
    .split(" ")
    .map((word, index) => {
      const lowered = word.toLowerCase();
      if (index > 0 && LOWERCASE_WORDS.has(lowered)) {
        return lowered;
      }

      return lowered.charAt(0).toUpperCase() + lowered.slice(1);
    })
    .join(" ")
    .replace(/D\.c\./g, "D.C.");
}

export const COLOMBIA_LOCATIONS = divisions
  .map((department) => ({
    code: department.code,
    name: DEPARTMENT_NAME_OVERRIDES[department.code] || formatLocationName(department.name),
    cities: (Array.isArray(department.cities) ? department.cities : department.cities ? [department.cities] : [])
      .map((city) => ({
        code: city.code,
        name: CITY_NAME_OVERRIDES[city.code] || formatLocationName(city.name),
      }))
      .sort((a, b) => COLLATOR.compare(a.name, b.name)),
  }))
  .sort((a, b) => COLLATOR.compare(a.name, b.name));

const DEPARTMENT_BY_KEY = new Map(
  COLOMBIA_LOCATIONS.map((department) => [normalizeLookupKey(department.name), department]),
);

export const COLOMBIA_DEPARTMENT_OPTIONS = COLOMBIA_LOCATIONS.map((department) => ({
  value: department.name,
  label: department.name,
}));

export function resolveDepartmentName(value = "") {
  const match = DEPARTMENT_BY_KEY.get(normalizeLookupKey(value));
  return match?.name || "";
}

export function getCitiesForDepartment(departmentName = "") {
  const department = DEPARTMENT_BY_KEY.get(normalizeLookupKey(departmentName));
  return department?.cities || [];
}

export function resolveCityName(departmentName = "", cityName = "") {
  const normalizedCity = normalizeLookupKey(cityName);
  if (!normalizedCity) return "";

  const cities = getCitiesForDepartment(departmentName);
  const match = cities.find((city) => normalizeLookupKey(city.name) === normalizedCity);
  return match?.name || "";
}
