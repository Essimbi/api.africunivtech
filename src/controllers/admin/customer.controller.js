const { Op } = require('sequelize');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const { User, Order, Address, sequelize } = require('../../models');

const list = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 15));
  const where = { role: 'client' };
  if (req.query.search) {
    where[Op.or] = [
      { firstName: { [Op.like]: `%${req.query.search}%` } },
      { lastName: { [Op.like]: `%${req.query.search}%` } },
      { email: { [Op.like]: `%${req.query.search}%` } },
      { company: { [Op.like]: `%${req.query.search}%` } }
    ];
  }
  const { rows, count } = await User.findAndCountAll({
    where,
    attributes: ['id', 'email', 'firstName', 'lastName', 'phone', 'company', 'isActive', 'createdAt'],
    order: [['createdAt', 'DESC']],
    limit,
    offset: (page - 1) * limit
  });
  res.json({ success: true, data: rows, meta: { total: count, page, limit, totalPages: Math.ceil(count / limit) } });
});

const getOne = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    where: { id: req.params.id, role: 'client' },
    attributes: ['id', 'email', 'firstName', 'lastName', 'phone', 'company', 'isActive', 'createdAt'],
    include: [{ model: Address, as: 'addresses' }]
  });
  if (!user) throw new ApiError(404, 'Client introuvable.');
  const orders = await Order.findAll({ where: { userId: user.id }, order: [['createdAt', 'DESC']] });
  res.json({ success: true, data: { ...user.toJSON(), orders } });
});

const setActive = asyncHandler(async (req, res) => {
  const user = await User.findOne({ where: { id: req.params.id, role: 'client' } });
  if (!user) throw new ApiError(404, 'Client introuvable.');
  user.isActive = req.body.isActive;
  await user.save();
  res.json({ success: true, data: user });
});

module.exports = { list, getOne, setActive };
