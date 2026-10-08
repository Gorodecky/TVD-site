import type { Product } from './types';

const baseUrl = (import.meta.env?.VITE_API_URL || 'http://localhost:3001/api/v1').replace(/\/$/, '');

export class ApiError extends Error { constructor(message: string) { super(message); this.name = 'ApiError'; } }

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try { response = await fetch(`${baseUrl}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } }); }
  catch { throw new ApiError('Не вдалося з’єднатися із сервером. Перевірте підключення та спробуйте ще раз.'); }
  const body = await response.json().catch(() => ({})) as { data?: T; error?: { message?: string } };
  if (!response.ok) throw new ApiError(body.error?.message || 'Сталася помилка. Спробуйте ще раз.');
  return body.data as T;
}

export type BackendProduct = { id:string; sku:string; name:string; brand?:{name:string}|null; images?:{url:string;isPrimary?:boolean}[]; prices?:{amount:string|number;priceGroup?:{currency:string;isDefault?:boolean};validFrom?:string;validTo?:string|null}[]; stocks?:{availableQuantity:string|number}[]; characteristics?:{value:string;characteristic:{key:string}}[] };
const numeric = (v: string|number|undefined) => v === undefined ? null : Number(v);
export function adaptProduct(p: BackendProduct): Product {
  const chars = Object.fromEntries((p.characteristics ?? []).map(c => [c.characteristic.key, c.value]));
  const validPrices = (p.prices ?? []).filter(x => (!x.validFrom || new Date(x.validFrom) <= new Date()) && (!x.validTo || new Date(x.validTo) >= new Date()));
  const price = validPrices.sort((a,b)=>Number(Boolean(b.priceGroup?.isDefault))-Number(Boolean(a.priceGroup?.isDefault)) || new Date(b.validFrom ?? 0).getTime()-new Date(a.validFrom ?? 0).getTime())[0];
  const stockQty = (p.stocks?.length ?? 0)>0 ? p.stocks!.reduce((n,s) => n + Number(s.availableQuantity), 0) : null;
  const connection = chars.connection === 'VK' ? 'VK' : chars.connection === 'K' ? 'K' : undefined;
  const heightMm = numeric(chars.heightMm ?? chars.height);
  const widthMm = numeric(chars.widthMm ?? chars.width);
  const powerW = numeric(chars.powerW ?? chars.power);
  return { id:p.id, name:p.name, brand:p.brand?.name ?? 'TVD', code:p.sku, price:Number(price?.amount ?? 0), priceCurrency:price?.priceGroup?.currency === 'UAH' ? 'UAH' : 'source', image:p.images?.find(i=>i.isPrimary)?.url ?? p.images?.[0]?.url ?? '/radiator-k.png', stock:stockQty===null?'Наявність не вказана':stockQty > 0 ? `На складі · ${stockQty} шт.` : 'Немає на складі', stockQty, ...(chars.model?{model:chars.model}:{}), ...(connection?{connection}:{}), ...(heightMm!==null?{heightMm}:{}), ...(widthMm!==null?{widthMm}:{}), ...(powerW!==null?{powerW}:{}) };
}
export type ProductList = {items:BackendProduct[];pagination:{page:number;pageSize:number;total:number;pages:number}};
export type CartData = {id:string;items:{id:string;productId:string;quantity:string;product:BackendProduct}[]};
export function getSessionId() { let id=localStorage.getItem('tvd-session-id'); if(!id){id=crypto.randomUUID();localStorage.setItem('tvd-session-id',id);} return id; }
const sessionHeaders = () => ({'x-session-id':getSessionId()});
export const getProducts = (params:Record<string,string|number>={}) => api<ProductList>(`/products?${new URLSearchParams(Object.entries(params).map(([k,v])=>[k,String(v)]))}`);
export const getCart = () => api<CartData>('/cart',{headers:sessionHeaders()});
export const addCartItem = (productId:string, quantity=1) => api<CartData>('/cart/items',{method:'POST',headers:sessionHeaders(),body:JSON.stringify({productId,quantity})});
export const updateCartItem = (id:string,quantity:number) => api<CartData>(`/cart/items/${id}`,{method:'PATCH',headers:sessionHeaders(),body:JSON.stringify({quantity})});
export const removeCartItem = (id:string) => api<CartData>(`/cart/items/${id}`,{method:'DELETE',headers:sessionHeaders()});
export type CheckoutInput={firstName:string;lastName:string;phone:string;email?:string;items:{productId:string;quantity:number}[]};
export const checkout = (input:CheckoutInput) => api<{id:string;number:string;totalAmount:string|number;currency:string}>('/orders',{method:'POST',headers:sessionHeaders(),body:JSON.stringify(input)});
