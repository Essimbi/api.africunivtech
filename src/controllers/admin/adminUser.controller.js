const bcrypt = require('bcryptjs');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const { User } = require('../../models');

const list = asyncHandler(async (req, res) => {
  const admins = await User.findAll({
    where: { role: ['admin', 'superadmin'] },
    attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt'],
    order: [['createdAt', 'ASC']]
  });
  res.json({ success: true, data: admins });
});

const create = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, role } = req.body;
  const existing = await User.findOne({ where: { email: email.toLowerCase() } });
  if (existing) throw new ApiError(409, 'Un compte existe déjà avec cet email.');
  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await User.create({ email: email.toLowerCase(), passwordHash, firstName, lastName, role });
  res.status(201).json({ success: true, data: { id: admin.id, email: admin.email, role: admin.role } });
});

const updateRole = asyncHandler(async (req, res) => {
  const admin = await User.findOne({ where: { id: req.params.id, role: ['admin', 'superadmin'] } });
  if (!admin) throw new ApiError(404, 'Administrateur introuvable.');
  admin.role = req.body.role;
  admin.isActive = req.body.isActive ?? admin.isActive;
  await admin.save();
  res.json({ success: true, data: { id: admin.id, email: admin.email, role: admin.role, isActive: admin.isActive } });
});

module.exports = { list, create, updateRole };
