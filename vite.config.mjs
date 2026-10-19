import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';

const root = path.dirname(fileURLToPath(import.meta.url));
let configuredSiteOrigin = 'https://tvd.vn.ua';
const articlesRoot = path.join(root, 'content/knowledge/articles');
const categories = new Set(['heat-pumps', 'gas-boilers', 'alternative-heating', 'wastewater-treatment']);
const statuses = new Set(['draft', 'published']);
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const virtualId = 'virtual:tvd-knowledge-index';
const resolvedVirtualId = `\0${virtualId}`;

function unquote(value) {
  const text = value.trim();
  if (text.startsWith('"') && text.endsWith('"')) return JSON.parse(text);
  if (text.startsWith("'") && text.endsWith("'")) return text.slice(1, -1).replaceAll("''", "'");
  return text;
}

function parseArray(value) {
  const text = value.trim();
  if (!text) return [];
  if (!text.startsWith('[') || !text.endsWith(']')) throw new Error(`Очікується YAML-масив: ${value}`);
  const inner = text.slice(1, -1).trim();
  if (!inner) return [];
  return inner.split(',').map(unquote);
}

function parseFrontmatter(source, file) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error(`Відсутній YAML frontmatter: ${path.relative(root, file)}`);
  const fields = {};
  let currentArray = '';
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const item = line.match(/^\s+-\s+(.+)$/);
    if (item && currentArray) { fields[currentArray].push(unquote(item[1])); continue; }
    const field = line.match(/^([A-Za-z][A-Za-z0-9]*):(?:\s*(.*))?$/);
    if (!field) throw new Error(`Некоректний frontmatter у ${path.relative(root, file)}: ${line}`);
    const [, key, raw = ''] = field;
    currentArray = '';
    if (!raw.trim()) { fields[key] = []; currentArray = key; }
    else if (raw.trim().startsWith('[')) fields[key] = parseArray(raw);
    else fields[key] = unquote(raw);
  }
  return { fields, body: match[2] };
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function safeUrl(value, image = false) {
  const url = value.trim();
  if (image) return url.startsWith('/knowledge/') && !url.includes('..') ? url : '';
  return /^(https?:\/\/|mailto:|\/|#)/i.test(url) && !url.startsWith('//') ? url : '';
}

function renderInline(source) {
  const tokenPattern = /(!?\[[^\]]*\]\([^\s)]+(?:\s+"[^"]*")?\)|\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|_[^_]+_|~~[^~]+~~)/g;
  let html = '';
  let position = 0;
  for (const match of source.matchAll(tokenPattern)) {
    const index = match.index ?? 0;
    html += escapeHtml(source.slice(position, index));
    const token = match[0];
    const image = token.match(/^!\[([^\]]*)\]\(([^\s)]+)/);
    const link = token.match(/^\[([^\]]*)\]\(([^\s)]+)/);
    if (image) {
      const src = safeUrl(image[2], true);
      html += src ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(image[1])}" loading="lazy">` : escapeHtml(token);
    } else if (link) {
      const href = safeUrl(link[2]);
      html += href ? `<a href="${escapeHtml(href)}" rel="noopener noreferrer">${renderInline(link[1])}</a>` : escapeHtml(token);
    } else if (token.startsWith('**')) html += `<strong>${escapeHtml(token.slice(2, -2))}</strong>`;
    else if (token.startsWith('~~')) html += `<del>${escapeHtml(token.slice(2, -2))}</del>`;
    else if (token.startsWith('`')) html += `<code>${escapeHtml(token.slice(1, -1))}</code>`;
    else if (token.startsWith('*') || token.startsWith('_')) html += `<em>${escapeHtml(token.slice(1, -1))}</em>`;
    position = index + token.length;
  }
  return html + escapeHtml(source.slice(position));
}

function cells(line) { return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim()); }
function isTableDivider(line) { return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line); }

