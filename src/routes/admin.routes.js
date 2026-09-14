const router = require('express').Router();
const Joi = require('joi');
const validate = require('../middlewares/validate');
const { authenticate, requireRole } = require('../middlewares/auth');

const dashboardCtrl = require('../controllers/admin/dashboard.controller');
const productCtrl = require('../controllers/admin/product.controller');
const categoryCtrl = require('../controllers/admin/category.controller');
const orderCtrl = require('../controllers/admin/order.controller');
const customerCtrl = require('../controllers/admin/customer.controller');
const adminUserCtrl = require('../controllers/admin/adminUser.controller');

router.use(authenticate, requireRole('admin', 'superadmin'));

// Dashboard
router.get('/dashboard/kpis', dashboardCtrl.kpis);

// Products
router.get('/products', productCtrl.list);
router.get('/products/:id', validate({ params: Joi.object({ id: Joi.string().uuid().required() }) }), productCtrl.getOne);
router.post('/products', validate({
  body: Joi.object({
    categoryId: Joi.string().uuid().required(),
    sku: Joi.string().required(),
    name: Joi.string().required(),
    slug: Joi.string().required(),
    brand: Joi.string().required(),
    shortDescription: Joi.string().allow('', null),
    description: Joi.string().allow('', null),
    specs: Joi.object().unknown(true),
    highlights: Joi.array().items(Joi.string()),
    priceHt: Joi.number().positive().required(),
    priceTtc: Joi.number().positive().required(),
    compareAtPriceTtc: Joi.number().positive().allow(null),
    stock: Joi.number().integer().min(0).default(0),
    stockAlertThreshold: Joi.number().integer().min(0).default(5),
    warrantyMonths: Joi.number().integer().min(0).default(24),
    availability: Joi.string().valid('in_stock', 'on_order', 'incoming').default('in_stock'),
    isActive: Joi.boolean().default(true),
    isFeatured: Joi.boolean().default(false),
    isNew: Joi.boolean().default(false),
    images: Joi.array().items(Joi.object({ url: Joi.string().required(), altText: Joi.string().allow('', null), isPrimary: Joi.boolean() })),
    variants: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      sku: Joi.string().required(),
      priceDeltaTtc: Joi.number().default(0),
      stock: Joi.number().integer().min(0).default(0),
      isDefault: Joi.boolean()
    }))
  })
}), productCtrl.create);
router.patch('/products/:id', validate({ params: Joi.object({ id: Joi.string().uuid().required() }) }), productCtrl.update);
router.delete('/products/:id', validate({ params: Joi.object({ id: Joi.string().uuid().required() }) }), productCtrl.remove);
router.post('/products/:id/stock', validate({
  params: Joi.object({ id: Joi.string().uuid().required() }),
  body: Joi.object({ delta: Joi.number().integer().required() })
}), productCtrl.adjustStock);

// Categories
router.post('/categories', validate({
  body: Joi.object({
    name: Joi.string().required(),
    slug: Joi.string().required(),
    description: Joi.string().allow('', null),
    icon: Joi.string().allow('', null),
    position: Joi.number().integer().default(0)
  })
}), categoryCtrl.create);
router.patch('/categories/:id', validate({ params: Joi.object({ id: Joi.string().uuid().required() }) }), categoryCtrl.update);
router.delete('/categories/:id', validate({ params: Joi.object({ id: Joi.string().uuid().required() }) }), categoryCtrl.remove);

// Orders
router.get('/orders', orderCtrl.list);
router.get('/orders/:id', validate({ params: Joi.object({ id: Joi.string().uuid().required() }) }), orderCtrl.getOne);
router.patch('/orders/:id/status', validate({
  params: Joi.object({ id: Joi.string().uuid().required() }),
  body: Joi.object({
    status: Joi.string().valid('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled').required(),
    comment: Joi.string().allow('', null)
  })
}), orderCtrl.updateStatus);
router.get('/orders/:id/invoice', validate({ params: Joi.object({ id: Joi.string().uuid().required() }) }), orderCtrl.downloadInvoice);

// Customers
router.get('/customers', customerCtrl.list);
router.get('/customers/:id', validate({ params: Joi.object({ id: Joi.string().uuid().required() }) }), customerCtrl.getOne);
router.patch('/customers/:id/active', validate({
  params: Joi.object({ id: Joi.string().uuid().required() }),
  body: Joi.object({ isActive: Joi.boolean().required() })
}), customerCtrl.setActive);

// Admin users (superadmin only)
router.get('/users', requireRole('superadmin'), adminUserCtrl.list);
router.post('/users', requireRole('superadmin'), validate({
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    role: Joi.string().valid('admin', 'superadmin').required()
  })
}), adminUserCtrl.create);
router.patch('/users/:id', requireRole('superadmin'), validate({
  params: Joi.object({ id: Joi.string().uuid().required() }),
  body: Joi.object({ role: Joi.string().valid('admin', 'superadmin').required(), isActive: Joi.boolean() })
}), adminUserCtrl.updateRole);

module.exports = router;
