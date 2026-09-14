const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const { sequelize, Product, ProductVariant, ProductImage, Category } = require('../../models');

const includes = [
  { model: Category, as: 'category' },
  { model: ProductImage, as: 'images', separate: true, order: [['position', 'ASC']] },
  { model: ProductVariant, as: 'variants', separate: true, order: [['position', 'ASC']] }
];

const list = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const where = {};
  if (req.query.search) {
    where.name = { [require('sequelize').Op.like]: `%${req.query.search}%` };
  }
  const { rows, count } = await Product.findAndCountAll({
    where, include: includes, order: [['createdAt', 'DESC']], limit, offset: (page - 1) * limit, distinct: true
  });
  res.json({ success: true, data: rows, meta: { total: count, page, limit, totalPages: Math.ceil(count / limit) } });
});

const getOne = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id, { include: includes });
  if (!product) throw new ApiError(404, 'Produit introuvable.');
  res.json({ success: true, data: product });
});

const create = asyncHandler(async (req, res) => {
  const { images = [], variants = [], ...productData } = req.body;
  const result = await sequelize.transaction(async (t) => {
    const product = await Product.create(productData, { transaction: t });
    if (images.length) {
      await ProductImage.bulkCreate(images.map((img, i) => ({ ...img, productId: product.id, position: i })), { transaction: t });
    }
    if (variants.length) {
      await ProductVariant.bulkCreate(variants.map((v, i) => ({ ...v, productId: product.id, position: i })), { transaction: t });
    }
    return product;
  });
  const full = await Product.findByPk(result.id, { include: includes });
  res.status(201).json({ success: true, data: full });
});

const update = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) throw new ApiError(404, 'Produit introuvable.');

  const { images, variants, ...productData } = req.body;

  await sequelize.transaction(async (t) => {
    Object.assign(product, productData);
    await product.save({ transaction: t });

    if (Array.isArray(images)) {
      await ProductImage.destroy({ where: { productId: product.id }, transaction: t });
      if (images.length) {
        await ProductImage.bulkCreate(images.map((img, i) => ({ ...img, productId: product.id, position: i })), { transaction: t });
      }
    }
    if (Array.isArray(variants)) {
      await ProductVariant.destroy({ where: { productId: product.id }, transaction: t });
      if (variants.length) {
        await ProductVariant.bulkCreate(variants.map((v, i) => ({ ...v, productId: product.id, position: i })), { transaction: t });
      }
    }
  });

  const full = await Product.findByPk(product.id, { include: includes });
  res.json({ success: true, data: full });
});

const remove = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) throw new ApiError(404, 'Produit introuvable.');
  product.isActive = false;
  await product.save();
  res.json({ success: true, message: 'Produit désactivé.' });
});

const adjustStock = asyncHandler(async (req, res) => {
  const { delta } = req.body;
  const product = await Product.findByPk(req.params.id);
  if (!product) throw new ApiError(404, 'Produit introuvable.');
  product.stock = Math.max(0, product.stock + delta);
  await product.save();
  res.json({ success: true, data: product });
});

module.exports = { list, getOne, create, update, remove, adjustStock };
