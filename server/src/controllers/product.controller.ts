import type { Request, Response, NextFunction } from 'express';
import { productService } from '../services/product.service.js';
import { catalogQuerySchema, productCreateSchema, uuidSchema } from '../validators/common.js';

export const productController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try { res.json({ data: await productService.list(catalogQuerySchema.parse(req.query)) }); } catch (error) { next(error); }
  },
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const id = uuidSchema.parse(req.params.id);
      const product = await productService.get(id);
      if (!product) { res.status(404).json({ error: { message: 'Product not found' } }); return; }
      res.json({ data: product });
    } catch (error) { next(error); }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = productCreateSchema.parse(req.body);
      const data = {
        sku: input.sku,
        name: input.name,
        slug: input.slug,
        ...(input.manufacturerSku !== undefined ? { manufacturerSku: input.manufacturerSku } : {}),
        ...(input.barcode !== undefined ? { barcode: input.barcode } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.shortDescription !== undefined ? { shortDescription: input.shortDescription } : {}),
        ...(input.type !== undefined ? { type: input.type } : {}),
        ...(input.categoryId !== undefined ? { category: { connect: { id: input.categoryId } } } : {}),
        ...(input.brandId !== undefined ? { brand: { connect: { id: input.brandId } } } : {}),
        ...(input.isVisible !== undefined ? { isVisible: input.isVisible } : {}),
      };
      const product = await productService.create(data);
      res.status(201).json({ data: product });
    } catch (error) { next(error); }
  },
};
