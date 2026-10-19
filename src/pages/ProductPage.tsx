import { Check, ChevronRight, ShoppingCart, Heart } from 'lucide-react';
import { formatProductPrice, type Product } from '../data';

export default function ProductPage({product:p,add}:{product:Product;add:(p:Product)=>void}) {
  const isRadiator=Boolean(p.connection);
  const connectionLabel=p.connection==='K'?'Бокове підключення · K':'Нижнє підключення · VK';
  const stockKnown=p.stockQty!==null&&p.stockQty!==undefined;
  return <div className="wrap page-content"><nav className="breadcrumbs" aria-label="Навігаційний шлях"><a href="/">Головна</a><ChevronRight size={13}/><span>Опалення</span><ChevronRight size={13}/><a href="/catalog/radiatory">Радіатори</a><ChevronRight size={13}/><b>{p.brand}</b></nav>
    <div className="detail-layout"><div className="detail-image"><img src={p.image} alt={p.name}/>{p.connection&&<span className="badge">{p.connection==='K'?'Бокове K':'Нижнє VK'}</span>}</div>
      <div className="detail-info"><p className="eyebrow">{p.brand.toUpperCase()}</p><h1>{p.name}</h1>{p.connection&&<div className="connection-label">{connectionLabel}</div>}
        <span className="sku">Артикул: {p.code}{p.internalCode&&<span> · Код 1С: {p.internalCode}</span>}</span>
        <div className={stockKnown&&p.stockQty!>0?'detail-stock':'detail-stock unknown-stock'}>{stockKnown&&p.stockQty!>0&&<i/>}{p.stock}</div>
        <hr/><div className="detail-price">{formatProductPrice(p)}{p.oldPrice&&<del>{formatProductPrice(p,p.oldPrice)}</del>}</div>
        <p className="detail-note">{p.priceCurrency==='source'?'Ціна з виписки 1С; валюту у файлі не зазначено.':'Ціна з ПДВ · Для партнерів доступні спеціальні умови'}</p>
        <button className="button button-red buy-button" onClick={()=>add(p)}><ShoppingCart size={18}/> Додати до кошика</button><button className="button outline-button"><Heart size={17}/> До обраного</button>
        <div className="detail-benefits"><p><Check/> Допомога з підбором обладнання</p><p><Check/> Доставка по всій Україні</p></div>
      </div>
    </div>
    <section className="section"><h2>Характеристики та документація</h2>{isRadiator?<dl className="spec-grid">
      <div><dt>Бренд</dt><dd>{p.brand}</dd></div><div><dt>Тип</dt><dd>{p.model}</dd></div><div><dt>Підключення</dt><dd>{connectionLabel}</dd></div>
      <div><dt>Розмір (В × Ш)</dt><dd>{p.heightMm} × {p.widthMm} мм</dd></div><div><dt>Теплова потужність</dt><dd>{p.powerW?.toLocaleString('uk-UA')} Вт</dd></div>
      <div><dt>Залишок за випискою</dt><dd>{stockKnown?String(p.stockQty)+' шт.':'Не вказаний'}</dd></div>
    </dl>:<p className="muted">Докладні технічні характеристики будуть додані на наступному етапі прототипу.</p>}</section>
  </div>;
}
