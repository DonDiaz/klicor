import assert from "node:assert/strict";
import {
  canUseModule,
  getPlanLimit,
  normalizeKlicorModule,
  normalizeKlicorPlan,
  resolveDefaultModuleAccess,
  resolvePrimaryModuleForBusinessCategory,
  resolveUserModuleAccess,
  shouldRestrictToPrimaryModuleOnProfileChange,
} from "../lib/plans.js";
import { assertNoActivePlanDowngrade, calculateCommercialToPlusUpgrade } from "../lib/billing-rules.js";

function assertAccess(actual, expected, label) {
  assert.deepEqual(actual, expected, label);
}

function activeUser(overrides = {}) {
  return {
    status: "active",
    businessCategory: "services",
    ...overrides,
  };
}

assert.equal(normalizeKlicorPlan("anual"), "plus", "legacy annual debe mapear a plus");
assert.equal(normalizeKlicorPlan("basico"), "basic", "alias basico debe mapear a basic");
assert.equal(normalizeKlicorModule("tienda"), "commerce", "tienda debe mapear a commerce");
assert.equal(normalizeKlicorModule("agenda"), "booking", "agenda debe mapear a booking");

assert.equal(resolvePrimaryModuleForBusinessCategory("food_drink"), "commerce", "comida debe priorizar comercio");
assert.equal(resolvePrimaryModuleForBusinessCategory("retail_sales"), "commerce", "retail debe priorizar comercio");
assert.equal(resolvePrimaryModuleForBusinessCategory("health_wellness"), "booking", "salud/belleza debe priorizar agenda");
assert.equal(resolvePrimaryModuleForBusinessCategory("services"), "booking", "servicios debe priorizar agenda");

assert.equal(getPlanLimit("trial", "commerceProducts"), 50, "trial debe permitir 50 productos");
assert.equal(getPlanLimit("commercial", "commerceProducts"), 50, "comercial debe permitir 50 productos");
assert.equal(getPlanLimit("plus", "commerceProducts"), 300, "plus debe permitir 300 productos");
assert.equal(getPlanLimit("basic", "commerceProducts"), 0, "basico no debe permitir productos");

assertAccess(resolveDefaultModuleAccess({ plan: "trial", businessCategory: "services" }), { commerce: false, booking: true }, "trial debe iniciar con el modulo principal");
assertAccess(resolveDefaultModuleAccess({ plan: "basic", businessCategory: "food_drink" }), { commerce: false, booking: false }, "basico no debe tener modulos");
assertAccess(resolveDefaultModuleAccess({ plan: "commercial", businessCategory: "food_drink" }), { commerce: true, booking: false }, "comercial food debe tomar comercio");
assertAccess(resolveDefaultModuleAccess({ plan: "commercial", businessCategory: "health_wellness" }), { commerce: false, booking: true }, "comercial belleza debe tomar agenda");
assertAccess(resolveDefaultModuleAccess({ plan: "commercial", businessCategory: "food_drink", selectedModule: "booking" }), { commerce: false, booking: true }, "modulo pagado debe poder sobreescribir categoria en comercial");
assertAccess(resolveDefaultModuleAccess({ plan: "plus", businessCategory: "services" }), { commerce: false, booking: true }, "plus debe iniciar con modulo principal y permitir activar el otro");

assertAccess(resolveUserModuleAccess(activeUser({ plan: "basic", moduleAccess: { commerce: true, booking: true } })), { commerce: false, booking: false }, "basico debe apagar modulos aunque haya datos viejos");
assertAccess(resolveUserModuleAccess(activeUser({ plan: "plus", moduleAccess: { commerce: true, booking: true } })), { commerce: true, booking: true }, "plus debe poder guardar ambos modulos activos");
assertAccess(resolveUserModuleAccess(activeUser({ plan: "commercial", moduleAccess: { commerce: true, booking: false } })), { commerce: true, booking: false }, "comercial debe respetar modulo guardado");

