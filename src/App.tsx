import { useCallback, useEffect, useState } from 'react';
import type { Product } from './types';
import { addCartItem, adaptProduct, getCart, getProducts, removeCartItem, updateCartItem, type CartData } from './api';
import type { Page } from './types';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import RadiatorCategoryPage from './pages/RadiatorCategoryPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import AccountPage from './pages/AccountPage';
import InformationPage from './pages/InformationPage';
import SelectionAssistantPage from './pages/SelectionAssistantPage';
import KnowledgePage from './pages/KnowledgePage';
import KnowledgeArticlePage from './pages/KnowledgeArticlePage';
import { knowledgeRepository } from './knowledge/content';

const pathFor: Partial<Record<Page, string>> = { home: '/', category: '/catalog', product: '/catalog', cart: '/cart', account: '/account', brands: '/brands', solutions: '/solutions', cooperation: '/cooperation', support: '/support', about: '/about', assistant: '/selection-assistant', knowledge: '/knowledge' };
function routeFromPath() { const pathname = window.location.pathname.replace(/\/+$/, '') || '/'; const article = pathname.match(/^\/knowledge\/([^/]+)$/); return article ? { page: 'knowledge-article' as Page, slug: article[1] } : { page: ({ '/':'home', '/catalog':'category', '/category':'category', '/cart':'cart', '/account':'account', '/brands':'brands', '/solutions':'solutions', '/cooperation':'cooperation', '/support':'support', '/about':'about', '/selection-assistant':'assistant', '/knowledge':'knowledge' }[pathname] as Page) || 'home', slug: '' }; }

function App() {
  const [page, setPage] = useState<Page>(() => routeFromPath().page);
  const [articleSlug, setArticleSlug] = useState(() => routeFromPath().slug);
  const [menu, setMenu] = useState(false);
  const [cart, setCart] = useState<CartData | null>(null);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [catalogError, setCatalogError] = useState('');
  const [catalogLoading,setCatalogLoading]=useState(true);
  const loadCatalog = useCallback((filters:Record<string,string|number>={}) => {setCatalogLoading(true);return getProducts({pageSize:100,...filters}).then(async r=>{const pages=await Promise.all(Array.from({length:Math.max(0,r.pagination.pages-1)},(_,i)=>getProducts({page:i+2,pageSize:100,...filters})));setCatalog([...r.items,...pages.flatMap(p=>p.items)].map(adaptProduct));setCatalogError('');}).catch(e=>setCatalogError(e.message)).finally(()=>setCatalogLoading(false));},[]);
  useEffect(()=>{void loadCatalog();void getCart().then(setCart).catch(()=>setCart({id:'',items:[]}));},[]);
  const [query, setQuery] = useState('');
  const [activeProduct, setActiveProduct] = useState<Product>({id:'',name:'',brand:'TVD',code:'',price:0,image:'/radiator-k.png',stock:'Наявність уточнюється'});
  const cartCount = cart?.items.reduce((sum,item)=>sum+Number(item.quantity),0) ?? 0;
  const [searchQuery, setSearchQuery] = useState('');
  useEffect(() => { const onPop = () => { const route = routeFromPath(); setPage(route.page); setArticleSlug(route.slug); setMenu(false); }; window.addEventListener('popstate', onPop); return () => window.removeEventListener('popstate', onPop); }, []);
  const go = (nextPage: Page, slug?: string) => { setPage(nextPage); setArticleSlug(nextPage === 'knowledge-article' ? slug ?? '' : ''); setMenu(false); const path = nextPage === 'knowledge-article' && slug ? `/knowledge/${encodeURIComponent(slug)}` : pathFor[nextPage] ?? '/knowledge'; if (window.location.pathname !== path) window.history.pushState({}, '', path); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const openArticle = (slug: string) => go('knowledge-article', slug);
  const search = (value: string) => { setSearchQuery(value); void loadCatalog(value.trim() ? { q: value.trim() } : {}); go('category'); };
  const add = (product: Product) => { void addCartItem(product.id).then(setCart).catch(e=>alert(e.message)); };
  const refreshCart=()=>getCart().then(setCart);
  const showProduct = (product: Product) => { setActiveProduct(product); go('product'); };

  return <div className="app">
    <Header menu={menu} cartCount={cartCount} query={query} setMenu={setMenu} setQuery={setQuery} go={go} onSearch={search} />
    <main>{page === 'home' ? <HomePage products={catalog} loading={catalogLoading} error={catalogError} retry={loadCatalog} add={add} showProduct={showProduct} go={go} articles={knowledgeRepository.recommended(3)} onArticle={openArticle} />
      : page === 'category' ? <RadiatorCategoryPage products={catalog} loading={catalogLoading} error={catalogError} retry={loadCatalog} onProduct={showProduct} add={add} initialSearch={searchQuery} onAssistant={()=>go('assistant')} />
      : page === 'product' ? <ProductPage product={activeProduct} add={add} />
      : page === 'cart' ? <CartPage cart={cart} refresh={refreshCart} update={(id,q)=>updateCartItem(id,q).then(setCart)} remove={id=>removeCartItem(id).then(setCart)} go={go} />
      : page === 'account' ? <AccountPage />
      : page === 'assistant' ? <SelectionAssistantPage go={go} />
      : page === 'knowledge' ? <KnowledgePage onArticle={openArticle} />
      : page === 'knowledge-article' ? <KnowledgeArticlePage slug={articleSlug} products={catalog} go={go} onArticle={openArticle} onProduct={showProduct} add={add} />
      : <InformationPage page={page} go={go} products={catalog} />}</main>
    <Footer go={go} />
  </div>;
}

export default App;
