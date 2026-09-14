const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { Address, sequelize } = require('../models');

const list = asyncHandler(async (req, res) => {
  const addresses = await Address.findAll({ where: { userId: req.user.id }, order: [['isDefault', 'DESC'], ['createdAt', 'DESC']] });
  res.json({ success: true, data: addresses });
});

const create = asyncHandler(async (req, res) => {
  const data = { ...req.body, userId: req.user.id };
  const result = await sequelize.transaction(async (t) => {
    if (data.isDefault) {
      await Address.update({ isDefault: false }, { where: { userId: req.user.id }, transaction: t });
    }
    return Address.create(data, { transaction: t });
  });
  res.status(201).json({ success: true, data: result });
});

const update = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!address) throw new ApiError(404, 'Adresse introuvable.');

  await sequelize.transaction(async (t) => {
    if (req.body.isDefault) {
      await Address.update({ isDefault: false }, { where: { userId: req.user.id }, transaction: t });
    }
    Object.assign(address, req.body);
    await address.save({ transaction: t });
  });

  res.json({ success: true, data: address });
});

const remove = asyncHandler(async (req, res) => {
  const deleted = await Address.destroy({ where: { id: req.params.id, userId: req.user.id } });
  if (!deleted) throw new ApiError(404, 'Adresse introuvable.');
  res.json({ success: true, message: 'Adresse supprimée.' });
});

module.exports = { list, create, update, remove };
