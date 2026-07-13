const { z } = require('zod');

const statusEnum = z.enum(['pending', 'in_progress', 'done']);
const priorityEnum = z.enum(['low', 'medium', 'high']);

const idParamSchema = {
  params: z.object({ id: z.string().uuid() }),
};

const collaboratorParamSchema = {
  params: z.object({ id: z.string().uuid(), userId: z.string().uuid() }),
};

const listTasksSchema = {
  query: z.object({
    status: statusEnum.optional(),
    categoryId: z.string().uuid().optional(),
    search: z.string().max(160).optional(),
  }),
};

const createTaskSchema = {
  body: z.object({
    title: z.string().min(1).max(160),
    description: z.string().max(4000).optional(),
    status: statusEnum.optional(),
    priority: priorityEnum.optional(),
    dueDate: z.string().date().optional(),
    categoryId: z.string().uuid().optional(),
  }),
};

const updateTaskSchema = {
  params: idParamSchema.params,
  body: z.object({
    title: z.string().min(1).max(160).optional(),
    description: z.string().max(4000).optional(),
    status: statusEnum.optional(),
    priority: priorityEnum.optional(),
    dueDate: z.string().date().optional(),
    categoryId: z.string().uuid().optional(),
  }),
};

const addCollaboratorSchema = {
  params: idParamSchema.params,
  body: z.object({ email: z.string().email() }),
};

module.exports = {
  idParamSchema,
  collaboratorParamSchema,
  listTasksSchema,
  createTaskSchema,
  updateTaskSchema,
  addCollaboratorSchema,
};
