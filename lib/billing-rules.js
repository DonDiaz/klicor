const DAY_MS = 1000 * 60 * 60 * 24;
const PLAN_RANK = {
  basic: 1,
  commercial: 2,
  plus: 3,
  pro: 4,
};

export function isActivePaidPlan({ status = "", currentPlan = "", currentExpiresAt = null, now = new Date() } = {}) {
  if (status !== "active") return false;
  if (!PLAN_RANK[currentPlan]) return false;
  return Boolean(currentExpiresAt && currentExpiresAt > now);
}

export function isPlanDowngrade({ currentPlan = "", requestedPlan = "" } = {}) {
  const currentRank = PLAN_RANK[currentPlan] || 0;
  const requestedRank = PLAN_RANK[requestedPlan] || 0;
  return Boolean(currentRank && requestedRank && requestedRank < currentRank);
}

export function assertNoActivePlanDowngrade({
  status = "",
  currentPlan = "",
  requestedPlan = "",
  currentExpiresAt = null,
  now = new Date(),
} = {}) {
  if (!isActivePaidPlan({ status, currentPlan, currentExpiresAt, now })) return;
  if (!isPlanDowngrade({ currentPlan, requestedPlan })) return;

  throw new Error("Tienes un plan activo superior. Para bajar de plan debes esperar a que venza el plan actual o solicitar ajuste manual.");
}

export function daysBetween(start, end) {
  if (!start || !end || end <= start) return 0;
  return Math.ceil((end.getTime() - start.getTime()) / DAY_MS);
}

export function addOneYear(date = new Date()) {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + 1);
  return next;
}

export function calculateCommercialToPlusUpgrade({
  now = new Date(),
  currentExpiresAt = null,
  commercialAnnualPrice = 0,
  plusAnnualPrice = 0,
} = {}) {
  const remainingDays = daysBetween(now, currentExpiresAt);
  const creditAmount = Math.min(
    Number(plusAnnualPrice || 0),
    Math.max(0, Math.round((Number(commercialAnnualPrice || 0) * remainingDays) / 365)),
  );
  const amountToCharge = Math.max(0, Number(plusAnnualPrice || 0) - creditAmount);
  const newExpiresAt = addOneYear(now);

  return {
    remainingDays,
    creditAmount,
    amountToCharge,
    newExpiresAt,
  };
}
