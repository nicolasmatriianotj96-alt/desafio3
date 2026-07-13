const { z } = require('zod');

const idParamSchema = {
  params: z.object({ id: z.string().uuid() }),
};

const createCategorySchema = {
  body: z.object({
    name: z.string().min(1).max(80),
    color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional(),
  }),
};

const updateCategorySchema = {
  params: idParamSchema.params,
  body: z.object({
    name: z.string().min(1).max(80).optional(),
    color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional(),
  }),
};

module.exports = { idParamSchema, createCategorySchema, updateCategorySchema };
