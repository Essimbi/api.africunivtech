const { Op } = require('sequelize');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const { Order, OrderItem, OrderStatusHistory, Invoice, User } = require('../../models');
const orderService = require('../../services/orderService');
const { streamInvoicePdf } = require('../../services/invoiceService');

const list = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 15));
  const where = {};
  if (req.query.status) where.status = req.query.status;
  if (req.query.search) {
    where[Op.or] = [{ orderNumber: { [Op.like]: `%${req.query.search}%` } }];
  }

  const { rows, count } = await Order.findAndCountAll({
    where,
    include: [{ model: OrderItem, as: 'items' }, { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'company'] }],
    order: [['createdAt', 'DESC']],
    limit,
    offset: (page - 1) * limit
  });

  res.json({ success: true, data: rows, meta: { total: count, page, limit, totalPages: Math.ceil(count / limit) } });
});

const getOne = asyncHandler(async (req, res) => {
  const order = await Order.findByPk(req.params.id, {
    include: [
      { model: OrderItem, as: 'items' },
      { model: OrderStatusHistory, as: 'statusHistory', order: [['createdAt', 'ASC']] },
      { model: Invoice, as: 'invoice' },
      { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'company', 'phone'] }
    ]
  });
  if (!order) throw new ApiError(404, 'Commande introuvable.');
  res.json({ success: true, data: order });
});

const updateStatus = asyncHandler(async (req, res) => {
  const { status, comment } = req.body;
  const order = await orderService.updateStatus(req.params.id, status, { comment, changedByUserId: req.user.id });
  res.json({ success: true, data: order });
});

const downloadInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findByPk(req.params.id, { include: [{ model: OrderItem, as: 'items' }, { model: Invoice, as: 'invoice' }] });
  if (!order || !order.invoice) throw new ApiError(404, 'Facture introuvable.');
  const user = await User.findByPk(order.userId);
  streamInvoicePdf(res, { order, invoice: order.invoice, items: order.items, user });
});

module.exports = { list, getOne, updateStatus, downloadInvoice };
