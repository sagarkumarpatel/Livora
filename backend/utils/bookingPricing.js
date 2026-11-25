const SERVICE_FEE_RATE = 0.12;
const TAX_RATE = 0.18;
const PENDING_HOLD_MINUTES = 15;

function normalizeUtcDate(input) {
  const raw = typeof input === "string" ? input.slice(0, 10) : new Date(input).toISOString().slice(0, 10);
  const date = new Date(`${raw}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getTodayUtc() {
  const now = new Date();
  return normalizeUtcDate(now.toISOString().slice(0, 10));
}

function calculateNights(checkIn, checkOut) {
  const ms = checkOut.getTime() - checkIn.getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

function calculatePriceBreakdown({ pricePerNight, cleaningFee = 0, nights }) {
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

function activeBookingHoldQuery(listingId, checkIn, checkOut, now = new Date()) {
  return {
    listing: listingId,
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
    $or: [
      { status: { $in: ["Confirmed", "Completed"] } },
      { status: "Pending", expiresAt: { $gt: now } },
    ],
  };
}

function hasBlockedDateOverlap(blockedDates = [], checkIn, checkOut) {
  return blockedDates.some((block) => {
    const start = normalizeUtcDate(block.startDate);
    const end = normalizeUtcDate(block.endDate);
    if (!start || !end) return false;
    return checkIn < end && checkOut > start;
  });
}

module.exports = {
  SERVICE_FEE_RATE,
  TAX_RATE,
  PENDING_HOLD_MINUTES,
  normalizeUtcDate,
  getTodayUtc,
  calculateNights,
  calculatePriceBreakdown,
  activeBookingHoldQuery,
  hasBlockedDateOverlap,
};
