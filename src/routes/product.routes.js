const router = require('express').Router();
const ctrl = require('../controllers/product.controller');

router.get('/', ctrl.list);
router.get('/facets', ctrl.facets);
router.get('/:slug', ctrl.getBySlug);
router.get('/:id/related', ctrl.related);

module.exports = router;
