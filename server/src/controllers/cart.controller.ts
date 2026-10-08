import type {Request,Response,NextFunction} from 'express';
import {z} from 'zod';
import {prisma} from '../config/database.js';
import {cartItemSchema,cartQuantitySchema,uuidSchema} from '../validators/common.js';

const sessionSchema=z.string().trim().min(8).max(160);
async function load(sessionId:string){return prisma.cart.findUnique({where:{sessionId},include:{items:{include:{product:{include:{brand:true,images:{orderBy:{sortOrder:'asc'}},characteristics:{include:{characteristic:true}},prices:{include:{priceGroup:true}},stocks:true}}}}}});}
async function getOrCreate(sessionId:string){const cart=await prisma.cart.upsert({where:{sessionId},create:{sessionId},update:{}});if(cart.status==='CONVERTED'){await prisma.$transaction([prisma.cartItem.deleteMany({where:{cartId:cart.id}}),prisma.cart.update({where:{id:cart.id},data:{status:'ACTIVE'}})]);}return prisma.cart.findUniqueOrThrow({where:{id:cart.id}});}
export const cartController={
 async get(req:Request,res:Response,next:NextFunction){try{const sid=sessionSchema.parse(req.header('x-session-id'));await prisma.cart.upsert({where:{sessionId:sid},create:{sessionId:sid},update:{}});res.json({data:await load(sid)});}catch(e){next(e);}},
 async add(req:Request,res:Response,next:NextFunction){try{const sid=sessionSchema.parse(req.header('x-session-id'));const input=cartItemSchema.parse(req.body);const cart=await getOrCreate(sid);const product=await prisma.product.findFirst({where:{id:input.productId,status:'ACTIVE',isVisible:true}});if(!product){res.status(404).json({error:{message:'Товар недоступний'}});return;}await prisma.cartItem.upsert({where:{cartId_productId:{cartId:cart.id,productId:input.productId}},create:{cartId:cart.id,productId:input.productId,quantity:input.quantity},update:{quantity:{increment:input.quantity}}});res.json({data:await load(sid)});}catch(e){next(e);}},
 async update(req:Request,res:Response,next:NextFunction){try{const sid=sessionSchema.parse(req.header('x-session-id'));const id=uuidSchema.parse(req.params.id);const {quantity}=cartQuantitySchema.parse(req.body);await prisma.cartItem.updateMany({where:{id,cart:{sessionId:sid}},data:{quantity}});res.json({data:await load(sid)});}catch(e){next(e);}},
 async remove(req:Request,res:Response,next:NextFunction){try{const sid=sessionSchema.parse(req.header('x-session-id'));const id=uuidSchema.parse(req.params.id);await prisma.cartItem.deleteMany({where:{id,cart:{sessionId:sid}}});res.json({data:await load(sid)});}catch(e){next(e);}},
};
