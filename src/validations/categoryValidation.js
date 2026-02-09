const { z } = require('zod');

const createCategorySchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100),
  slug: z.string().min(2, 'Slug deve ter no mínimo 2 caracteres').max(100).regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  description: z.string().optional(),
  icon: z.string().max(10).optional(),
  gradient: z.string().max(100).optional(),
});

const updateCategorySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional(),
  icon: z.string().max(10).optional(),
  gradient: z.string().max(100).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Pelo menos um campo deve ser fornecido para atualização',
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
};
