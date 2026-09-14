const ApiError = require('../utils/ApiError');
const {
  sequelize, Order, OrderItem, OrderStatusHistory, Invoice,
  Cart, CartItem, Product, ProductVariant, Address
} = require('../models');
const cartService = require('./cartService');
const stockService = require('./stockService');
const { computeCartTotals } = require('./pricingService');
const { generateOrderNumber, generateInvoiceNumber } = require('../utils/numberGenerator');

const STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['completed'],
  completed: [],
  cancelled: []
};

const RESTOCKABLE_FROM = ['pending', 'confirmed', 'processing'];

function assertTransition(current, next) {
  const allowed = STATUS_TRANSITIONS[current] || [];
  if (!allowed.includes(next)) {
    throw new ApiError(422, `Transition de statut invalide: ${current} -> ${next}.`);
  }
}

function addressToSnapshot(address) {
  return {
    fullName: address.fullName,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2 || null,
    city: address.city,
    region: address.region || null,
    country: address.country
  };
}

async function createOrderFromCart(userId, { addressId, paymentMethod, notes }) {
  const address = await Address.findOne({ where: { id: addressId, userId } });
  if (!address) throw new ApiError(404, 'Adresse de livraison introuvable.');

  const cart = await cartService.getOrCreateCart(userId);
  const cartItems = await CartItem.findAll({
    where: { cartId: cart.id },
    include: [{ model: Product, as: 'product' }, { model: ProductVariant, as: 'variant' }]
  });

  if (!cartItems.length) throw new ApiError(422, 'Le panier est vide.');

  const lines = cartItems.map((item) => ({
    productId: item.productId,
    variantId: item.variantId,
    quantity: item.quantity,
    unitPriceTtc: item.product.priceTtc + (item.variant ? item.variant.priceDeltaTtc : 0),
    productName: item.product.name,
    variantName: item.variant ? item.variant.name : null,
    sku: item.variant ? item.variant.sku : item.product.sku
  }));

  const totals = computeCartTotals(lines);

  return sequelize.transaction(async (t) => {
    for (const line of lines) {
      await stockService.decrementStock(line.productId, line.variantId, line.quantity, t);
    }

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      userId,
      status: 'pending',
      subtotalHt: totals.subtotalHt,
      vatAmount: totals.vatAmount,
      vatRate: totals.vatRate,
      shippingFee: totals.shippingFee,
      totalTtc: totals.totalTtc,
      paymentMethod,
      paymentStatus: 'paid_simulated',
      shippingAddress: addressToSnapshot(address),
      billingAddress: addressToSnapshot(address),
      notes: notes || null
    }, { transaction: t });

    await OrderItem.bulkCreate(lines.map((l) => ({
      orderId: order.id,
      productId: l.productId,
      variantId: l.variantId,
      productName: l.productName,
      variantName: l.variantName,
      sku: l.sku,
      unitPriceTtc: l.unitPriceTtc,
      quantity: l.quantity,
      lineTotalTtc: l.unitPriceTtc * l.quantity
    })), { transaction: t });

    await OrderStatusHistory.create({
      orderId: order.id,
      status: 'pending',
      comment: 'Commande créée, paiement simulé confirmé.',
      changedByUserId: userId
    }, { transaction: t });

    await Invoice.create({
      orderId: order.id,
      invoiceNumber: generateInvoiceNumber(),
      totalTtc: totals.totalTtc
    }, { transaction: t });

    await CartItem.destroy({ where: { cartId: cart.id }, transaction: t });

    return order.id;
  });
}

async function updateStatus(orderId, newStatus, { comment, changedByUserId } = {}) {
  return sequelize.transaction(async (t) => {
    const order = await Order.findByPk(orderId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!order) throw new ApiError(404, 'Commande introuvable.');

    assertTransition(order.status, newStatus);

    if (newStatus === 'cancelled' && RESTOCKABLE_FROM.includes(order.status)) {
      const items = await OrderItem.findAll({ where: { orderId }, transaction: t });
      for (const item of items) {
        await stockService.restockItem(item.productId, item.variantId, item.quantity, t);
      }
    }

    order.status = newStatus;
    await order.save({ transaction: t });

    await OrderStatusHistory.create({
      orderId,
      status: newStatus,
      comment: comment || null,
      changedByUserId: changedByUserId || null
    }, { transaction: t });

    return order;
  });
}

module.exports = { createOrderFromCart, updateStatus, STATUS_TRANSITIONS, assertTransition };
