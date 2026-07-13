const { Router } = require('express');
const controller = require('./tasks.controller');
const { requireAuth } = require('../../middlewares/auth');
const { validate } = require('../../middlewares/validate');
const {
  idParamSchema,
  collaboratorParamSchema,
  listTasksSchema,
  createTaskSchema,
  updateTaskSchema,
  addCollaboratorSchema,
} = require('./tasks.schemas');

const router = Router();
router.use(requireAuth);

router.get('/', validate(listTasksSchema), controller.list);
router.post('/', validate(createTaskSchema), controller.create);
router.get('/:id', validate(idParamSchema), controller.getOne);
router.put('/:id', validate(updateTaskSchema), controller.update);
router.delete('/:id', validate(idParamSchema), controller.remove);
router.post('/:id/collaborators', validate(addCollaboratorSchema), controller.addCollaborator);
router.delete('/:id/collaborators/:userId', validate(collaboratorParamSchema), controller.removeCollaborator);

module.exports = router;
