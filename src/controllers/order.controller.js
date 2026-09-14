const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { Order, OrderItem, OrderStatusHistory, Invoice, User } = require('../models');
const orderService = require('../services/orderService');
const { streamInvoicePdf } = require('../services/invoiceService');

const checkout = asyncHandler(async (req, res) => {
  const orderId = await orderService.createOrderFromCart(req.user.id, req.body);
  const order = await Order.findByPk(orderId, {
    include: [{ model: OrderItem, as: 'items' }, { model: OrderStatusHistory, as: 'statusHistory' }]
  });
  res.status(201).json({ success: true, data: order });
});

const listMine = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const { rows, count } = await Order.findAndCountAll({
    where: { userId: req.user.id },
    include: [{ model: OrderItem, as: 'items' }],
    order: [['createdAt', 'DESC']],
    limit,
    offset: (page - 1) * limit
  });
  res.json({ success: true, data: rows, meta: { total: count, page, limit, totalPages: Math.ceil(count / limit) } });
});

const getOne = asyncHandler(async (req, res) => {
  const where = { id: req.params.id };
  if (req.user.role === 'client') where.userId = req.user.id;
  const order = await Order.findOne({
    where,
    include: [
      { model: OrderItem, as: 'items' },
      { model: OrderStatusHistory, as: 'statusHistory', order: [['createdAt', 'ASC']] },
      { model: Invoice, as: 'invoice' }
    ]
  });
  if (!order) throw new ApiError(404, 'Commande introuvable.');
  res.json({ success: true, data: order });
});

const downloadInvoice = asyncHandler(async (req, res) => {
  const where = { id: req.params.id };
  if (req.user.role === 'client') where.userId = req.user.id;
  const order = await Order.findOne({ where, include: [{ model: OrderItem, as: 'items' }, { model: Invoice, as: 'invoice' }] });
  if (!order || !order.invoice) throw new ApiError(404, 'Facture introuvable.');
  const user = await User.findByPk(order.userId);
  streamInvoicePdf(res, { order, invoice: order.invoice, items: order.items, user });
});

module.exports = { checkout, listMine, getOne, downloadInvoice };
