const { Op, fn, col, literal } = require('sequelize');
const asyncHandler = require('../../utils/asyncHandler');
const { Order, OrderItem, Product, User, sequelize } = require('../../models');

const startOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

const kpis = asyncHandler(async (req, res) => {
  const since = startOfMonth();

  const revenueThisMonth = await Order.sum('totalTtc', {
    where: { createdAt: { [Op.gte]: since }, status: { [Op.ne]: 'cancelled' } }
  }) || 0;

  const pendingOrders = await Order.count({ where: { status: ['pending', 'confirmed'] } });
  const criticalStock = await Product.count({
    where: { isActive: true, stock: { [Op.lte]: sequelize.col('stock_alert_threshold') } }
  });
  const newCustomersThisMonth = await User.count({ where: { role: 'client', createdAt: { [Op.gte]: since } } });

  const statusBreakdown = await Order.findAll({
    attributes: ['status', [fn('COUNT', col('id')), 'count']],
    group: ['status']
  });

  res.json({
    success: true,
    data: {
      revenueThisMonth,
      pendingOrders,
      criticalStock,
      newCustomersThisMonth,
      statusBreakdown: statusBreakdown.map((s) => ({ status: s.status, count: parseInt(s.get('count'), 10) }))
    }
  });
});

module.exports = { kpis };
