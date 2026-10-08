import {describe,expect,it} from 'vitest';
import {cartItemSchema,cartQuantitySchema,orderCreateSchema} from './common.js';

describe('cart and checkout validation',()=>{
 it('accepts cart item quantities and rejects invalid UUIDs',()=>{expect(cartItemSchema.safeParse({productId:'00000000-0000-4000-8000-000000000000',quantity:2}).success).toBe(true);expect(cartItemSchema.safeParse({productId:'demo-product',quantity:1}).success).toBe(false);});
 it('limits cart quantity to positive integers',()=>{expect(cartQuantitySchema.safeParse({quantity:3}).success).toBe(true);expect(cartQuantitySchema.safeParse({quantity:0}).success).toBe(false);});
 it('requires buyer details and UUID item references without accepting client prices',()=>{const good={firstName:'Іван',lastName:'Петренко',phone:'+380501234567',items:[{productId:'00000000-0000-4000-8000-000000000000',quantity:1}]};expect(orderCreateSchema.safeParse(good).success).toBe(true);expect(orderCreateSchema.safeParse({...good,items:[{...good.items[0],unitPrice:1}]}).success).toBe(false);});
});