function renderMarkdown(markdown, file) {
  const lines = markdown.replaceAll('\r\n', '\n').split('\n');
  const html = [];
  let i = 0;
  let paragraph = [];
  const flushParagraph = () => { if (paragraph.length) { html.push(`<p>${paragraph.map(renderInline).join('<br>')}</p>`); paragraph = []; } };
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { flushParagraph(); i++; continue; }
    const fence = line.match(/^```([\w-]*)\s*$/);
    if (fence) {
      flushParagraph(); const language = fence[1]; const start = ++i;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) i++;
      if (i === lines.length) throw new Error(`Незакритий блок коду: ${path.relative(root, file)}`);
      html.push(`<pre><code${language ? ` class="language-${escapeHtml(language)}"` : ''}>${escapeHtml(lines.slice(start, i).join('\n'))}</code></pre>`); i++; continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      flushParagraph(); const level = heading[1].length;
      if (level === 1) throw new Error(`У статті використовуйте заголовки H2–H6; H1 формується з title: ${path.relative(root, file)}`);
      html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`); i++; continue;
    }
    if (i + 1 < lines.length && lines[i + 1].includes('|') && isTableDivider(lines[i + 1])) {
      flushParagraph(); const headers = cells(line); const alignments = cells(lines[i + 1]).map((cell) => cell.startsWith(':') && cell.endsWith(':') ? 'center' : cell.endsWith(':') ? 'right' : 'left');
      const th = headers.map((cell, index) => `<th scope="col" style="text-align:${alignments[index] ?? 'left'}">${renderInline(cell)}</th>`).join('');
      const rows = []; i += 2;
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) { const values = cells(lines[i]); rows.push(`<tr>${headers.map((_, index) => `<td style="text-align:${alignments[index] ?? 'left'}">${renderInline(values[index] ?? '')}</td>`).join('')}</tr>`); i++; }
      html.push(`<div class="markdown-table-wrap"><table><thead><tr>${th}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`); continue;
    }
    const list = line.match(/^\s{0,3}([-+*]|\d+\.)\s+(.+)$/);
    if (list) {
      flushParagraph(); const ordered = /^\d/.test(list[1]); const items = [];
      while (i < lines.length) { const item = lines[i].match(/^\s{0,3}([-+*]|\d+\.)\s+(.+)$/); if (!item || /^\d/.test(item[1]) !== ordered) break; items.push(`<li>${renderInline(item[2])}</li>`); i++; }
      const tag = ordered ? 'ol' : 'ul'; html.push(`<${tag}>${items.join('')}</${tag}>`); continue;
    }
    if (/^>\s?/.test(line)) { flushParagraph(); const quote = []; while (i < lines.length && /^>\s?/.test(lines[i])) quote.push(lines[i++].replace(/^>\s?/, '')); html.push(`<blockquote><p>${quote.map(renderInline).join('<br>')}</p></blockquote>`); continue; }
    if (/^\s*(---+|\*\*\*+)\s*$/.test(line)) { flushParagraph(); html.push('<hr>'); i++; continue; }
    paragraph.push(line.trim()); i++;
  }
  flushParagraph();
  return html.join('\n');
}

