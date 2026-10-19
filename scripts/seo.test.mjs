import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve('dist');
const origin = 'https://tvd.vn.ua';
const read = (file) => readFileSync(path.join(root, file), 'utf8');

test('build contains unique Ukrainian metadata and canonical URLs', () => {
  const home = read('index.html');
  const knowledge = read('knowledge/index.html');
  assert.match(home, /<html lang="uk">/);
  assert.match(home, /<title>TVD — інженерне обладнання/);
  assert.match(home, /rel="canonical" href="https:\/\/tvd\.vn\.ua\/"/);
  assert.match(knowledge, /<title>База знань TVD/);
  assert.match(knowledge, /property="og:title" content="База знань TVD/);
  assert.notEqual(home.match(/<title>(.*?)<\/title>/)?.[1], knowledge.match(/<title>(.*?)<\/title>/)?.[1]);
});

test('published article route has rendered body and Article/Breadcrumb JSON-LD', () => {
  const article = read('knowledge/viessmann-heat-pump-90-m2-house/index.html');
  assert.match(article, /<h1>Як підібрати тепловий насос Viessmann/);
  assert.match(article, /Vitocal 150-A/);
  assert.match(article, /"@type":"Article"/);
  assert.match(article, /"@type":"BreadcrumbList"/);
  assert.match(article, /<meta name="robots" content="index,follow"/);
});

test('product route uses real catalog data without inventing an Offer', () => {
  const product = read('catalog/radiatory/11k-500-400-mm-53056/index.html');
  assert.match(product, /<h1>11K · 500 × 400 мм<\/h1>/);
  assert.match(product, /"@type":"Product"/);
  assert.doesNotMatch(product, /"@type":"Offer"/);
  assert.match(product, /rel="canonical" href="https:\/\/tvd\.vn\.ua\/catalog\/radiatory\/11k-500-400-mm-53056"/);
});

test('sitemap contains clean canonical URLs for products, category pages, and articles', () => {
  const sitemap = read('sitemap.xml');
  assert.match(sitemap, new RegExp(`${origin}/knowledge/viessmann-heat-pump-90-m2-house`));
  assert.match(sitemap, new RegExp(`${origin}/knowledge/category/heat-pumps`));
  assert.match(sitemap, new RegExp(`${origin}/catalog/radiatory/11k-500-400-mm-53056`));
  assert.doesNotMatch(sitemap, /<loc>[^<]*\?/);
  const locs = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  assert.equal(locs.length, new Set(locs).size);
  assert.equal(locs.length, 329); // 9 static routes, 2 non-empty knowledge categories, 3 articles, 315 products
});

test('404 page is marked noindex and excluded from the sitemap', () => {
  const notFound = read('404.html');
  assert.match(notFound, /<h1>Сторінку не знайдено<\/h1>/);
  assert.match(notFound, /name="robots" content="noindex,follow"/);
  assert.doesNotMatch(notFound, /rel="canonical"/);
  assert.doesNotMatch(read('sitemap.xml'), /\/404(?:\.html)?</);
  assert.ok(existsSync(path.join(root, 'robots.txt')));
  assert.match(read('robots.txt'), /Sitemap: https:\/\/tvd\.vn\.ua\/sitemap\.xml/);
});
