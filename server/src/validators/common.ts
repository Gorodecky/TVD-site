import { z } from 'zod';

export const uuidSchema = z.string().uuid();
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const productCreateSchema = z.object({
  sku: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(255),
  slug: z.string().trim().min(1).max(280),
  manufacturerSku: z.string().max(100).optional(),
  barcode: z.string().max(100).optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  type: z.enum(['SIMPLE', 'VARIANT', 'SERVICE']).optional(),
  categoryId: uuidSchema.optional(),
  brandId: uuidSchema.optional(),
  isVisible: z.boolean().optional(),
});

export const customerCreateSchema = z.object({
  type: z.enum(['INDIVIDUAL', 'COMPANY']).default('INDIVIDUAL'),
  email: z.string().email().optional(),
  phone: z.string().max(40).optional(),
  firstName: z.string().max(120).optional(),
  lastName: z.string().max(120).optional(),
  companyName: z.string().max(200).optional(),
  taxId: z.string().max(40).optional(),
});

export const orderCreateSchema = z.object({
  firstName: z.string().trim().min(1).max(120), lastName: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(7).max(40), email: z.string().email().optional(),
  items: z.array(z.object({ productId: uuidSchema, quantity: z.coerce.number().int().min(1).max(999) }).strict()).min(1),
}).strict();
export const cartItemSchema = z.object({productId:uuidSchema,quantity:z.coerce.number().int().min(1).max(999).default(1)});
export const cartQuantitySchema = z.object({quantity:z.coerce.number().int().min(1).max(999)});
export const catalogQuerySchema = paginationSchema.extend({q:z.string().optional(),brand:z.string().optional(),connection:z.enum(['K','VK']).optional(),model:z.string().optional(),height:z.coerce.number().optional(),sort:z.enum(['price-low','price-high','power']).optional()});
