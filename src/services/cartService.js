const ApiError = require('../utils/ApiError');
const { sequelize, Cart, CartItem, Product, ProductVariant, ProductImage } = require('../models');
const stockService = require('./stockService');
const { computeCartTotals } = require('./pricingService');

const itemIncludes = [
  {
    model: Product,
    as: 'product',
    include: [{ model: ProductImage, as: 'images', separate: true, order: [['position', 'ASC']] }]
  },
  { model: ProductVariant, as: 'variant' }
];

async function getOrCreateCart(userId) {
  const [cart] = await Cart.findOrCreate({ where: { userId, status: 'active' } });
  return cart;
}

function lineUnitPrice(product, variant) {
  return product.priceTtc + (variant ? variant.priceDeltaTtc : 0);
}

async function serializeCart(cart) {
  const items = await CartItem.findAll({ where: { cartId: cart.id }, include: itemIncludes, order: [['createdAt', 'ASC']] });

  const lines = items.map((item) => {
    const unitPriceTtc = lineUnitPrice(item.product, item.variant);
    return {
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      unitPriceTtc,
      lineTotalTtc: unitPriceTtc * item.quantity,
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        sku: item.product.sku,
        stock: item.variant ? item.variant.stock : item.product.stock,
        image: item.product.images?.[0]?.url || null
      },
      variant: item.variant ? { id: item.variant.id, name: item.variant.name, stock: item.variant.stock } : null
    };
  });

  const totals = computeCartTotals(lines);
  return { id: cart.id, items: lines, totals };
}

async function addItem(userId, { productId, variantId = null, quantity = 1 }) {
  if (quantity < 1) throw new ApiError(422, 'La quantité doit être supérieure à 0.');

  const product = await Product.findByPk(productId);
  if (!product || !product.isActive) throw new ApiError(404, 'Produit introuvable.');

  if (variantId) {
    const variant = await ProductVariant.findOne({ where: { id: variantId, productId } });
    if (!variant) throw new ApiError(404, 'Variante produit introuvable.');
  }

  const cart = await getOrCreateCart(userId);
  const existing = await CartItem.findOne({ where: { cartId: cart.id, productId, variantId } });

  const targetQuantity = (existing ? existing.quantity : 0) + quantity;
  await stockService.assertAvailable(productId, variantId, targetQuantity);

  if (existing) {
    existing.quantity = targetQuantity;
    await existing.save();
  } else {
    await CartItem.create({ cartId: cart.id, productId, variantId, quantity });
  }

  return serializeCart(cart);
}

async function updateItemQuantity(userId, itemId, quantity) {
  if (quantity < 1) throw new ApiError(422, 'La quantité doit être supérieure à 0.');
  const cart = await getOrCreateCart(userId);
  const item = await CartItem.findOne({ where: { id: itemId, cartId: cart.id } });
  if (!item) throw new ApiError(404, 'Article du panier introuvable.');

  await stockService.assertAvailable(item.productId, item.variantId, quantity);
  item.quantity = quantity;
  await item.save();
  return serializeCart(cart);
}

async function removeItem(userId, itemId) {
  const cart = await getOrCreateCart(userId);
  await CartItem.destroy({ where: { id: itemId, cartId: cart.id } });
  return serializeCart(cart);
}

async function clearCart(userId) {
  const cart = await getOrCreateCart(userId);
  await CartItem.destroy({ where: { cartId: cart.id } });
  return serializeCart(cart);
}

async function getCart(userId) {
  const cart = await getOrCreateCart(userId);
  return serializeCart(cart);
}

module.exports = { getCart, addItem, updateItemQuantity, removeItem, clearCart, getOrCreateCart, serializeCart };
