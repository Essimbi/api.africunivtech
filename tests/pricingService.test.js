const { computeCartTotals, ttcToHt } = require('../src/services/pricingService');

describe('pricingService.computeCartTotals', () => {
  const vatRate = 0.1925;

  it('calcule correctement sous-total HT, TVA et total TTC pour une seule ligne', () => {
    const lines = [{ unitPriceTtc: 100000, quantity: 1 }];
    const totals = computeCartTotals(lines, vatRate);

    expect(totals.totalTtc).toBeGreaterThan(0);
    expect(totals.subtotalHt).toBeCloseTo(ttcToHt(100000, vatRate), 1);
    expect(totals.vatAmount).toBeCloseTo(100000 - ttcToHt(100000, vatRate), 1);
  });

  it('additionne plusieurs lignes avec des quantités différentes', () => {
    const lines = [
      { unitPriceTtc: 50000, quantity: 2 },
      { unitPriceTtc: 30000, quantity: 3 }
    ];
    const totals = computeCartTotals(lines, vatRate);
    const expectedItemsTotal = 50000 * 2 + 30000 * 3;

    expect(totals.itemsTotalTtc).toBeCloseTo(expectedItemsTotal, 1);
  });

  it('applique les frais de livraison par défaut sous le seuil de gratuité', () => {
    const lines = [{ unitPriceTtc: 10000, quantity: 1 }];
    const totals = computeCartTotals(lines, vatRate);

    expect(totals.shippingFee).toBeGreaterThan(0);
    expect(totals.totalTtc).toBeCloseTo(totals.itemsTotalTtc + totals.shippingFee, 1);
  });

  it('offre la livraison gratuite au-delà du seuil configuré', () => {
    const lines = [{ unitPriceTtc: 600000, quantity: 1 }];
    const totals = computeCartTotals(lines, vatRate);

    expect(totals.shippingFee).toBe(0);
    expect(totals.totalTtc).toBeCloseTo(totals.itemsTotalTtc, 1);
  });

  it('retourne des totaux nuls pour un panier vide', () => {
    const totals = computeCartTotals([], vatRate);
    expect(totals.itemsTotalTtc).toBe(0);
    expect(totals.subtotalHt).toBe(0);
    expect(totals.vatAmount).toBe(0);
  });
});
