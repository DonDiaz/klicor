function normalizeCityKey(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function isDorikaEligibleCity(value = "") {
  return normalizeCityKey(value) === "ocana";
}

export function isDorikaEligibleBusiness(business = {}) {
  return isDorikaEligibleCity(
    business.city
      || business.billingProfile?.city
      || business.dorikaProfile?.city
      || "",
  );
}
