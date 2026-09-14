const env = require('../config/env');

/**
 * All product prices are stored TTC (tax included), which is what the storefront displays.
 * HT is derived for invoicing/display purposes only.
 */
function ttcToHt(amountTtc, vatRate = env.business.vatRate) {
  return amountTtc / (1 + vatRate);
}

function computeCartTotals(lines, vatRate = env.business.vatRate) {
  const totalTtc = lines.reduce((sum, l) => sum + l.unitPriceTtc * l.quantity, 0);
  const subtotalHt = ttcToHt(totalTtc, vatRate);
  const vatAmount = totalTtc - subtotalHt;
  const shippingFee = totalTtc >= env.business.freeShippingThreshold ? 0 : env.business.defaultShippingFee;
  const grandTotalTtc = totalTtc + shippingFee;

  return {
    subtotalHt: round2(subtotalHt),
    vatAmount: round2(vatAmount),
    vatRate,
    itemsTotalTtc: round2(totalTtc),
    shippingFee: round2(shippingFee),
    totalTtc: round2(grandTotalTtc)
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

module.exports = { ttcToHt, computeCartTotals, round2 };
