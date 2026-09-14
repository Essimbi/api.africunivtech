require('dotenv').config();
const bcrypt = require('bcryptjs');
const {
  sequelize, User, Address, Category, Product, ProductVariant, ProductImage,
  Order, OrderItem, OrderStatusHistory, Invoice
} = require('../src/models');
const { CATEGORIES, PRODUCTS } = require('./data');
const { generateOrderNumber, generateInvoiceNumber } = require('../src/utils/numberGenerator');
const { computeCartTotals } = require('../src/services/pricingService');

const IMAGE_MAP = {
  laptop: '/assets/products/laptop.svg',
  server: '/assets/products/server.svg',
  camera: '/assets/products/camera.svg',
  switch: '/assets/products/switch.svg',
  ups: '/assets/products/ups.svg',
  cabling: '/assets/products/cabling.svg'
};

async function seed() {
  await sequelize.sync({ force: true });
  console.log('Base de données réinitialisée.');

  const categoryByKey = {};
  for (const cat of CATEGORIES) {
    const { key, ...data } = cat;
    const category = await Category.create(data);
    categoryByKey[key] = category;
  }
  console.log(`${CATEGORIES.length} catégories créées.`);

  const createdProducts = [];
  for (const p of PRODUCTS) {
    const { category, image, variants = [], ...data } = p;
    const product = await Product.create({ ...data, categoryId: categoryByKey[category].id });
    await ProductImage.create({ productId: product.id, url: IMAGE_MAP[image], altText: product.name, position: 0, isPrimary: true });
    for (let i = 0; i < variants.length; i++) {
      await ProductVariant.create({ ...variants[i], productId: product.id, position: i });
    }
    createdProducts.push(product);
  }
  console.log(`${PRODUCTS.length} produits créés.`);

  const adminPasswordHash = await bcrypt.hash('Admin@12345', 10);
  const admin = await User.create({
    email: 'admin@africauniv-tech.com',
    passwordHash: adminPasswordHash,
    firstName: 'Alain',
    lastName: 'Nde',
    phone: '+237 690 12 34 56',
    company: 'Africa Univ Technology Sarl',
    role: 'superadmin'
  });

  const clientPasswordHash = await bcrypt.hash('Client@12345', 10);
  const client = await User.create({
    email: 'client@africauniv-tech.com',
    passwordHash: clientPasswordHash,
    firstName: 'Paul',
    lastName: 'Ngono',
    phone: '+237 699 00 56 78',
    company: 'Synergie Réseaux SARL',
    role: 'client'
  });
  console.log('Comptes admin et client créés.');

  const address = await Address.create({
    userId: client.id,
    label: 'Siège social',
    fullName: 'Ing. Paul Ngono',
    phone: '+237 699 00 56 78',
    line1: 'Boulevard de la Liberté, Akwa',
    line2: 'Immeuble Synergie, 3e étage',
    city: 'Douala',
    region: 'Littoral',
    country: 'Cameroun',
    isDefault: true
  });

  // Demo order history so the "Espace Client" screen has realistic data out of the box.
  const findProduct = (sku) => createdProducts.find((p) => p.sku === sku);
  const demoOrdersSpec = [
    { skus: [{ sku: 'HIK-KIT8-4K-NVR8', qty: 1 }], status: 'shipped', paymentMethod: 'orange_money', daysAgo: 3 },
    { skus: [{ sku: 'HP-EB840G9-I7', qty: 2 }], status: 'completed', paymentMethod: 'bank_transfer', daysAgo: 20 },
    { skus: [{ sku: 'CISCO-CATALYST-24P-POE', qty: 1 }], status: 'completed', paymentMethod: 'mtn_momo', daysAgo: 68 },
    { skus: [{ sku: 'APC-SMARTUPS-1500VA', qty: 1 }], status: 'cancelled', paymentMethod: 'card', daysAgo: 100 }
  ];

  for (const spec of demoOrdersSpec) {
    const lines = spec.skus.map(({ sku, qty }) => {
      const product = findProduct(sku);
      return { productId: product.id, variantId: null, quantity: qty, unitPriceTtc: product.priceTtc, productName: product.name, sku: product.sku };
    });
    const totals = computeCartTotals(lines);
    const createdAt = new Date(Date.now() - spec.daysAgo * 24 * 60 * 60 * 1000);

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      userId: client.id,
      status: spec.status,
      subtotalHt: totals.subtotalHt,
      vatAmount: totals.vatAmount,
      vatRate: totals.vatRate,
      shippingFee: totals.shippingFee,
      totalTtc: totals.totalTtc,
      paymentMethod: spec.paymentMethod,
      paymentStatus: 'paid_simulated',
      shippingAddress: {
        fullName: address.fullName, phone: address.phone, line1: address.line1, line2: address.line2,
        city: address.city, region: address.region, country: address.country
      },
      billingAddress: {
        fullName: address.fullName, phone: address.phone, line1: address.line1, line2: address.line2,
        city: address.city, region: address.region, country: address.country
      },
      createdAt,
      updatedAt: createdAt
    });

    await OrderItem.bulkCreate(lines.map((l) => ({
      orderId: order.id, productId: l.productId, variantId: l.variantId,
      productName: l.productName, sku: l.sku, unitPriceTtc: l.unitPriceTtc,
      quantity: l.quantity, lineTotalTtc: l.unitPriceTtc * l.quantity
    })));

    await OrderStatusHistory.create({ orderId: order.id, status: 'pending', comment: 'Commande créée.', changedByUserId: client.id, createdAt });
    if (spec.status !== 'pending') {
      await OrderStatusHistory.create({ orderId: order.id, status: spec.status, comment: null, changedByUserId: admin.id, createdAt });
    }

    await Invoice.create({ orderId: order.id, invoiceNumber: generateInvoiceNumber(), totalTtc: totals.totalTtc, issuedAt: createdAt });
  }
  console.log(`${demoOrdersSpec.length} commandes de démonstration créées.`);

  console.log('\nSeed terminé avec succès.');
  console.log('--------------------------------------------------');
  console.log('Compte admin  : admin@africauniv-tech.com / Admin@12345');
  console.log('Compte client : client@africauniv-tech.com / Client@12345');
  console.log('--------------------------------------------------');

  await sequelize.close();
}

seed().catch(async (err) => {
  console.error('Erreur lors du seed:', err);
  await sequelize.close();
  process.exit(1);
});
