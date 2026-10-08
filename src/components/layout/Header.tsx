import { ChevronDown, Clock3, Menu, Search, ShoppingCart, UserRound, Zap } from 'lucide-react';
import MegaMenu from '../navigation/MegaMenu';
import type { Page } from '../../types';

type HeaderProps = { page: Page; menu: boolean; cartCount: number; query: string; setMenu: (open: boolean) => void; setQuery: (query: string) => void; go: (page: Page) => void };

export default function Header({ menu, cartCount, query, setMenu, setQuery, go }: HeaderProps) {
  return <>
    <div className="topline"><div className="wrap topline-inner"><div className="toplinks"><span>Для професіоналів та бізнесу</span><button onClick={()=>go('category')}>Бренди</button><button onClick={()=>go('category')}>Акції</button><button onClick={()=>go('category')}>Доставка й оплата</button></div><div className="top-right"><span><Clock3 size={14}/> Пн–Пт 9:00–18:00</span><a href="tel:+380800000000">0 800 33 44 55</a><button className="lang">UA <ChevronDown size={13}/></button></div></div></div>
    <header className="header"><div className="wrap header-main"><button className="logo" onClick={()=>go('home')} aria-label="TVD — на головну"><img className="logo-image" src="/logo_tvd_new2.png" alt="TVD" /><span className="logo-caption">ІНЖЕНЕРНІ СИСТЕМИ</span></button><button className={`catalog-button ${menu?'selected':''}`} onClick={()=>setMenu(!menu)}><Menu size={19}/>{menu?'Закрити':'Каталог'}<ChevronDown size={15}/></button><label className="search"><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Знайти товар, бренд або артикул"/><kbd>⌘ K</kbd><button aria-label="Шукати" onClick={()=>go('category')}>Знайти</button></label><button className="icon-button account-short" onClick={()=>go('account')}><UserRound/><span>Кабінет</span></button><button className="icon-button cart-short" onClick={()=>go('cart')}><ShoppingCart/><span>Кошик</span>{cartCount>0&&<b>{cartCount}</b>}</button></div>
      <nav className="wrap nav"><button onClick={()=>go('category')}>Опалення <ChevronDown size={14}/></button><button onClick={()=>go('category')}>Водопостачання <ChevronDown size={14}/></button><button onClick={()=>go('category')}>Кондиціювання <ChevronDown size={14}/></button><button onClick={()=>go('category')}>Водопідготовка <ChevronDown size={14}/></button><button onClick={()=>go('category')}>Каналізація <ChevronDown size={14}/></button><button onClick={()=>go('category')}>Електрика <ChevronDown size={14}/></button><span className="nav-spacer"/><span className="delivery"><Zap size={14}/> Відправка сьогодні</span></nav>
      {menu&&<MegaMenu onSelect={()=>go('category')}/>}
    </header>
  </>;
}
