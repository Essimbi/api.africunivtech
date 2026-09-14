const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const { Category } = require('../../models');

const create = asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json({ success: true, data: category });
});

const update = asyncHandler(async (req, res) => {
  const category = await Category.findByPk(req.params.id);
  if (!category) throw new ApiError(404, 'Catégorie introuvable.');
  Object.assign(category, req.body);
  await category.save();
  res.json({ success: true, data: category });
});

const remove = asyncHandler(async (req, res) => {
  const deleted = await Category.destroy({ where: { id: req.params.id } });
  if (!deleted) throw new ApiError(404, 'Catégorie introuvable.');
  res.json({ success: true, message: 'Catégorie supprimée.' });
});

module.exports = { create, update, remove };
