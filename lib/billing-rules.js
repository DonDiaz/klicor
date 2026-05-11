const DAY_MS = 1000 * 60 * 60 * 24;

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
