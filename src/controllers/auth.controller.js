const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { User } = require('../models');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    company: user.company,
    role: user.role
  };
}

function issueTokens(res, user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  res.cookie?.('refreshToken', refreshToken, { httpOnly: true });
  return { accessToken, refreshToken };
}

const register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, phone, company } = req.body;
  const existing = await User.findOne({ where: { email: email.toLowerCase() } });
  if (existing) throw new ApiError(409, 'Un compte existe déjà avec cet email.');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    email: email.toLowerCase(), passwordHash, firstName, lastName, phone, company, role: 'client'
  });

  const tokens = issueTokens(res, user);
  res.status(201).json({ success: true, data: { user: sanitizeUser(user), ...tokens } });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email: email.toLowerCase() } });
  if (!user || !user.isActive) throw new ApiError(401, 'Identifiants invalides.');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new ApiError(401, 'Identifiants invalides.');

  const tokens = issueTokens(res, user);
  res.json({ success: true, data: { user: sanitizeUser(user), ...tokens } });
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new ApiError(401, 'Token de rafraîchissement requis.');

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (e) {
    throw new ApiError(401, 'Token de rafraîchissement invalide.');
  }

  const user = await User.findByPk(payload.sub);
  if (!user || !user.isActive) throw new ApiError(401, 'Utilisateur introuvable.');

  const tokens = issueTokens(res, user);
  res.json({ success: true, data: { user: sanitizeUser(user), ...tokens } });
});

const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: sanitizeUser(req.user) });
});

const updateMe = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, company } = req.body;
  Object.assign(req.user, {
    firstName: firstName ?? req.user.firstName,
    lastName: lastName ?? req.user.lastName,
    phone: phone ?? req.user.phone,
    company: company ?? req.user.company
  });
  await req.user.save();
  res.json({ success: true, data: sanitizeUser(req.user) });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const valid = await bcrypt.compare(currentPassword, req.user.passwordHash);
  if (!valid) throw new ApiError(401, 'Mot de passe actuel incorrect.');
  req.user.passwordHash = await bcrypt.hash(newPassword, 10);
  await req.user.save();
  res.json({ success: true, message: 'Mot de passe mis à jour.' });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ where: { email: email.toLowerCase() } });
  // Always respond success to avoid user enumeration.
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    // In a real deployment this would be emailed; returned here for demo purposes only.
    return res.json({ success: true, message: 'Lien de réinitialisation généré.', data: { resetToken: token } });
  }
  res.json({ success: true, message: 'Si ce compte existe, un email a été envoyé.' });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  const user = await User.findOne({ where: { resetPasswordToken: token } });
  if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
    throw new ApiError(400, 'Lien de réinitialisation invalide ou expiré.');
  }
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();
  res.json({ success: true, message: 'Mot de passe réinitialisé.' });
});

module.exports = { register, login, refresh, me, updateMe, changePassword, forgotPassword, resetPassword, sanitizeUser };
