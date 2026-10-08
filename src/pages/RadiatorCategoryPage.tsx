import { useEffect, useState } from 'react';
import { Check, ChevronRight, Search } from 'lucide-react';
import type { Product } from '../types';
import ProductCard from '../components/catalog/ProductCard';
import Breadcrumbs from '../components/catalog/Breadcrumbs';

export default function RadiatorCategoryPage({products,loading,error,retry,onProduct,add}:{products:Product[];loading:boolean;error:string;retry:(filters?:Record<string,string|number>)=>void;onProduct:(p:Product)=>void;add:(p:Product)=>void}) {
  const radiators=products.filter(p=>p.connection);
  const [connection,setConnection]=useState<'all'|'K'|'VK'>('all');
  const [brand,setBrand]=useState('all');
  const [model,setModel]=useState('all');
  const [height,setHeight]=useState('all');
  const [search,setSearch]=useState('');
  const [sort,setSort]=useState('price-low');
  const [limit,setLimit]=useState(24);
  useEffect(()=>{const timer=window.setTimeout(()=>{const filters:Record<string,string|number>={};if(connection!=='all')filters.connection=connection;if(brand!=='all')filters.brand=brand;if(model!=='all')filters.model=model;if(height!=='all')filters.height=Number(height);if(search.trim())filters.q=search.trim();if(sort!=='price-low')filters.sort=sort;retry(filters);},250);return()=>window.clearTimeout(timer);},[connection,brand,model,height,search,sort,retry]);
  const countFor=(kind:'K'|'VK')=>radiators.filter(p=>p.connection===kind).length;
  const models=Array.from(new Set(radiators.map(p=>p.model).filter(Boolean))).sort();
  const heights=Array.from(new Set(radiators.map(p=>p.heightMm).filter((n):n is number=>n!==undefined))).sort((a,b)=>a-b);
  let filtered=radiators.filter(p=>(connection==='all'||p.connection===connection)&&(brand==='all'||p.brand===brand)&&(model==='all'||p.model===model)&&(height==='all'||String(p.heightMm)===height)&&(!search||(p.name+' '+p.brand+' '+p.code+' '+p.internalCode).toLowerCase().includes(search.toLowerCase())));
  filtered=[...filtered].sort((a,b)=>sort==='price-high'?b.price-a.price:sort==='power'?(b.powerW||0)-(a.powerW||0):a.price-b.price);
  const shown=filtered.slice(0,limit);
  const reset=()=>{setConnection('all');setBrand('all');setModel('all');setHeight('all');setSearch('');setLimit(24);};
  return <div className="wrap page-content radiator-page">
    <Breadcrumbs items={[{ label: 'Головна' }, { label: 'Опалення' }, { label: 'Радіатори' }, { label: 'Сталеві', current: true }]} />
    <div className="page-title"><div><p className="eyebrow">КАТАЛОГ TVD · ВИПИСКА 1С</p><h1>Сталеві панельні радіатори</h1><p>Terra Teknik та Rens · підбір за типом підключення й розміром</p></div><span className="result-count">{filtered.length} товарів</span></div>
    <div className="connection-picks">
      <button className={connection==='K'?'connection-card selected':'connection-card'} onClick={()=>{setConnection(connection==='K'?'all':'K');setLimit(24);}}><img src="/radiator-k.png" alt="Радіатор з боковим підключенням"/><span><b>Бокове підключення · K</b><small>{countFor('K')} моделей</small></span><ChevronRight size={17}/></button>
      <button className={connection==='VK'?'connection-card selected':'connection-card'} onClick={()=>{setConnection(connection==='VK'?'all':'VK');setLimit(24);}}><img src="/radiator-vk.png" alt="Радіатор з нижнім підключенням"/><span><b>Нижнє підключення · VK</b><small>{countFor('VK')} моделей</small></span><ChevronRight size={17}/></button>
    </div>
    <div className="price-source-note">Ціни наведені як у виписці 1С від 07.10.2026. Валюту у файлі не зазначено; залишок показаний лише для позицій, де він заповнений.</div>
    <div className="category-layout radiator-layout">
      <aside className="filters radiator-filters"><div className="filter-title"><b>Фільтри</b><button onClick={reset}>Скинути</button></div>
        <label className="filter-select">Підключення<select value={connection} onChange={e=>{setConnection(e.target.value as 'all'|'K'|'VK');setLimit(24);}}><option value="all">Усі типи</option><option value="K">Бокове K ({countFor('K')})</option><option value="VK">Нижнє VK ({countFor('VK')})</option></select></label>
        <label className="filter-select">Бренд<select value={brand} onChange={e=>{setBrand(e.target.value);setLimit(24);}}><option value="all">Усі бренди</option><option value="Terra Teknik">Terra Teknik</option><option value="Rens">Rens</option></select></label>
        <label className="filter-select">Тип радіатора<select value={model} onChange={e=>{setModel(e.target.value);setLimit(24);}}><option value="all">Усі типи</option>{models.map(m=><option key={m} value={m}>{m}</option>)}</select></label>
        <label className="filter-select">Висота<select value={height} onChange={e=>{setHeight(e.target.value);setLimit(24);}}><option value="all">Будь-яка</option>{heights.map(h=><option key={h} value={h}>{h} мм</option>)}</select></label>
        <div className="filter-stock"><Check size={15}/><span>Залишки з виписки 1С</span></div>
      </aside>
      <div className="rad-listing">{error?<div className="empty-filter"><h3>Не вдалося завантажити каталог</h3><p>{error}</p><button className="text-link" onClick={()=>retry()}>Спробувати ще раз</button></div>:loading?<p className="muted">Завантажуємо каталог…</p>:!products.length?<p className="muted">Каталог поки порожній.</p>:<><div className="category-toolbar radiator-toolbar"><span>Показано {shown.length?1:0}–{Math.min(limit,filtered.length)} із {filtered.length}</span>
        <div className="rad-toolbar-actions"><label className="rad-search"><Search size={15}/><input value={search} onChange={e=>{setSearch(e.target.value);setLimit(24);}} placeholder="Пошук за моделлю або артикулом"/></label>
        <select aria-label="Сортування товарів" value={sort} onChange={e=>setSort(e.target.value)}><option value="price-low">Спочатку дешевші</option><option value="price-high">Спочатку дорожчі</option><option value="power">За потужністю</option></select></div></div>
        {shown.length?<div className="product-grid category-products radiator-products">{shown.map(p=><ProductCard key={p.id} product={p} add={()=>add(p)} open={()=>onProduct(p)}/>)}</div>:<div className="empty-filter"><h3>За цими параметрами товарів не знайдено</h3><p>Змініть фільтри або пошуковий запит.</p><button className="text-link" onClick={reset}>Скинути фільтри</button></div>}
        {limit<filtered.length&&<button className="button outline-button load-more" onClick={()=>setLimit(n=>n+24)}>Показати ще {Math.min(24,filtered.length-limit)} товарів</button>}
      </>}</div>
    </div>
  </div>;
}
