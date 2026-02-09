const { z } = require('zod');

const createReviewSchema = z.object({
  seller_id: z.coerce.number().int().positive(),
  product_id: z.coerce.number().int().positive().optional(),
  rating: z.coerce.number().int().min(1).max(5),
  text: z.string().min(10).max(1000)
});

const updateReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  text: z.string().min(10).max(1000).optional()
});

module.exports = {
  createReviewSchema,
  updateReviewSchema
};
