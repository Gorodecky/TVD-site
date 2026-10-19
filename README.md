# TVD storefront

Responsive React + TypeScript + Vite storefront for TVD engineering equipment. The Node.js, TypeScript, Prisma, and PostgreSQL API remains in `server/`.

## Run locally

```sh
npm install
cp .env.example .env
npm run dev
```

Set `VITE_API_URL` in the root `.env` if the API is not at `http://localhost:3001/api/v1`. Set `VITE_B2B_URL` to the URL of the existing B2B platform to show its direct link in the site header and footer. Set `VITE_SITE_URL` to the canonical production origin for SEO metadata. The app does not provide B2B authentication itself.

The API is required for live catalog and cart data. Start the backend in a second terminal using the instructions in [server/README.md](server/README.md).

## Storefront structure

- `src/App.tsx` — shared catalog/cart state and client-side page navigation.
- `src/components/layout/` — responsive header and footer.
- `src/components/navigation/` — catalog mega-menu.
- `src/components/catalog/` — product cards and breadcrumbs.
- `src/pages/` — home, radiator catalog, product, cart, partner account, information pages, and `/selection-assistant` placeholder.
- `src/api.ts` — API client and backend product adapter.
- `src/styles.css` — design system and responsive layouts.
- `src/knowledge/` — knowledge article types and repository interface.
- `src/components/knowledge/` — article card and SEO component.
- `content/knowledge/articles/` — Markdown source files. See [content/knowledge/README.md](content/knowledge/README.md) and copy [ARTICLE_TEMPLATE.md](content/knowledge/ARTICLE_TEMPLATE.md) to add a new article.
- `vite.config.mjs` — validates Markdown metadata and emits only valid, published article content.

The current seeded product catalog is the radiator export. Product names, prices, stock, characteristics, and brands are read from the API; the UI does not fabricate additional product records. The selection assistant is an informational placeholder and does not calculate or recommend equipment.

Knowledge articles are Markdown files, not database records. No article content is seeded; the public section remains empty until reviewed files with `status: "published"` are added. Draft text is not included in the client bundle. The content pipeline uses the site's existing dependencies and renders a safe Markdown subset including tables, lists, images, links, and code blocks.

## Checks

Frontend production build:

```sh
npm run build
```

Backend checks:

```sh
cd server
npm run typecheck
npm run lint
npm test
npm run build
```
