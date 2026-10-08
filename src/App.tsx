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

function App() {
  const [page, setPage] = useState<Page>('home');
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
  const go = (nextPage: Page) => { setPage(nextPage); setMenu(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const add = (product: Product) => { void addCartItem(product.id).then(setCart).catch(e=>alert(e.message)); };
  const refreshCart=()=>getCart().then(setCart);
  const showProduct = (product: Product) => { setActiveProduct(product); go('product'); };

  return <div className="app">
    <Header page={page} menu={menu} cartCount={cartCount} query={query} setMenu={setMenu} setQuery={setQuery} go={go} />
    <main>{page === 'home' ? <HomePage products={catalog} loading={catalogLoading} error={catalogError} retry={loadCatalog} add={add} showProduct={showProduct} go={go} />
      : page === 'category' ? <RadiatorCategoryPage products={catalog} loading={catalogLoading} error={catalogError} retry={loadCatalog} onProduct={showProduct} add={add} />
      : page === 'product' ? <ProductPage product={activeProduct} add={add} />
      : page === 'cart' ? <CartPage cart={cart} refresh={refreshCart} update={(id,q)=>updateCartItem(id,q).then(setCart)} remove={id=>removeCartItem(id).then(setCart)} go={go} />
      : <AccountPage />}</main>
    <Footer go={go} />
  </div>;
}

export default App;
