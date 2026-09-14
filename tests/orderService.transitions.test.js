const { assertTransition, STATUS_TRANSITIONS } = require('../src/services/orderService');

describe('orderService - transitions de statut de commande', () => {
  it('autorise le cycle nominal complet', () => {
    const cycle = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed'];
    for (let i = 0; i < cycle.length - 1; i++) {
      expect(() => assertTransition(cycle[i], cycle[i + 1])).not.toThrow();
    }
  });

  it('autorise l\'annulation depuis pending, confirmed ou processing', () => {
    expect(() => assertTransition('pending', 'cancelled')).not.toThrow();
    expect(() => assertTransition('confirmed', 'cancelled')).not.toThrow();
    expect(() => assertTransition('processing', 'cancelled')).not.toThrow();
  });

  it('refuse de sauter des étapes', () => {
    expect(() => assertTransition('pending', 'shipped')).toThrow();
    expect(() => assertTransition('confirmed', 'delivered')).toThrow();
  });

  it('refuse toute transition depuis un état terminal', () => {
    expect(() => assertTransition('completed', 'pending')).toThrow();
    expect(() => assertTransition('cancelled', 'confirmed')).toThrow();
  });

  it('refuse l\'annulation une fois expédiée', () => {
    expect(() => assertTransition('shipped', 'cancelled')).toThrow();
  });

  it('n\'expose que des statuts terminaux sans transition sortante', () => {
    expect(STATUS_TRANSITIONS.completed).toEqual([]);
    expect(STATUS_TRANSITIONS.cancelled).toEqual([]);
  });
});
