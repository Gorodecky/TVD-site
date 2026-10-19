import { useState } from 'react';
import { ArrowUpRight, ChevronDown, Menu, Search, ShoppingCart, UserRound, X } from 'lucide-react';
import MegaMenu from '../navigation/MegaMenu';
import type { Page } from '../../types';

type Props = { menu: boolean; cartCount: number; query: string; setMenu: (open: boolean) => void; setQuery: (query: string) => void; go: (page: Page) => void; onSearch: (query:string)=>void };
const links: {label:string;page:Page}[] = [{label:'Бренди',page:'brands'},{label:'Інженерні рішення',page:'solutions'},{label:'База знань',page:'knowledge'},{label:'Співпраця',page:'cooperation'},{label:'Сервіс і підтримка',page:'support'},{label:'Про компанію',page:'about'}];
export default function Header({ menu, cartCount, query, setMenu, setQuery, go, onSearch }: Props) {
  const [mobileNav,setMobileNav]=useState(false);
  const b2bUrl=import.meta.env.VITE_B2B_URL as string|undefined;
  const submit=(e:React.FormEvent)=>{e.preventDefault();onSearch(query);setMenu(false);};
  return <>
    <div className="topline"><div className="wrap topline-inner"><span>Інженерне обладнання для фахівців і дому</span><div className="top-right"><span>Вінниця · доставка по Україні</span><a href="tel:+380800000000">0 800 33 44 55</a></div></div></div>
    <header className="header"><div className="wrap header-main">
      <button className="mobile-menu-toggle" aria-label={mobileNav?'Закрити меню':'Відкрити меню'} onClick={()=>setMobileNav(!mobileNav)}>{mobileNav?<X/>:<Menu/>}</button>
      <button className="logo" onClick={()=>go('home')} aria-label="TVD — на головну"><img className="logo-image" src="/logo_tvd_new2.png" alt="TVD"/><span className="logo-caption">ІНЖЕНЕРНІ СИСТЕМИ</span></button>
      <button className={`catalog-button ${menu?'selected':''}`} onClick={()=>setMenu(!menu)}><Menu size={18}/><span>Каталог</span><ChevronDown size={15}/></button>
      <form className="search" onSubmit={submit}><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Товар, бренд або артикул" aria-label="Пошук товарів"/><button type="submit">Знайти</button></form>
      <div className="header-actions"><button className="icon-button account-short" onClick={()=>go('account')}><UserRound/><span>Кабінет</span></button><button className="icon-button cart-short" onClick={()=>go('cart')}><ShoppingCart/><span>Кошик</span>{cartCount>0&&<b>{cartCount}</b>}</button></div>
      {b2bUrl&&<a className="b2b-link" href={b2bUrl} target="_blank" rel="noreferrer">B2B кабінет <ArrowUpRight size={15}/></a>}
    </div>
    <nav className="wrap nav" aria-label="Основна навігація"><button onClick={()=>go('category')}>Каталог</button>{links.map(item=><button key={item.page} onClick={()=>go(item.page)}>{item.label}</button>)}<button className="nav-assistant" onClick={()=>go('assistant')}>Підбір обладнання <span>Скоро</span></button></nav>
    {menu&&<MegaMenu onSelect={go} onClose={()=>setMenu(false)}/>}
    {mobileNav&&<div className="mobile-nav"><button onClick={()=>{go('category');setMobileNav(false)}}>Каталог обладнання</button>{links.map(item=><button key={item.page} onClick={()=>{go(item.page);setMobileNav(false)}}>{item.label}</button>)}<button onClick={()=>{go('assistant');setMobileNav(false)}}>Підбір обладнання <span>Скоро</span></button>{b2bUrl&&<a href={b2bUrl} target="_blank" rel="noreferrer">B2B кабінет <ArrowUpRight size={15}/></a>}</div>}
    </header>
  </>;
}
