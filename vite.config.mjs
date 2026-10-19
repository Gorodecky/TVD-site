import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = path.dirname(fileURLToPath(import.meta.url));
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

function knowledgeContent() {
  let indexSource = 'export const knowledgeArticles = [];';
  const refreshIndex = () => {
    const files = collectMarkdown(articlesRoot);
    const articles = files.map(readArticle);
    const seen = new Map();
    for (const [index, article] of articles.entries()) {
      if (seen.has(article.slug)) throw new Error(`Slug "${article.slug}" повторюється у ${path.relative(root, seen.get(article.slug))} та ${path.relative(root, files[index])}`);
      seen.set(article.slug, files[index]);
    }
    const today = new Date().toISOString().slice(0, 10);
    const published = articles.filter((article) => article.status === 'published' && article.publishedAt <= today).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    indexSource = `export const knowledgeArticles = ${JSON.stringify(published)};`;
  };
  return {
    name: 'tvd-markdown-knowledge',
    resolveId(id) { return id === virtualId ? resolvedVirtualId : null; },
    load(id) { if (id === resolvedVirtualId) return indexSource; return null; },
    buildStart() { refreshIndex(); },
    handleHotUpdate({ file, server }) { if (file.startsWith(articlesRoot)) { refreshIndex(); server.moduleGraph.invalidateAll(); server.ws.send({ type: 'full-reload' }); return []; } return null; },
  };
}

export default defineConfig({ plugins: [knowledgeContent()] });
