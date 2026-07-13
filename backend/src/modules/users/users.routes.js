const { Router } = require('express');
const controller = require('./users.controller');
const { requireAuth } = require('../../middlewares/auth');

const router = Router();

router.get('/search', requireAuth, controller.search);

module.exports = router;
