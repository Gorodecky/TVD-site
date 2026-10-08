import { describe, expect, it } from 'vitest';
import { orderCreateSchema, paginationSchema, productCreateSchema } from './common.js';

describe('API request validators', () => {
  it('defaults pagination and caps page size', () => {
    expect(paginationSchema.parse({})).toEqual({ page: 1, pageSize: 20 });
    expect(paginationSchema.safeParse({ pageSize: 101 }).success).toBe(false);
  });

  it('requires stable product identifiers and display name', () => {
    expect(productCreateSchema.safeParse({ sku: 'A-1', name: 'Product', slug: 'product' }).success).toBe(true);
    expect(productCreateSchema.safeParse({ sku: '', name: 'Product', slug: 'product' }).success).toBe(false);
  });

  it('requires at least one positive-quantity order item', () => {
    const common = { firstName:'A',lastName:'B',phone:'+380501234567',items: [{ productId:'00000000-0000-4000-8000-000000000000', quantity: 1 }] };
    expect(orderCreateSchema.safeParse(common).success).toBe(true);
    expect(orderCreateSchema.safeParse({ ...common, items: [{ ...common.items[0], quantity: 0 }] }).success).toBe(false);
  });
});
