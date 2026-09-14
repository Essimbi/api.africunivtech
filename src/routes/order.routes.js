const router = require('express').Router();
const Joi = require('joi');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const ctrl = require('../controllers/order.controller');

router.use(authenticate);

router.post('/checkout', validate({
  body: Joi.object({
    addressId: Joi.string().uuid().required(),
    paymentMethod: Joi.string().valid('orange_money', 'mtn_momo', 'card', 'bank_transfer').required(),
    notes: Joi.string().allow('', null)
  })
}), ctrl.checkout);

router.get('/', ctrl.listMine);
router.get('/:id', validate({ params: Joi.object({ id: Joi.string().uuid().required() }) }), ctrl.getOne);
router.get('/:id/invoice', validate({ params: Joi.object({ id: Joi.string().uuid().required() }) }), ctrl.downloadInvoice);

module.exports = router;
