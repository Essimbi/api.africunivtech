const router = require('express').Router();
const Joi = require('joi');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const ctrl = require('../controllers/address.controller');

router.use(authenticate);

const addressBody = Joi.object({
  label: Joi.string().allow('', null),
  fullName: Joi.string().required(),
  phone: Joi.string().required(),
  line1: Joi.string().required(),
  line2: Joi.string().allow('', null),
  city: Joi.string().required(),
  region: Joi.string().allow('', null),
  country: Joi.string().allow('', null),
  isDefault: Joi.boolean()
});

router.get('/', ctrl.list);
router.post('/', validate({ body: addressBody }), ctrl.create);
router.patch('/:id', validate({ params: Joi.object({ id: Joi.string().uuid().required() }), body: addressBody.fork(Object.keys(addressBody.describe().keys), (s) => s.optional()) }), ctrl.update);
router.delete('/:id', validate({ params: Joi.object({ id: Joi.string().uuid().required() }) }), ctrl.remove);

module.exports = router;
