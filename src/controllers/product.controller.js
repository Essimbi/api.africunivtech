const { Op } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { Product, Category, ProductVariant, ProductImage, sequelize } = require('../models');

const includes = [
  { model: Category, as: 'category' },
  { model: ProductImage, as: 'images', separate: true, order: [['position', 'ASC']] },
  { model: ProductVariant, as: 'variants', separate: true, order: [['position', 'ASC']] }
];

const SORT_MAP = {
  popularity: [['ratingCount', 'DESC']],
  price_asc: [['priceTtc', 'ASC']],
  price_desc: [['priceTtc', 'DESC']],
  newest: [['createdAt', 'DESC']]
};

const list = asyncHandler(async (req, res) => {
  const {
    category, brand, minPrice, maxPrice, availability, search,
    sort = 'popularity', page = 1, limit = 12, featured, isNew
  } = req.query;

  const where = { isActive: true };

  if (category) {
    const cat = await Category.findOne({ where: { slug: category } });
    if (cat) where.categoryId = cat.id;
    else where.categoryId = '___none___';
  }
  if (brand) {
    const brands = Array.isArray(brand) ? brand : String(brand).split(',');
    where.brand = { [Op.in]: brands };
  }
  if (availability) {
    const list = Array.isArray(availability) ? availability : String(availability).split(',');
    where.availability = { [Op.in]: list };
  }
  if (minPrice || maxPrice) {
    where.priceTtc = {};
    if (minPrice) where.priceTtc[Op.gte] = parseFloat(minPrice);
    if (maxPrice) where.priceTtc[Op.lte] = parseFloat(maxPrice);
  }
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { shortDescription: { [Op.like]: `%${search}%` } },
      { brand: { [Op.like]: `%${search}%` } }
    ];
  }
  if (featured === 'true') where.isFeatured = true;
  if (isNew === 'true') where.isNew = true;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(48, Math.max(1, parseInt(limit, 10) || 12));

  const { rows, count } = await Product.findAndCountAll({
    where,
    include: includes,
    order: SORT_MAP[sort] || SORT_MAP.popularity,
    limit: limitNum,
    offset: (pageNum - 1) * limitNum,
    distinct: true
  });

  res.json({
    success: true,
    data: rows,
    meta: { total: count, page: pageNum, limit: limitNum, totalPages: Math.ceil(count / limitNum) }
  });
});

const facets = asyncHandler(async (req, res) => {
  const products = await Product.findAll({ where: { isActive: true }, attributes: ['brand', 'priceTtc', 'availability'] });
  const brands = [...new Set(products.map((p) => p.brand))].sort();
  const prices = products.map((p) => p.priceTtc);
  res.json({
    success: true,
    data: {
      brands,
      minPrice: prices.length ? Math.min(...prices) : 0,
      maxPrice: prices.length ? Math.max(...prices) : 0,
      availability: ['in_stock', 'on_order', 'incoming']
    }
  });
});

const getBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ where: { slug: req.params.slug, isActive: true }, include: includes });
  if (!product) throw new ApiError(404, 'Produit introuvable.');
  res.json({ success: true, data: product });
});

const related = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) throw new ApiError(404, 'Produit introuvable.');
  const items = await Product.findAll({
    where: { categoryId: product.categoryId, id: { [Op.ne]: product.id }, isActive: true },
    include: includes,
    limit: 8
  });
  res.json({ success: true, data: items });
});

module.exports = { list, facets, getBySlug, related };
