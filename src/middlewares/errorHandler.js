const ApiError = require('../utils/ApiError');

const notFound = (req, res, next) => {
  next(new ApiError(404, `Route non trouvée: ${req.method} ${req.originalUrl}`));
};

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Erreur interne du serveur.';
  let details = err.details || null;

  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = 'Une ressource avec ces informations existe déjà.';
    details = err.errors?.map((e) => e.message);
  } else if (err.name === 'SequelizeValidationError') {
    statusCode = 422;
    details = err.errors?.map((e) => e.message);
  }

  if (statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    details
  });
};

module.exports = { notFound, errorHandler };
