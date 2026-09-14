const router = require('express').Router();
const Joi = require('joi');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const ctrl = require('../controllers/cart.controller');

router.use(authenticate);

router.get('/', ctrl.getCart);

router.post('/items', validate({
  body: Joi.object({
    productId: Joi.string().uuid().required(),
    variantId: Joi.string().uuid().allow(null),
    quantity: Joi.number().integer().min(1).default(1)
  })
}), ctrl.addItem);

router.patch('/items/:itemId', validate({
  params: Joi.object({ itemId: Joi.string().uuid().required() }),
  body: Joi.object({ quantity: Joi.number().integer().min(1).required() })
}), ctrl.updateItem);

router.delete('/items/:itemId', validate({
  params: Joi.object({ itemId: Joi.string().uuid().required() })
}), ctrl.removeItem);

router.delete('/', ctrl.clearCart);

module.exports = router;
