const { z } = require('zod');

const registerSchema = {
  body: z.object({
    name: z.string().min(2).max(120),
    email: z.string().email().max(160),
    password: z.string().min(6).max(72),
  }),
};

const loginSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
};

module.exports = { registerSchema, loginSchema };
