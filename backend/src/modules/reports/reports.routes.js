const { Router } = require('express');
const controller = require('./reports.controller');
const { requireAuth } = require('../../middlewares/auth');

const router = Router();
router.use(requireAuth);

router.get('/summary', controller.summary);
router.get('/by-category', controller.byCategory);

module.exports = router;
