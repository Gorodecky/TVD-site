# TVD storefront

Responsive React + TypeScript + Vite storefront for TVD engineering equipment. The Node.js, TypeScript, Prisma, and PostgreSQL API remains in `server/`.

## Run locally

```sh
npm install
cp .env.example .env
npm run dev
```

Set `VITE_API_URL` in the root `.env` if the API is not at `http://localhost:3001/api/v1`. Set `VITE_B2B_URL` to the URL of the existing B2B platform to show its direct link in the site header and footer. The app does not provide B2B authentication itself.

The API is required for live catalog and cart data. Start the backend in a second terminal using the instructions in [server/README.md](server/README.md).

## Storefront structure

- `src/App.tsx` — shared catalog/cart state and client-side page navigation.
- `src/components/layout/` — responsive header and footer.
- `src/components/navigation/` — catalog mega-menu.
- `src/components/catalog/` — product cards and breadcrumbs.
- `src/pages/` — home, radiator catalog, product, cart, partner account, information pages, and `/selection-assistant` placeholder.
- `src/api.ts` — API client and backend product adapter.
- `src/styles.css` — design system and responsive layouts.

The current seeded product catalog is the radiator export. Product names, prices, stock, characteristics, and brands are read from the API; the UI does not fabricate additional product records. The selection assistant is an informational placeholder and does not calculate or recommend equipment.

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
