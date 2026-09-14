const router = require('express').Router();
const Joi = require('joi');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const ctrl = require('../controllers/auth.controller');

router.post('/register', validate({
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().min(2).required(),
    lastName: Joi.string().min(2).required(),
    phone: Joi.string().allow('', null),
    company: Joi.string().allow('', null)
  })
}), ctrl.register);

router.post('/login', validate({
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  })
}), ctrl.login);

router.post('/refresh', validate({
  body: Joi.object({ refreshToken: Joi.string().required() })
}), ctrl.refresh);

router.post('/forgot-password', validate({
  body: Joi.object({ email: Joi.string().email().required() })
}), ctrl.forgotPassword);

router.post('/reset-password', validate({
  body: Joi.object({ token: Joi.string().required(), newPassword: Joi.string().min(8).required() })
}), ctrl.resetPassword);

router.get('/me', authenticate, ctrl.me);

router.patch('/me', authenticate, validate({
  body: Joi.object({
    firstName: Joi.string().min(2),
    lastName: Joi.string().min(2),
    phone: Joi.string().allow('', null),
    company: Joi.string().allow('', null)
  })
}), ctrl.updateMe);

router.post('/change-password', authenticate, validate({
  body: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).required()
  })
}), ctrl.changePassword);

module.exports = router;
