import {PrismaClient} from '@prisma/client';
import {readFileSync} from 'node:fs';

const prisma=new PrismaClient();
type Row={id:string;article:string|null;internalCode:string|null;brand:string;model:string;connection:'K'|'VK';heightMm:number;widthMm:number;powerW:number|null;stockQty:number|null;price:number;name:string;image:string};
async function main(){
 const group=await prisma.priceGroup.upsert({where:{code:'SOURCE'},update:{currency:'XXX'},create:{code:'Ціни з експорту',name:'Виписка 1С (валюта не вказана)',currency:'XXX',isDefault:false}});
 const warehouse=await prisma.warehouse.upsert({where:{code:'MAIN'},update:{},create:{code:'MAIN',name:'Основний склад'}});
 const category=await prisma.category.upsert({where:{slug:'radiators'},update:{},create:{name:'Сталеві панельні радіатори',slug:'radiators'}});
 const rows=JSON.parse(readFileSync(new URL('../../src/radiators.json',import.meta.url),'utf8')) as Row[];
 const keys=[['model','Тип радіатора'],['connection','Підключення'],['heightMm','Висота'],['widthMm','Ширина'],['powerW','Потужність'],['internalCode','Код 1С'],['article','Артикул']] as const;
 const characteristics=Object.fromEntries(await Promise.all(keys.map(async([key,name])=>{const c=await prisma.characteristic.upsert({where:{key},update:{},create:{key,name}});return [key,c.id]})));
 for(const row of rows){
  const brand=await prisma.brand.upsert({where:{name:row.brand},update:{},create:{name:row.brand,slug:row.brand.toLowerCase().replace(/[^a-z0-9]+/g,'-')}});
  const sku=row.article||row.internalCode||row.id;
  const product=await prisma.product.upsert({where:{sku},update:{name:row.name,brandId:brand.id,categoryId:category.id,isVisible:true,status:'ACTIVE'},create:{sku,name:row.name,slug:`radiator-${row.id}`,brandId:brand.id,categoryId:category.id}});
  await prisma.productImage.deleteMany({where:{productId:product.id}});await prisma.productImage.create({data:{productId:product.id,url:row.image,isPrimary:true}});
  const prior=await prisma.price.findFirst({where:{productId:product.id,priceGroupId:group.id}});if(prior)await prisma.price.update({where:{id:prior.id},data:{amount:row.price}});else await prisma.price.create({data:{productId:product.id,priceGroupId:group.id,amount:row.price,validFrom:new Date('2026-10-07T00:00:00.000Z')}});
  if(row.stockQty===null)await prisma.stock.deleteMany({where:{productId:product.id,warehouseId:warehouse.id}});else await prisma.stock.upsert({where:{productId_warehouseId:{productId:product.id,warehouseId:warehouse.id}},update:{quantity:row.stockQty,availableQuantity:row.stockQty},create:{productId:product.id,warehouseId:warehouse.id,quantity:row.stockQty,availableQuantity:row.stockQty}});
  const vals:Record<string,string>={model:row.model,connection:row.connection,heightMm:String(row.heightMm),widthMm:String(row.widthMm),...(row.powerW===null?{}:{powerW:String(row.powerW)}),...(row.internalCode?{internalCode:row.internalCode}:{}),...(row.article?{article:row.article}:{})};
  for(const [key,value] of Object.entries(vals))await prisma.productCharacteristic.upsert({where:{productId_characteristicId:{productId:product.id,characteristicId:characteristics[key]!}},update:{value},create:{productId:product.id,characteristicId:characteristics[key]!,value}});
 }
}
main().catch(error=>{console.error(error);process.exitCode=1}).finally(async()=>prisma.$disconnect());
