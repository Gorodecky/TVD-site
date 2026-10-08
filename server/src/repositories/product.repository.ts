import { prisma } from '../config/database.js';
import type { Prisma } from '@prisma/client';

type ProductFilters={q?:string|undefined;brand?:string|undefined;connection?:string|undefined;model?:string|undefined;height?:number|undefined;sort?:string|undefined};

export const productRepository = {
  list(skip: number, take: number, filters: ProductFilters = {}) {
    const where: Prisma.ProductWhereInput = { status: 'ACTIVE', isVisible: true,
      ...(filters.q ? { OR: [{name:{contains:filters.q,mode:'insensitive'}},{sku:{contains:filters.q,mode:'insensitive'}},{manufacturerSku:{contains:filters.q,mode:'insensitive'}}] } : {}),
      ...(filters.brand ? { brand:{name:{equals:filters.brand,mode:'insensitive'}} } : {}),
      ...((filters.connection||filters.model||filters.height!==undefined) ? { AND:[...(filters.connection?[{characteristics:{some:{characteristic:{key:'connection'},value:filters.connection}}}]:[]),...(filters.model?[{characteristics:{some:{characteristic:{key:'model'},value:filters.model}}}]:[]),...(filters.height!==undefined?[{characteristics:{some:{characteristic:{key:'heightMm'},value:String(filters.height)}}}]:[])] } : {})
    };
    return prisma.product.findMany({
      where,
      include: { images: { orderBy: { sortOrder: 'asc' } }, brand: true, category: true, characteristics:{include:{characteristic:true}}, prices:{where:{validFrom:{lte:new Date()},OR:[{validTo:null},{validTo:{gte:new Date()}}]},include:{priceGroup:true},orderBy:[{priceGroup:{isDefault:'desc'}},{validFrom:'desc'}]}, stocks:{include:{warehouse:true}} },
      orderBy: { createdAt: 'desc' }, skip, take,
    });
  },
  count(filters: ProductFilters = {}) {
    return prisma.product.count({ where: { status: 'ACTIVE', isVisible: true,
      ...(filters.q ? {OR:[{name:{contains:filters.q,mode:'insensitive'}},{sku:{contains:filters.q,mode:'insensitive'}},{manufacturerSku:{contains:filters.q,mode:'insensitive'}}]}:{}),
      ...(filters.brand?{brand:{name:{equals:filters.brand,mode:'insensitive'}}}:{}),
      ...((filters.connection||filters.model||filters.height!==undefined)?{AND:[...(filters.connection?[{characteristics:{some:{characteristic:{key:'connection'},value:filters.connection}}}]:[]),...(filters.model?[{characteristics:{some:{characteristic:{key:'model'},value:filters.model}}}]:[]),...(filters.height!==undefined?[{characteristics:{some:{characteristic:{key:'heightMm'},value:String(filters.height)}}}]:[])]}: {})
    } });
  },
  byId(id: string) {
    return prisma.product.findUnique({
      where: { id }, include: { images: true, documents: true, characteristics: { include: { characteristic: true } },
        relationsFrom: { include: { targetProduct: true } }, prices: true, stocks: { include: { warehouse: true } }, brand: true, category: true },
    });
  },
  create(data: Prisma.ProductCreateInput) {
    return prisma.product.create({ data });
  },
};
