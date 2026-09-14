const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/jwt');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new ApiError(401, 'Authentification requise.');
    }
    const payload = verifyAccessToken(token);
    const user = await User.findByPk(payload.sub);
    if (!user || !user.isActive) {
      throw new ApiError(401, 'Utilisateur introuvable ou désactivé.');
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'Session invalide ou expirée.'));
    }
    next(err);
  }
};

const optionalAuthenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme === 'Bearer' && token) {
      const payload = verifyAccessToken(token);
      const user = await User.findByPk(payload.sub);
      if (user && user.isActive) req.user = user;
    }
    next();
  } catch (err) {
    next();
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, 'Accès refusé.'));
  }
  next();
};

module.exports = { authenticate, optionalAuthenticate, requireRole };
