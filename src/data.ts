import type {Product} from './types';
export type {Product} from './types';
export const categories=[
 {icon:'♨',title:'Опалення',desc:'Котли, радіатори, насоси'}, {icon:'⌁',title:'Водопостачання',desc:'Труби, фітинги, арматура'},
 {icon:'❄',title:'Кондиціювання',desc:'Кондиціонери та вентиляція'}, {icon:'◉',title:'Водопідготовка',desc:'Фільтри та системи очищення'},
 {icon:'⌂',title:'Каналізація',desc:'Внутрішні та зовнішні системи'}, {icon:'⚡',title:'Електрика',desc:'Автоматика та керування'},
];
export const formatPrice=(n:number)=>new Intl.NumberFormat('uk-UA').format(n)+' ₴';
export const formatProductPrice=(p:Product,amount=p.price)=>p.priceCurrency==='source'?new Intl.NumberFormat('uk-UA',{minimumFractionDigits:2,maximumFractionDigits:2}).format(amount):formatPrice(amount);
