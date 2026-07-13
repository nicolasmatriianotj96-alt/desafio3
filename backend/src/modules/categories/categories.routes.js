const { Router } = require('express');
const controller = require('./categories.controller');
const { requireAuth } = require('../../middlewares/auth');
const { validate } = require('../../middlewares/validate');
const { idParamSchema, createCategorySchema, updateCategorySchema } = require('./categories.schemas');

const router = Router();
router.use(requireAuth);

router.get('/', controller.list);
router.post('/', validate(createCategorySchema), controller.create);
router.get('/:id', validate(idParamSchema), controller.getOne);
router.put('/:id', validate(updateCategorySchema), controller.update);
router.delete('/:id', validate(idParamSchema), controller.remove);

module.exports = router;