function readArticle(file) {
  const source = readFileSync(file, 'utf8');
  const { fields, body } = parseFrontmatter(source, file);
  const required = ['title', 'slug', 'description', 'category', 'cover', 'author', 'status', 'publishedAt', 'updatedAt', 'tags'];
  const missing = required.filter((key) => fields[key] === undefined || fields[key] === '');
  if (missing.length) throw new Error(`У ${path.relative(root, file)} відсутні поля: ${missing.join(', ')}`);
  for (const key of ['title', 'slug', 'description', 'category', 'cover', 'author', 'status', 'publishedAt', 'updatedAt']) if (typeof fields[key] !== 'string') throw new Error(`Поле ${key} має бути рядком: ${path.relative(root, file)}`);
  if (!slugPattern.test(fields.slug)) throw new Error(`Некоректний slug у ${path.relative(root, file)}: ${fields.slug}`);
  if (!categories.has(fields.category)) throw new Error(`Невідома категорія у ${path.relative(root, file)}: ${fields.category}`);
  if (!statuses.has(fields.status)) throw new Error(`Статус має бути draft або published: ${path.relative(root, file)}`);
  if (!fields.cover.startsWith('/knowledge/') || fields.cover.includes('..') || !existsSync(path.join(root, 'public', fields.cover.slice(1)))) throw new Error(`Обкладинка не знайдена в public/: ${fields.cover} (${path.relative(root, file)})`);
  for (const key of ['publishedAt', 'updatedAt']) if (!datePattern.test(fields[key]) || new Date(`${fields[key]}T00:00:00Z`).toISOString().slice(0, 10) !== fields[key]) throw new Error(`Некоректна дата ${key} у ${path.relative(root, file)}`);
  if (fields.updatedAt < fields.publishedAt) throw new Error(`updatedAt не може бути раніше publishedAt: ${path.relative(root, file)}`);
  for (const key of ['tags', 'relatedCategories', 'relatedBrands', 'relatedProductIds']) if (fields[key] !== undefined && (!Array.isArray(fields[key]) || fields[key].some((value) => typeof value !== 'string'))) throw new Error(`Поле ${key} має бути масивом рядків: ${path.relative(root, file)}`);
  if (!body.trim()) throw new Error(`Текст статті порожній: ${path.relative(root, file)}`);
  const html = renderMarkdown(body, file);
  if (!html.trim()) throw new Error(`Не вдалося сформувати текст статті: ${path.relative(root, file)}`);
  return { title: fields.title, slug: fields.slug, description: fields.description, category: fields.category, cover: fields.cover, author: fields.author, status: fields.status, publishedAt: fields.publishedAt, updatedAt: fields.updatedAt, tags: fields.tags, relatedCategories: fields.relatedCategories ?? [], relatedBrands: fields.relatedBrands ?? [], relatedProductIds: fields.relatedProductIds ?? [], html };
}

function collectMarkdown(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? collectMarkdown(fullPath) : entry.isFile() && entry.name.endsWith('.md') ? [fullPath] : [];
  });
}