assert.equal(canUseModule(activeUser({ plan: "trial" }), "commerce"), false, "trial activo inicia sin modulo secundario");
assert.equal(canUseModule(activeUser({ plan: "trial" }), "booking"), true, "trial activo puede usar modulo principal");
assert.equal(canUseModule(activeUser({ plan: "trial", moduleAccess: { commerce: true, booking: true } }), "commerce"), true, "trial puede habilitar el otro modulo");
assert.equal(canUseModule(activeUser({ plan: "basic" }), "commerce"), false, "basico activo no puede usar comercio");
assert.equal(canUseModule(activeUser({ plan: "basic" }), "booking"), false, "basico activo no puede usar agenda");
assert.equal(canUseModule(activeUser({ plan: "commercial", commercialModule: "commerce" }), "commerce"), true, "comercial comercio puede usar comercio");
assert.equal(canUseModule(activeUser({ plan: "commercial", commercialModule: "commerce" }), "booking"), false, "comercial comercio no puede usar agenda");
assert.equal(canUseModule(activeUser({ plan: "commercial", commercialModule: "booking" }), "commerce"), false, "comercial agenda no puede usar comercio");
assert.equal(canUseModule(activeUser({ plan: "commercial", commercialModule: "booking" }), "booking"), true, "comercial agenda puede usar agenda");
assert.equal(canUseModule(activeUser({ plan: "plus" }), "commerce"), false, "plus inicia sin modulo secundario");
assert.equal(canUseModule(activeUser({ plan: "plus" }), "booking"), true, "plus puede usar modulo principal");
assert.equal(canUseModule(activeUser({ plan: "plus", moduleAccess: { commerce: true, booking: true } }), "commerce"), true, "plus puede habilitar el otro modulo");
assert.equal(canUseModule(activeUser({ plan: "plus", status: "suspended" }), "commerce"), false, "suspendido no debe operar modulos");

assert.equal(shouldRestrictToPrimaryModuleOnProfileChange({ plan: "trial" }), true, "trial debe restringirse al modulo principal al cambiar perfil");
assert.equal(shouldRestrictToPrimaryModuleOnProfileChange({ plan: "commercial" }), true, "comercial debe restringirse al modulo principal al cambiar perfil");
assert.equal(shouldRestrictToPrimaryModuleOnProfileChange({ plan: "plus" }), false, "plus puede conservar ambos al cambiar perfil");
assert.equal(shouldRestrictToPrimaryModuleOnProfileChange({ plan: "basic" }), false, "basico no tiene modulos que restringir");

const now = new Date("2026-05-11T00:00:00.000Z");
const currentExpiresAt = new Date("2026-11-10T00:00:00.000Z");
const upgrade = calculateCommercialToPlusUpgrade({
  now,
  currentExpiresAt,
  commercialAnnualPrice: 109900,
  plusAnnualPrice: 169900,
});

assert.equal(upgrade.remainingDays, 183, "upgrade debe contar dias restantes");
assert.equal(upgrade.creditAmount, Math.round((109900 * 183) / 365), "upgrade debe descontar credito de comercial no usado");
assert.equal(upgrade.amountToCharge, 169900 - upgrade.creditAmount, "upgrade debe cobrar plus menos credito");
assert.equal(upgrade.newExpiresAt.toISOString(), "2027-05-11T00:00:00.000Z", "upgrade debe reiniciar vencimiento a un ano");

assert.doesNotThrow(() => assertNoActivePlanDowngrade({
  status: "active",
  currentPlan: "commercial",
  requestedPlan: "plus",
  currentExpiresAt,
  now,
}), "comercial activo debe poder subir a plus");

assert.throws(() => assertNoActivePlanDowngrade({
  status: "active",
  currentPlan: "plus",
  requestedPlan: "commercial",
  currentExpiresAt,
  now,
}), /plan activo superior/, "plus activo no debe poder bajar a comercial");

assert.doesNotThrow(() => assertNoActivePlanDowngrade({
  status: "grace_period",
  currentPlan: "plus",
  requestedPlan: "commercial",
  currentExpiresAt,
  now,
}), "si no esta active, puede escoger otro plan");

assert.doesNotThrow(() => assertNoActivePlanDowngrade({
  status: "active",
  currentPlan: "plus",
  requestedPlan: "commercial",
  currentExpiresAt: new Date("2026-01-01T00:00:00.000Z"),
  now,
}), "si el plan ya vencio, puede escoger otro plan");

console.log("OK: reglas de planes, modulos, limites y upgrade verificadas.");
