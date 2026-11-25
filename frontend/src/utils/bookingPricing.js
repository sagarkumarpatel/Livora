export const SERVICE_FEE_RATE = 0.12;
export const TAX_RATE = 0.18;

export function getTodayDateInput() {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysDateInput(dateStr, days) {
  const base = new Date(`${dateStr}T00:00:00.000Z`);
  if (Number.isNaN(base.getTime())) return "";
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

export function calculateNights(checkInStr, checkOutStr) {
  if (!checkInStr || !checkOutStr) return 0;
  const start = new Date(`${checkInStr}T00:00:00.000Z`);
  const end = new Date(`${checkOutStr}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  const diff = Math.round((end.getTime() - start.getTime()) / 86400000);
  return diff > 0 ? diff : 0;
}

export function calculatePriceBreakdown({ pricePerNight, cleaningFee = 0, nights }) {
  const nightPrice = Number(pricePerNight) || 0;
  const clean = Number(cleaningFee) || 0;
  const baseAmount = Math.round(nightPrice * nights);
  const serviceFee = Math.round(baseAmount * SERVICE_FEE_RATE);
  const taxes = Math.round((baseAmount + clean + serviceFee) * TAX_RATE);
  const totalAmount = baseAmount + clean + serviceFee + taxes;

  return {
    pricePerNight: nightPrice,
    nights,
    baseAmount,
    cleaningFee: clean,
    serviceFee,
    taxes,
    totalAmount,
  };
}

export function hasUnavailableOverlap(unavailableRanges = [], checkInStr, checkOutStr) {
  if (!checkInStr || !checkOutStr) return false;
  const start = new Date(`${checkInStr}T00:00:00.000Z`);
  const end = new Date(`${checkOutStr}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;

  return unavailableRanges.some((range) => {
    const rStart = new Date(`${String(range.startDate).slice(0, 10)}T00:00:00.000Z`);
    const rEnd = new Date(`${String(range.endDate).slice(0, 10)}T00:00:00.000Z`);
    return start < rEnd && end > rStart;
  });
}