function knowledgeContent(isBuild) {
  let indexSource = 'export const knowledgeArticles = [];';
  let publishedArticles = [];
  const refreshIndex = () => {
    const files = collectMarkdown(articlesRoot);
    const articles = files.map(readArticle);
    const seen = new Map();
    for (const [index, article] of articles.entries()) {
      if (seen.has(article.slug)) throw new Error(`Slug "${article.slug}" повторюється у ${path.relative(root, seen.get(article.slug))} та ${path.relative(root, files[index])}`);
      seen.set(article.slug, files[index]);
    }
    const today = new Date().toISOString().slice(0, 10);
    publishedArticles = articles.filter((article) => article.status === 'published' && article.publishedAt <= today).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    indexSource = `export const knowledgeArticles = ${JSON.stringify(publishedArticles)};`;
  };
  const htmlEscape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
  const slugify = (value) => value.toLocaleLowerCase('uk-UA').replace(/[а-яіїєґ]/g, (character) => ({а:'a',б:'b',в:'v',г:'h',ґ:'g',д:'d',е:'e',є:'ye',ж:'zh',з:'z',и:'y',і:'i',ї:'yi',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ь:'',ю:'yu',я:'ya'}[character])).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const schema = (value) => JSON.stringify(value).replaceAll('<', '\\u003c');
  const staticPages = [
    {path:'/',title:'TVD — інженерне обладнання для опалення, води та клімату',description:'Обладнання для опалення, водопостачання та клімату. TVD — підтримка інженерних проєктів у Вінниці та доставка по Україні.',heading:'Надійна основа для ваших рішень.',body:'Обладнання для опалення, водопостачання та клімату. Допомагаємо професіоналам знаходити потрібне й реалізовувати інженерні проєкти.'},
    {path:'/catalog/radiatory',title:'Сталеві панельні радіатори — каталог TVD',description:'Каталог сталевих панельних радіаторів Terra Teknik і Rens. Перегляньте моделі, розміри, типи підключення й характеристики товарів TVD.',heading:'Сталеві панельні радіатори',body:'Terra Teknik та Rens · підбір за типом підключення й розміром.'},
    {path:'/knowledge',title:'База знань TVD — інженерні системи та обладнання',description:'Матеріали TVD про теплові насоси, газові котли, альтернативне опалення та очищення стічних вод.',heading:'База знань',body:'Матеріали про обладнання та інженерні системи від команди TVD.'},
    {path:'/brands',title:'Бренди інженерного обладнання — TVD',description:'Бренди, представлені в каталозі інженерного обладнання TVD.',heading:'Бренди',body:'Перегляньте бренди товарів у каталозі TVD.'},
    {path:'/solutions',title:'Інженерні рішення — TVD',description:'Інженерні рішення та обладнання для опалення, водопостачання і клімату від TVD.',heading:'Інженерні рішення',body:'Обладнання для систем опалення, водопостачання та клімату.'},
    {path:'/cooperation',title:'Співпраця з TVD — Вінниця та Україна',description:'Умови співпраці з TVD для магазинів, оптових партнерів та монтажних організацій у Вінниці й області.',heading:'Співпраця з TVD',body:'Для магазинів, оптових партнерів і монтажних організацій Вінниці та області.'},
    {path:'/support',title:'Сервіс і технічна підтримка — TVD',description:'Технічна підтримка та консультації щодо інженерного обладнання TVD.',heading:'Сервіс і підтримка',body:'Технічна інформація та підтримка для ваших інженерних проєктів.'},
    {path:'/about',title:'Про компанію TVD — інженерні системи',description:'TVD — постачальник обладнання для опалення, водопостачання, вентиляції та клімату.',heading:'Про компанію TVD',body:'Постачальник інженерного обладнання у Вінниці та з доставкою по Україні.'},
    {path:'/selection-assistant',title:'Підбір обладнання — TVD',description:'Інформаційна сторінка майбутнього помічника з підбору обладнання TVD.',heading:'Підбір обладнання',body:'Майбутній інструмент збору вихідних даних для консультації з фахівцем TVD.'},
  ];
  function buildHtml(template, {path:routePath, title, description, body, schemaData, noIndex = false, noCanonical = false, image = '/logo_tvd_new2.png', type = 'website'}) {
    const origin = configuredSiteOrigin;
    const canonical = `${origin}${routePath}`;
    let html = template.replace(/<title>[^<]*<\/title>/, `<title>${htmlEscape(title)}</title>`)
      .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${htmlEscape(description)}" />`)
      .replace('</head>', `<meta name="robots" content="${noIndex ? 'noindex,follow' : 'index,follow'}" />${noCanonical ? '' : `<link rel="canonical" href="${htmlEscape(canonical)}" />`}<meta property="og:type" content="${type}" /><meta property="og:locale" content="uk_UA" /><meta property="og:site_name" content="TVD" /><meta property="og:title" content="${htmlEscape(title)}" /><meta property="og:description" content="${htmlEscape(description)}" /><meta property="og:url" content="${htmlEscape(canonical)}" /><meta property="og:image" content="${htmlEscape(`${origin}${image}`)}" /><meta name="twitter:card" content="summary_large_image" /><script type="application/ld+json">${schema(schemaData)}</script></head>`)
      .replace('<div id="root"></div>', `<div id="root"><main class="wrap page-content"><h1>${htmlEscape(body.heading)}</h1>${body.html ?? `<p>${htmlEscape(body.text ?? '')}</p>`}</main></div>`);
    return html;
  }
  function staticRender() {
    const dist = path.join(root, 'dist');
    const template = readFileSync(path.join(dist, 'index.html'), 'utf8');
    const origin = configuredSiteOrigin;
    const org = {'@context':'https://schema.org','@type':'Organization',name:'TVD',url:`${origin}/`,logo:`${origin}/logo_tvd_new2.png`,areaServed:{'@type':'Country',name:'Україна'}};
    const website = {'@context':'https://schema.org','@type':'WebSite',name:'TVD — Інженерні системи',url:`${origin}/`,inLanguage:'uk-UA',potentialAction:{'@type':'SearchAction',target:`${origin}/catalog/radiatory?q={search_term_string}`,'query-input':'required name=search_term_string'}};
    const allUrls = [];
    const breadcrumbs = (parts) => ({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:parts.map((item,index)=>({'@type':'ListItem',position:index+1,name:item.name,item:`${origin}${item.path}`}))});
    const writeRoute = (routePath, title, description, body, extraSchemas = [], options = {}) => {
      const destination = routePath === '/' ? path.join(dist, 'index.html') : path.join(dist, routePath.slice(1), 'index.html');
      mkdirSync(path.dirname(destination), {recursive:true});
      writeFileSync(destination, buildHtml(template,{path:routePath,title,description,body,schemaData:[org,website,...extraSchemas],...options}));
      if (!options.noIndex) allUrls.push({path:routePath,lastmod:options.lastmod});
    };
    for (const page of staticPages) {
      const articleLinks = page.path === '/knowledge' ? publishedArticles.map(article=>`<li><a href="/knowledge/${encodeURIComponent(article.slug)}">${htmlEscape(article.title)}</a><p>${htmlEscape(article.description)}</p></li>`).join('') : '';
      const topicLinks = page.path === '/knowledge' ? ['heat-pumps','gas-boilers','alternative-heating','wastewater-treatment'].map(category=>`<li><a href="/knowledge/category/${category}">${category}</a></li>`).join('') : '';
      const productLinks = page.path === '/catalog/radiatory' ? JSON.parse(readFileSync(path.join(root,'src/radiators.json'),'utf8')).map(product=>`<li><a href="/catalog/radiatory/${slugify(product.name)}-${encodeURIComponent(product.id)}">${htmlEscape(product.name)} — ${htmlEscape(product.brand)}</a></li>`).join('') : '';
      const html = page.path === '/knowledge' ? `<p>${htmlEscape(page.body)}</p><h2>Категорії матеріалів</h2><ul>${topicLinks}</ul><h2>Опубліковані статті</h2><ul>${articleLinks}</ul>` : page.path === '/catalog/radiatory' ? `<p>${htmlEscape(page.body)}</p><ul>${productLinks}</ul>` : undefined;
      const extra = page.path === '/catalog/radiatory' ? [breadcrumbs([{name:'Головна',path:'/'},{name:'Каталог радіаторів',path:page.path}])] : [];
      writeRoute(page.path,page.title,page.description,{heading:page.heading,html},extra);
    }
    for (const category of ['heat-pumps','gas-boilers','alternative-heating','wastewater-treatment']) {
      const titles={'heat-pumps':'Теплові насоси','gas-boilers':'Газові котли','alternative-heating':'Альтернативне опалення','wastewater-treatment':'Очищення стічних вод'};
      const related=publishedArticles.filter(article=>article.category===category);
      const routePath=`/knowledge/category/${category}`;
      const html=related.map(article=>`<article><h2><a href="/knowledge/${encodeURIComponent(article.slug)}">${htmlEscape(article.title)}</a></h2><p>${htmlEscape(article.description)}</p></article>`).join('') || '<p>Матеріали цієї теми буде опубліковано пізніше.</p>';
      writeRoute(routePath,`${titles[category]} — База знань TVD`,`Матеріали TVD: ${titles[category].toLocaleLowerCase('uk-UA')}.`,{heading:titles[category],html},[breadcrumbs([{name:'Головна',path:'/'},{name:'База знань',path:'/knowledge'},{name:titles[category],path:routePath}])],{noIndex:related.length===0});
    }
    for (const article of publishedArticles) {
      const routePath=`/knowledge/${article.slug}`;
      const articleSchema={'@context':'https://schema.org','@type':'Article',headline:article.title,description:article.description,image:[`${origin}${article.cover}`],author:{'@type':'Organization',name:article.author},publisher:org,datePublished:article.publishedAt,dateModified:article.updatedAt,mainEntityOfPage:`${origin}${routePath}`,inLanguage:'uk-UA'};
      const bodyHtml=`<p>${htmlEscape(article.description)}</p><img src="${htmlEscape(article.cover)}" alt="${htmlEscape(article.title)}" /><div>${article.html}</div>`;
      writeRoute(routePath,`${article.title} — База знань TVD`,article.description,{heading:article.title,html:bodyHtml},[articleSchema,breadcrumbs([{name:'Головна',path:'/'},{name:'База знань',path:'/knowledge'},{name:article.title,path:routePath}])],{image:article.cover,type:'article',lastmod:article.updatedAt});
    }
    const products=JSON.parse(readFileSync(path.join(root,'src/radiators.json'),'utf8'));
    for (const product of products) {
      const routePath=`/catalog/radiatory/${slugify(product.name)}-${encodeURIComponent(product.id)}`;
      const productSchema={'@context':'https://schema.org','@type':'Product',name:product.name,image:[`${origin}${product.image}`],sku:product.article,brand:{'@type':'Brand',name:product.brand},url:`${origin}${routePath}`};
      const specs=[['Бренд',product.brand],['Тип',product.model],['Підключення',product.connection],['Розмір',`${product.heightMm} × ${product.widthMm} мм`],['Теплова потужність',`${product.powerW} Вт`]].filter(([,value])=>value != null).map(([key,value])=>`<li><b>${htmlEscape(key)}:</b> ${htmlEscape(value)}</li>`).join('');
      writeRoute(routePath,`${product.name} — ${product.brand} | TVD`,`Товар ${product.name}, бренд ${product.brand}. Артикул: ${product.article}. Характеристики та актуальну наявність уточнюйте у каталозі TVD.`,{heading:product.name,html:`<p>Бренд: ${htmlEscape(product.brand)} · Артикул: ${htmlEscape(product.article)}</p><h2>Характеристики</h2><ul>${specs}</ul><a href="/catalog/radiatory">До каталогу радіаторів</a>`},[productSchema,breadcrumbs([{name:'Головна',path:'/'},{name:'Каталог радіаторів',path:'/catalog/radiatory'},{name:product.name,path:routePath}])],{image:product.image});
    }
    const notFound=buildHtml(template,{path:'/404.html',title:'Сторінку не знайдено — TVD',description:'Запитувану сторінку TVD не знайдено.',body:{heading:'Сторінку не знайдено',text:'Перевірте адресу або поверніться на головну сторінку TVD.'},schemaData:[org,website],noIndex:true,noCanonical:true});
    writeFileSync(path.join(dist,'404.html'),notFound);
    writeFileSync(path.join(dist,'robots.txt'),`User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
    const sitemap=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${allUrls.map(item=>`  <url><loc>${htmlEscape(`${origin}${item.path}`)}</loc>${item.lastmod?`<lastmod>${item.lastmod}</lastmod>`:''}</url>`).join('\n')}\n</urlset>\n`;
    writeFileSync(path.join(dist,'sitemap.xml'),sitemap);
  }
  return {
    name: 'tvd-markdown-knowledge',
    resolveId(id) { return id === virtualId ? resolvedVirtualId : null; },
    load(id) { if (id === resolvedVirtualId) return indexSource; return null; },
    buildStart() { refreshIndex(); },
    handleHotUpdate({ file, server }) { if (file.startsWith(articlesRoot)) { refreshIndex(); server.moduleGraph.invalidateAll(); server.ws.send({ type: 'full-reload' }); return []; } return null; },
    closeBundle() { if (isBuild) staticRender(); },
  };
}

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, root, '');
  configuredSiteOrigin = (env.VITE_SITE_URL || 'https://tvd.vn.ua').replace(/\/+$/, '');
  return { plugins: [knowledgeContent(command === 'build')] };
});
