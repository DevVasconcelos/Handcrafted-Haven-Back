const { z } = require('zod');

const createProductSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().min(10),
  price: z.number().positive(),
  compare_price: z.number().positive().optional(),
  stock: z.number().int().min(0).default(0),
  sku: z.string().max(100).optional(),
  category_id: z.number().int().positive(),
  tags: z.string().optional(),
  materials: z.string().max(255).optional(),
  dimensions: z.string().max(100).optional(),
  weight: z.string().max(50).optional(),
  color: z.string().max(100).optional(),
  shipping_time: z.string().max(50).optional(),
  handmade: z.boolean().default(true),
  customizable: z.boolean().default(false),
  gift_wrapping: z.boolean().default(false),
  images: z.array(z.object({
    url: z.string().url(),
    is_primary: z.boolean().default(false),
    display_order: z.number().int().min(0).default(0)
  })).min(1).max(10).optional()
});

const updateProductSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  description: z.string().min(10).optional(),
  price: z.number().positive().optional(),
  compare_price: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  sku: z.string().max(100).optional(),
  category_id: z.number().int().positive().optional(),
  tags: z.string().optional(),
  materials: z.string().max(255).optional(),
  dimensions: z.string().max(100).optional(),
  weight: z.string().max(50).optional(),
  color: z.string().max(100).optional(),
  shipping_time: z.string().max(50).optional(),
  handmade: z.boolean().optional(),
  customizable: z.boolean().optional(),
  gift_wrapping: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'OUT_OF_STOCK', 'DELETED']).optional()
});

const addImagesSchema = z.object({
  images: z.array(z.object({
    url: z.string().url(),
    is_primary: z.boolean().default(false),
    display_order: z.number().int().min(0).default(0)
  })).min(1).max(10)
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  addImagesSchema
};
