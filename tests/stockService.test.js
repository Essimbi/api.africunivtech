process.env.DATABASE_PATH = ':memory:';
process.env.NODE_ENV = 'test';

const { sequelize, Category, Product } = require('../src/models');
const stockService = require('../src/services/stockService');

let category;
let product;

beforeAll(async () => {
  await sequelize.sync({ force: true });
  category = await Category.create({ name: 'Réseau', slug: 'reseau' });
});

beforeEach(async () => {
  product = await Product.create({
    categoryId: category.id,
    sku: `SKU-${Date.now()}-${Math.random()}`,
    name: 'Switch Test 24 Ports',
    slug: `switch-test-${Date.now()}-${Math.random()}`,
    brand: 'Cisco Systems',
    priceHt: 100000,
    priceTtc: 119250,
    stock: 10,
    stockAlertThreshold: 3
  });
});

afterAll(async () => {
  await sequelize.close();
});

describe('stockService - gestion du stock', () => {
  it('décrémente le stock du produit lors d\'une vente', async () => {
    await stockService.decrementStock(product.id, null, 4);
    await product.reload();
    expect(product.stock).toBe(6);
  });

  it('refuse de décrémenter au-delà du stock disponible', async () => {
    await expect(stockService.decrementStock(product.id, null, 999)).rejects.toThrow(/Stock insuffisant/);
    await product.reload();
    expect(product.stock).toBe(10);
  });

  it('réapprovisionne le stock lors d\'une annulation de commande', async () => {
    await stockService.decrementStock(product.id, null, 5);
    await stockService.restockItem(product.id, null, 5);
    await product.reload();
    expect(product.stock).toBe(10);
  });

  it('vérifie la disponibilité sans modifier le stock', async () => {
    await expect(stockService.assertAvailable(product.id, null, 10)).resolves.toBeUndefined();
    await expect(stockService.assertAvailable(product.id, null, 11)).rejects.toThrow(/Stock insuffisant/);
    await product.reload();
    expect(product.stock).toBe(10);
  });
});
