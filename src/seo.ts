import type { Product } from './types';

export const SITE_ORIGIN = (import.meta.env.VITE_SITE_URL || 'https://tvd.vn.ua').replace(/\/+$/, '');

const transliteration: Record<string, string> = { а:'a', б:'b', в:'v', г:'h', ґ:'g', д:'d', е:'e', є:'ye', ж:'zh', з:'z', и:'y', і:'i', ї:'yi', й:'y', к:'k', л:'l', м:'m', н:'n', о:'o', п:'p', р:'r', с:'s', т:'t', у:'u', ф:'f', х:'kh', ц:'ts', ч:'ch', ш:'sh', щ:'shch', ь:'', ю:'yu', я:'ya' };

export function slugify(value: string) {
  return value.toLocaleLowerCase('uk-UA').split('').map((character) => transliteration[character] ?? character)
    .join('').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function productPath(product: Pick<Product, 'id' | 'name'>) {
  return `/catalog/radiatory/${slugify(product.name)}-${encodeURIComponent(product.id)}`;
}

export function safeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

export function buildOrganizationSchema(origin = SITE_ORIGIN) {
  return {
    '@context': 'https://schema.org', '@type': 'Organization', name: 'TVD', url: `${origin}/`,
    logo: `${origin}/logo_tvd_new2.png`, areaServed: { '@type': 'Country', name: 'Україна' },
  };
}

export function buildWebSiteSchema(origin = SITE_ORIGIN) {
  return {
    '@context': 'https://schema.org', '@type': 'WebSite', name: 'TVD — Інженерні системи', url: `${origin}/`, inLanguage: 'uk-UA',
    potentialAction: { '@type': 'SearchAction', target: `${origin}/catalog/radiatory?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
  };
}

export function buildBreadcrumbSchema(items: { name: string; path: string }[], origin = SITE_ORIGIN) {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: `${origin}${item.path}` })) };
}

export function buildProductSchema(product: Product, path: string, origin = SITE_ORIGIN) {
  const productImage = /^https?:\/\//i.test(product.image) ? product.image : `${origin}${product.image.startsWith('/') ? '' : '/'}${product.image}`;
  const data: Record<string, unknown> = { '@context': 'https://schema.org', '@type': 'Product', name: product.name, image: [productImage], sku: product.code, brand: { '@type': 'Brand', name: product.brand }, url: `${origin}${path}` };
  if (product.priceCurrency === 'UAH' && Number.isFinite(product.price) && product.price > 0) {
    data.offers = { '@type': 'Offer', price: product.price, priceCurrency: 'UAH', ...(product.stockQty == null ? {} : { availability: product.stockQty > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' }), url: `${origin}${path}` };
  }
  return data;
}

export function buildArticleSchema(article: { title: string; description: string; slug: string; cover: string; author: string; publishedAt: string; updatedAt: string }, origin = SITE_ORIGIN) {
  return { '@context': 'https://schema.org', '@type': 'Article', headline: article.title, description: article.description, image: [`${origin}${article.cover}`], author: { '@type': 'Organization', name: article.author }, publisher: buildOrganizationSchema(origin), datePublished: article.publishedAt, dateModified: article.updatedAt, mainEntityOfPage: `${origin}/knowledge/${article.slug}`, inLanguage: 'uk-UA' };
}
