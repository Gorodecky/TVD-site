import { useCallback, useEffect, useState } from 'react';
import type { Product, Page } from './types';
import { addCartItem, adaptProduct, getCart, getProducts, removeCartItem, updateCartItem, type CartData } from './api';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Seo from './components/Seo';
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
import { knowledgeCategories } from './knowledge/types';
import { buildArticleSchema, buildBreadcrumbSchema, buildProductSchema, productPath } from './seo';
import { fromBase, withBase } from './paths';

type Route = { page: Page; slug: string; productId: string };
const categoryPath = '/catalog/radiatory';
const staticRoutes: Record<string, Page> = { '/':'home', '/catalog':'category', '/category':'category', [categoryPath]:'category', '/cart':'cart', '/account':'account', '/brands':'brands', '/solutions':'solutions', '/cooperation':'cooperation', '/support':'support', '/about':'about', '/selection-assistant':'assistant', '/knowledge':'knowledge' };
function routeFromPath(): Route {
  const pathname = fromBase(window.location.pathname).replace(/\/+$/, '') || '/';
  const article = pathname.match(/^\/knowledge\/([^/]+)$/);
  if (article) return { page:'knowledge-article', slug:decodeURIComponent(article[1]), productId:'' };
  const knowledgeCategory = pathname.match(/^\/knowledge\/category\/([^/]+)$/);
  if (knowledgeCategory) return { page:'knowledge-category', slug:decodeURIComponent(knowledgeCategory[1]), productId:'' };
  const product = pathname.match(/^\/catalog\/radiatory\/([^/]+)$/);
  if (product) return { page:'product', slug:product[1], productId:decodeURIComponent(product[1].match(/-([^-/]+)$/)?.[1] ?? '') };
  return { page:staticRoutes[pathname] ?? 'not-found', slug:'', productId:'' };
}

const pageSeo: Partial<Record<Page, { title:string; description:string }>> = {
  home:{title:'TVD — інженерне обладнання для опалення, води та клімату',description:'Обладнання для опалення, водопостачання та клімату. TVD — підтримка інженерних проєктів у Вінниці та доставка по Україні.'},
  category:{title:'Сталеві панельні радіатори — каталог TVD',description:'Каталог сталевих панельних радіаторів Terra Teknik і Rens. Перегляньте моделі, розміри, типи підключення й характеристики товарів TVD.'},
  knowledge:{title:'База знань TVD — інженерні системи та обладнання',description:'Матеріали TVD про теплові насоси, газові котли, альтернативне опалення та очищення стічних вод.'},
  cart:{title:'Кошик — TVD',description:'Перегляньте товари, додані до кошика TVD.'}, account:{title:'Кабінет партнера — TVD',description:'Перехід до окремої B2B-платформи TVD для партнерів.'},
  assistant:{title:'Підбір обладнання — TVD',description:'Інформаційна сторінка майбутнього помічника з підбору обладнання TVD.'},
  brands:{title:'Бренди інженерного обладнання — TVD',description:'Бренди, представлені в каталозі інженерного обладнання TVD.'},
  solutions:{title:'Інженерні рішення — TVD',description:'Інженерні рішення та обладнання для опалення, водопостачання і клімату від TVD.'},
  cooperation:{title:'Співпраця з TVD — Вінниця та Україна',description:'Умови співпраці з TVD для магазинів, оптових партнерів та монтажних організацій у Вінниці й області.'},
  support:{title:'Сервіс і технічна підтримка — TVD',description:'Технічна підтримка та консультації щодо інженерного обладнання TVD.'},
  about:{title:'Про компанію TVD — інженерні системи',description:'TVD — постачальник обладнання для опалення, водопостачання, вентиляції та клімату.'},
};
const infoPageFor = (page:Page) => page === 'brands' || page === 'solutions' || page === 'cooperation' || page === 'support' || page === 'about';

function NotFound() { return <section className="wrap page-content"><p className="eyebrow">404 · СТОРІНКУ НЕ ЗНАЙДЕНО</p><h1>Такої сторінки немає</h1><p>Перевірте адресу або поверніться до каталогу TVD.</p><a className="button button-red" href={withBase('/')}>На головну</a></section>; }

