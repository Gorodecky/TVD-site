# TVD site prototype

Desktop-first React + TypeScript + Vite prototype for the TVD engineering equipment site. The Node.js backend foundation is in `server/`; the frontend is not connected to it yet. No ERP/1C sync, authentication, checkout, or payment service is connected. The radiator catalog is seeded from the supplied 1C export dated 07.10.2026.

## Run locally

```sh
npm install
npm run dev
```

Create a production build with `npm run build`. Set `VITE_API_URL` in `.env` to the API base URL (defaults to `http://localhost:3001/api/v1`).

## Backend

The REST API is a separate Node.js/TypeScript app using Express, PostgreSQL, and Prisma. Run it in a second terminal:

```sh
cd server
npm install
cp .env.example .env
# Configure DATABASE_URL in server/.env
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
npm run dev
```

See [server/README.md](server/README.md) for API routes, architecture, checks, and deployment boundaries. The storefront loads products and cart data from the backend; run the seed command to import the radiator export into the database.

## Current prototype

- Home page with TVD red and white visual direction, catalog navigation, popular product cards, service benefits, and partner callout.
- Interactive mega menu.
- Radiator category with 315 exported SKUs: 310 Terra Teknik and 5 Rens; K (side) and VK (bottom) connection filters; dimensions, power, article, 1C code, and available stock where provided.
- Prices are shown as values from the export because it does not specify currency; blank stock cells are shown as unspecified.
- Clickable category, product detail, cart, and B2B account views.
- Responsive layout for narrower screens; design is optimized for desktop first.

## Structure

- `src/App.tsx` — shared application state and page switching.
- `src/components/layout/` — site header and footer.
- `src/components/navigation/` — interactive mega menu.
- `src/components/ui/` — reusable button variants.
- `src/components/catalog/` — product cards and breadcrumbs.
- `src/pages/` — home, radiator category, product, cart, and account screens.
- `src/data.ts` and `src/radiators.json` — product and category data.
- `src/styles.css` — design tokens, layout, and responsive styling.
- `server/` — Node.js REST API, Prisma schema/migrations, and integration adapter contracts.

Product images currently use remote sample photography and can be replaced with TVD product imagery.
