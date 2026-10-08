import { productRepository } from '../repositories/product.repository.js';
import type { PageQuery } from '../models/api.js';

export const productService = {
  async list(query: PageQuery & {q?:string|undefined;brand?:string|undefined;connection?:string|undefined;model?:string|undefined;height?:number|undefined;sort?:string|undefined}) {
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([productRepository.list(skip, query.pageSize, query), productRepository.count(query)]);
    return { items, pagination: { page: query.page, pageSize: query.pageSize, total, pages: Math.ceil(total / query.pageSize) } };
  },
  get(id: string) { return productRepository.byId(id); },
  create(data: Parameters<typeof productRepository.create>[0]) { return productRepository.create(data); },
};