function App() {
  const [route, setRoute] = useState<Route>(routeFromPath);
  const { page, slug, productId } = route;
  const [menu, setMenu] = useState(false);
  const [cart, setCart] = useState<CartData | null>(null);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [catalogError, setCatalogError] = useState('');
  const [catalogLoading,setCatalogLoading]=useState(true);
  const loadCatalog = useCallback((filters:Record<string,string|number>={}) => {setCatalogLoading(true);return getProducts({pageSize:100,...filters}).then(async r=>{const pages=await Promise.all(Array.from({length:Math.max(0,r.pagination.pages-1)},(_,i)=>getProducts({page:i+2,pageSize:100,...filters})));setCatalog([...r.items,...pages.flatMap(p=>p.items)].map(adaptProduct));setCatalogError('');}).catch(e=>setCatalogError(e.message)).finally(()=>setCatalogLoading(false));},[]);
  useEffect(()=>{void loadCatalog();void getCart().then(setCart).catch(()=>setCart({id:'',items:[]}));},[loadCatalog]);
  const [query, setQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const cartCount = cart?.items.reduce((sum,item)=>sum+Number(item.quantity),0) ?? 0;
  useEffect(() => { const onPop = () => { setRoute(routeFromPath()); setMenu(false); }; window.addEventListener('popstate', onPop); return () => window.removeEventListener('popstate', onPop); }, []);
  useEffect(() => { if (page === 'product' && productId) { const found = catalog.find((product) => product.id === productId); if (found) setActiveProduct(found); } }, [page, productId, catalog]);
  const go = (nextPage: Page, nextSlug?: string) => {
    let path = nextPage === 'knowledge-article' && nextSlug ? `/knowledge/${encodeURIComponent(nextSlug)}`
      : nextPage === 'knowledge-category' && nextSlug ? `/knowledge/category/${encodeURIComponent(nextSlug)}`
      : nextPage === 'category' ? categoryPath : ({ home:'/',cart:'/cart',account:'/account',brands:'/brands',solutions:'/solutions',cooperation:'/cooperation',support:'/support',about:'/about',assistant:'/selection-assistant',knowledge:'/knowledge' } as Partial<Record<Page,string>>)[nextPage] ?? '/';
    const next = routeFromPathFor(nextPage, nextSlug);
    setRoute(next); setMenu(false);
    if (window.location.pathname !== withBase(path) || window.location.search) window.history.pushState({}, '', withBase(path));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const openArticle = (articleSlug: string) => go('knowledge-article', articleSlug);
  const search = (value: string) => { setSearchQuery(value); void loadCatalog(value.trim() ? { q: value.trim() } : {}); go('category'); };
  const add = (product: Product) => { void addCartItem(product.id).then(setCart).catch(e=>alert(e.message)); };
  const refreshCart=()=>getCart().then(setCart);
  const showProduct = (product: Product) => { setActiveProduct(product); const path=productPath(product); const parts=path.split('/'); setRoute({page:'product',slug:parts[parts.length-1] ?? '',productId:product.id}); setMenu(false); if(window.location.pathname!==withBase(path)||window.location.search)window.history.pushState({},'',withBase(path)); window.scrollTo({top:0,behavior:'smooth'}); };

  const article = page === 'knowledge-article' ? knowledgeRepository.getBySlug(slug) : undefined;
  const selectedKnowledgeCategory = page === 'knowledge-category' ? knowledgeCategories.find((item) => item.slug === slug) : undefined;
  const currentProduct = page === 'product' ? activeProduct : null;
  const pageInfo = pageSeo[page];
  const title = article ? `${article.title} — База знань TVD` : currentProduct ? `${currentProduct.name} — ${currentProduct.brand} | TVD` : page === 'knowledge-category' && selectedKnowledgeCategory ? `${selectedKnowledgeCategory.title} — База знань TVD` : pageInfo?.title ?? 'Сторінку не знайдено — TVD';
  const description = article ? article.description : currentProduct ? `Товар ${currentProduct.name}, бренд ${currentProduct.brand}. Артикул: ${currentProduct.code}. Перегляньте ціну та наявність у каталозі TVD.` : page === 'knowledge-category' && selectedKnowledgeCategory ? `Матеріали TVD: ${selectedKnowledgeCategory.title.toLocaleLowerCase('uk-UA')}.` : pageInfo?.description ?? 'Запитувану сторінку TVD не знайдено.';
  const path = article ? `/knowledge/${article.slug}` : currentProduct ? productPath(currentProduct) : page === 'knowledge-category' && selectedKnowledgeCategory ? `/knowledge/category/${selectedKnowledgeCategory.slug}` : page === 'category' ? categoryPath : page === 'not-found' || (page === 'knowledge-article' && !article) ? window.location.pathname : ({home:'/',cart:'/cart',account:'/account',brands:'/brands',solutions:'/solutions',cooperation:'/cooperation',support:'/support',about:'/about',assistant:'/selection-assistant',knowledge:'/knowledge'} as Partial<Record<Page,string>>)[page] ?? '/';
  const schemas: unknown[] = [];
  if (article) schemas.push(buildArticleSchema(article), buildBreadcrumbSchema([{name:'Головна',path:'/'},{name:'База знань',path:'/knowledge'},{name:article.title,path:`/knowledge/${article.slug}`} ]));
  else if (currentProduct) schemas.push(buildProductSchema(currentProduct, path), buildBreadcrumbSchema([{name:'Головна',path:'/'},{name:'Каталог',path:categoryPath},{name:currentProduct.name,path}]));
  else if (page === 'category') schemas.push(buildBreadcrumbSchema([{name:'Головна',path:'/'},{name:'Каталог радіаторів',path:categoryPath}]));
  else if (page === 'knowledge-category' && selectedKnowledgeCategory) schemas.push(buildBreadcrumbSchema([{name:'Головна',path:'/'},{name:'База знань',path:'/knowledge'},{name:selectedKnowledgeCategory.title,path}]));
  const missingProduct = page==='product' && !catalogLoading && !currentProduct;
  const noIndex = page === 'cart' || page === 'account' || page === 'not-found' || missingProduct || (page === 'knowledge-article' && !article) || (page === 'knowledge-category' && (!selectedKnowledgeCategory || knowledgeRepository.list({category:slug}).length===0)) || Boolean(window.location.search);
  const noCanonical = page==='not-found' || missingProduct || (page==='knowledge-article' && !article) || (page==='knowledge-category' && !selectedKnowledgeCategory);

  const waitForDirectProduct = page==='product' && catalogLoading && !currentProduct;
  return <div className="app">
    {!waitForDirectProduct && <Seo title={title} description={description} path={path} image={article?.cover ?? currentProduct?.image} type={article ? 'article' : 'website'} noIndex={noIndex} noCanonical={noCanonical} schemas={schemas} />}
    <Header menu={menu} cartCount={cartCount} query={query} setMenu={setMenu} setQuery={setQuery} go={go} onSearch={search} />
    <main>{page === 'home' ? <HomePage products={catalog} loading={catalogLoading} error={catalogError} retry={loadCatalog} add={add} showProduct={showProduct} go={go} articles={knowledgeRepository.recommended(3)} onArticle={openArticle} />
      : page === 'category' ? <RadiatorCategoryPage products={catalog} loading={catalogLoading} error={catalogError} retry={loadCatalog} onProduct={showProduct} add={add} initialSearch={searchQuery} onAssistant={()=>go('assistant')} />
      : page === 'product' ? currentProduct ? <ProductPage product={currentProduct} add={add} /> : <section className="wrap page-content"><h1>{catalogLoading?'Завантажуємо товар…':'Товар не знайдено'}</h1>{!catalogLoading&&<a className="button button-red" href={withBase(categoryPath)}>До каталогу</a>}</section>
      : page === 'cart' ? <CartPage cart={cart} refresh={refreshCart} update={(id,q)=>updateCartItem(id,q).then(setCart)} remove={id=>removeCartItem(id).then(setCart)} go={go} />
      : page === 'account' ? <AccountPage />
      : page === 'assistant' ? <SelectionAssistantPage go={go} />
      : page === 'knowledge' ? <KnowledgePage onArticle={openArticle} />
      : page === 'knowledge-category' ? selectedKnowledgeCategory ? <KnowledgePage key={slug} initialCategory={slug} onArticle={openArticle} /> : <NotFound />
      : page === 'knowledge-article' ? <KnowledgeArticlePage slug={slug} products={catalog} go={go} onArticle={openArticle} onProduct={showProduct} add={add} />
      : infoPageFor(page) ? <InformationPage page={page} go={go} products={catalog} />
      : <NotFound />}</main>
    <Footer go={go} />
  </div>;
}

function routeFromPathFor(page: Page, slug?: string): Route {
  if (page === 'knowledge-article') return { page, slug: slug ?? '', productId:'' };
  if (page === 'knowledge-category') return { page, slug: slug ?? '', productId:'' };
  return { page, slug:'', productId:'' };
}

export default App;
