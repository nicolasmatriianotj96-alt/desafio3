const { Router } = require('express');
const controller = require('./auth.controller');
const { validate } = require('../../middlewares/validate');
const { requireAuth } = require('../../middlewares/auth');
const { registerSchema, loginSchema } = require('./auth.schemas');

const router = Router();

router.post('/register', validate(registerSchema), controller.register);
router.post('/login', validate(loginSchema), controller.login);
router.get('/me', requireAuth, controller.me);

module.exports = router;
