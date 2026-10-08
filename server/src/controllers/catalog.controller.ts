import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { paginationSchema, uuidSchema } from '../validators/common.js';
import { customerCreateSchema, orderCreateSchema } from '../validators/common.js';
import type { Prisma } from '@prisma/client';

export const catalogController = {
  async categories(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ data: await prisma.category.findMany({ where: { status: 'ACTIVE' }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }) }); } catch (error) { next(error); }
  },
  async brands(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ data: await prisma.brand.findMany({ where: { status: 'ACTIVE' }, orderBy: { name: 'asc' } }) }); } catch (error) { next(error); }
  },
  async customers(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, pageSize } = paginationSchema.parse(req.query);
      const [items, total] = await Promise.all([prisma.customer.findMany({ skip: (page - 1) * pageSize, take: pageSize, orderBy: { createdAt: 'desc' } }), prisma.customer.count()]);
      res.json({ data: { items, pagination: { page, pageSize, total } } });
    } catch (error) { next(error); }
  },
  async customer(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await prisma.customer.findUnique({ where: { id: uuidSchema.parse(req.params.id) } });
      if (!customer) { res.status(404).json({ error: { message: 'Customer not found' } }); return; }
      res.json({ data: customer });
    } catch (error) { next(error); }
  },
  async createCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const input = customerCreateSchema.parse(req.body);
      const data = {
        type: input.type,
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
        ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
        ...(input.companyName !== undefined ? { companyName: input.companyName } : {}),
        ...(input.taxId !== undefined ? { taxId: input.taxId } : {}),
      };
      res.status(201).json({ data: await prisma.customer.create({ data }) });
    } catch (error) { next(error); }
  },
  async orders(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, pageSize } = paginationSchema.parse(req.query);
      const [items, total] = await Promise.all([prisma.order.findMany({ skip: (page - 1) * pageSize, take: pageSize, include: { items: true, payments: true, delivery: true }, orderBy: { createdAt: 'desc' } }), prisma.order.count()]);
      res.json({ data: { items, pagination: { page, pageSize, total } } });
    } catch (error) { next(error); }
  },
  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const input = orderCreateSchema.parse(req.body);
      const sessionId = req.header('x-session-id');
      if(!sessionId){res.status(400).json({error:{message:'Сесія кошика відсутня'}});return;}
      const cart=await prisma.cart.findUnique({where:{sessionId},include:{items:true}});
      const requested=[...input.items].sort((a,b)=>a.productId.localeCompare(b.productId));
      const inCart=[...(cart?.items??[])].sort((a,b)=>a.productId.localeCompare(b.productId));
      if(!cart||cart.status!=='ACTIVE'||requested.length!==inCart.length||requested.some((item,i)=>item.productId!==inCart[i]?.productId||item.quantity!==Number(inCart[i]?.quantity))){res.status(400).json({error:{message:'Кошик змінився. Оновіть його та повторіть оформлення.'}});return;}
      const products = await prisma.product.findMany({ where: { id:{in:input.items.map(i=>i.productId)}, status:'ACTIVE', isVisible:true }, include:{brand:true,prices:{where:{validFrom:{lte:new Date()},OR:[{validTo:null},{validTo:{gte:new Date()}}]},include:{priceGroup:true},orderBy:[{priceGroup:{isDefault:'desc'}},{validFrom:'desc'}]},images:{where:{isPrimary:true},take:1}} });
      if(products.length!==input.items.length) { res.status(400).json({error:{message:'Один або кілька товарів більше недоступні'}}); return; }
      const missingPrice=products.find(product=>!product.prices[0]);if(missingPrice){res.status(409).json({error:{message:`Для товару ${missingPrice.sku} зараз не задано актуальну ціну`}});return;}
      const lines=input.items.map(item=>{const product=products.find(p=>p.id===item.productId)!;const price=product.prices[0];if(!price)throw new Error(`Для товару ${product.sku} не задано актуальну ціну`);return {productId:product.id,sku:product.sku,name:product.name,unitPrice:Number(price.amount),quantity:item.quantity,lineTotal:Number(price.amount)*item.quantity,currency:price.priceGroup.currency};});
      if(new Set(lines.map(line=>line.currency)).size!==1){res.status(400).json({error:{message:'Кошик містить товари з різними валютами ціни'}});return;}
      const subtotal=lines.reduce((sum,item)=>sum+item.lineTotal,0);
      const order = await prisma.$transaction(async (tx) => {
        const customer=await tx.customer.create({data:{firstName:input.firstName,lastName:input.lastName,phone:input.phone,...(input.email?{email:input.email}:{})}});
        const created = await tx.order.create({ data: {
          number: `TVD-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
          customer:{connect:{id:customer.id}}, currency: lines[0]!.currency, subtotal, discountAmount: 0,
          deliveryAmount: 0, totalAmount: subtotal,
          customerSnapshot: {firstName:input.firstName,lastName:input.lastName,phone:input.phone,email:input.email??null} as Prisma.InputJsonValue,
          items: { create: lines.map(line=>({productId:line.productId,sku:line.sku,name:line.name,unitPrice:line.unitPrice,quantity:line.quantity,lineTotal:line.lineTotal})) },
        }, include: { items: true } });
        if(sessionId){const sourceCart=await tx.cart.findUnique({where:{sessionId}});if(sourceCart){await tx.cartItem.deleteMany({where:{cartId:sourceCart.id}});await tx.cart.update({where:{id:sourceCart.id},data:{status:'CONVERTED'}});}}
        return created;
      });
      res.status(201).json({ data: order });
    } catch (error) { next(error); }
  },
  async order(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await prisma.order.findUnique({ where: { id: uuidSchema.parse(req.params.id) }, include: { items: true, payments: { include: { transactions: true } }, delivery: true, documents: true } });
      if (!order) { res.status(404).json({ error: { message: 'Order not found' } }); return; }
      res.json({ data: order });
    } catch (error) { next(error); }
  },
};
