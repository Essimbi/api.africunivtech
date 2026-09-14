const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { Category, Product, sequelize } = require('../models');

const list = asyncHandler(async (req, res) => {
  const categories = await Category.findAll({ order: [['position', 'ASC'], ['name', 'ASC']] });
  const counts = await Product.findAll({
    attributes: ['categoryId', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
    where: { isActive: true },
    group: ['categoryId']
  });
  const countMap = Object.fromEntries(counts.map((c) => [c.categoryId, parseInt(c.get('count'), 10)]));

  res.json({
    success: true,
    data: categories.map((c) => ({ ...c.toJSON(), productCount: countMap[c.id] || 0 }))
  });
});

const getBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ where: { slug: req.params.slug } });
  if (!category) throw new ApiError(404, 'Catégorie introuvable.');
  res.json({ success: true, data: category });
});

module.exports = { list, getBySlug };
