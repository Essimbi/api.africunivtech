const ApiError = require('../utils/ApiError');

const validate = (schema) => (req, res, next) => {
  const toValidate = {};
  if (schema.body) toValidate.body = req.body;
  if (schema.query) toValidate.query = req.query;
  if (schema.params) toValidate.params = req.params;

  const errors = [];
  ['body', 'query', 'params'].forEach((key) => {
    if (schema[key]) {
      const { error, value } = schema[key].validate(req[key], { abortEarly: false, stripUnknown: true });
      if (error) {
        errors.push(...error.details.map((d) => d.message));
      } else {
        req[key] = value;
      }
    }
  });

  if (errors.length) {
    return next(new ApiError(422, 'Données invalides.', errors));
  }
  next();
};

module.exports = validate;
