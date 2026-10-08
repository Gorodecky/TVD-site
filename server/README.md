# TVD Store API

Node.js REST API (TypeScript, Express 5, PostgreSQL, Prisma) for the TVD online store. It is consumed by the React storefront in the repository root and accepts Vite development origins on port 5173.

## Requirements

- Node.js 20+
- PostgreSQL 14+

## Run locally

```sh
cd server
npm install
cp .env.example .env
# Set DATABASE_URL in .env to a PostgreSQL database you can access.
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
npm run dev
```

In another terminal, start the frontend with `npm install && npm run dev` from the repository root. Copy the root `.env.example` to `.env` to override `VITE_API_URL`.

The API listens on port `3001` by default. Production startup: `npm run db:deploy && npm run build && npm start`.

## REST API

Base path: `/api/v1`. JSON responses use `{ "data": ... }`; errors use `{ "error": { "message": ... } }`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness check |
| GET, POST | `/api/v1/products` | List (paginated, searchable and filterable) and create products |
| GET | `/api/v1/cart` | Get anonymous cart (`x-session-id` header) |
| POST | `/api/v1/cart/items` | Add an item |
| PATCH, DELETE | `/api/v1/cart/items/:id` | Change quantity or remove an item |
| GET | `/api/v1/products/:id` | Product details, media, characteristics, price and stock relations |
| GET | `/api/v1/categories` | Active categories |
| GET | `/api/v1/brands` | Active brands |
| GET, POST | `/api/v1/customers` | List and create customers |
| GET | `/api/v1/customers/:id` | Customer details |
| GET, POST | `/api/v1/orders` | List and create orders; creation calculates prices and snapshots from database records |
| GET | `/api/v1/orders/:id` | Order, payment transactions, delivery and documents |

List endpoints accept `page` (default 1) and `pageSize` (default 20, max 100). Product filters include `q`, `brand`, `connection`, `model`, `height`, and `sort`. Anonymous cart endpoints require the stable browser-generated `x-session-id` header.

## Architecture

- `src/routes`, `controllers`, `services`, `repositories`: HTTP to business logic to data access boundaries
- `src/models`, `validators`: domain/API shapes and Zod request validation
- `src/config`: validated environment, Prisma connection and Pino logging
- `src/integrations/contracts.ts`: provider-neutral contracts only; no CRM, BAS/1C, payment or carrier API is called
- `prisma/schema.prisma`: PostgreSQL data model; Prisma migrations are created and applied with the commands above

The schema models products and catalog metadata, customers, price groups and validity windows, warehouses and stock quantities, carts, orders and item snapshots, payments and separate transactions, delivery, documents, external references and integration sync logs. Integrations should record correlation in `ExternalReference` and attempts/results in `SyncLog` once a real API contract is agreed.

## Production deployment boundary

This is the backend foundation, not a publicly deployable storefront as-is: the initial endpoints do not include user authentication/authorization, and order creation does not yet reserve stock or initiate payment/delivery. Put the API behind the project's identity/access layer and complete those business workflows, operational secrets management, backups, and monitoring before exposing it to customers. No external service calls are made by this implementation.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

Database migration commands require a reachable PostgreSQL database. Do not point development migration commands at production; use `npm run db:deploy` for pre-reviewed migrations in deployment.
