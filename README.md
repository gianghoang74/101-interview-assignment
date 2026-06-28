# SimpleInvoice

A full-stack invoice management application: authentication, invoice listing/detail/creation, and server-side business logic.

- **Frontend:** React + TypeScript + Vite + Material UI (MUI)
- **Backend:** NestJS + TypeScript + Prisma
- **Database:** PostgreSQL

---

## Table of contents

- [Features](#features)
- [Architecture](#architecture)
- [Project layout](#project-layout)
- [Quick start (Docker)](#quick-start-docker)
- [Running locally (without Docker)](#running-locally-without-docker)
- [Default login](#default-login)
- [Database seeding](#database-seeding)
- [API & documentation](#api--documentation)
- [Environment variables](#environment-variables)
- [Testing](#testing)
- [Design decisions & assumptions](#design-decisions--assumptions)
- [Known limitations](#known-limitations)

---

## Features

1. **Authentication** — email/password login issuing a **JWT access token** (sent as `Authorization: Bearer`); all invoice routes are guarded.
2. **Invoice list** — server-side **search** (invoice # or customer, case-insensitive partial), **filter** by status, **sort** (invoice date / due date / total), and **pagination**.
3. **Invoice detail** — customer, line item, and the full money breakdown (subtotal, tax, discount, total, paid, balance).
4. **Create invoice** — validated form; totals are computed **server-side**; success notification then redirect to the list.

---

## Architecture

```
┌──────────────┐     Authorization: Bearer (JWT)       ┌──────────────┐        ┌────────────┐
│  React SPA   │ ───────────────────────────────────▶ │  NestJS API  │ ─────▶ │ PostgreSQL │
│  (MUI, Vite) │ ◀─────────────  JSON  ──────────────  │   (Prisma)   │        │            │
│  :3000       │           CORS  :3001               │  /api/docs   │        │  :5432     │
└──────────────┘                                       └──────────────┘        └────────────┘
```

- **Auth:** `POST /auth/login` validates credentials (bcrypt) and returns a **JWT access token**. The SPA stores it in `localStorage` and sends it as `Authorization: Bearer <token>` on every request; a global JWT guard protects every route except those marked public. Logout is client-side (the token is discarded).
- **Business logic (server-side):** `subTotal = qty × rate`, `tax = subTotal × tax%/100`, `total = subTotal + tax − discount`, `balance = total − paid`. Money uses `Decimal` throughout.
- **Overdue is derived, never stored.** The database persists only `Draft / Pending / Paid`; an invoice that is not Paid and past its due date is reported as `Overdue` at read time. The list's status filter is derivation-aware so filtered results match the status each row shows.
- **Data model:** normalized `Customer` table (find-or-create by email on invoice creation), `Invoice`, `InvoiceItem`, `User`.

---

## Project layout

```
.
├── backend/              # NestJS API
│   ├── prisma/           # schema, migrations, seed.ts
│   └── src/
│       ├── auth/         # login, JWT Bearer strategy, guard
│       ├── invoices/     # controller, service, DTOs, totals, mapper
│       ├── prisma/       # PrismaService/module
│       └── common/       # exception filter, decorators, validators
├── frontend/             # React + Vite + MUI SPA
│   └── src/
│       ├── api/          # axios client (Bearer token), React Query hooks, types
│       ├── auth/         # AuthContext, ProtectedRoute
│       ├── components/   # layout, snackbar, status chip
│       └── pages/        # login, list, detail, create
├── docker-compose.yml    # db + backend + frontend
└── README.md
```

---

## Quick start (Docker)

Requires Docker + Docker Compose. From the repository root:

```bash
cp .env.example .env      # provides JWT_SECRET (required — compose has no fallback)
docker compose up --build
```

This builds and starts all three services. The backend automatically runs database migrations and seeds sample data on startup. `JWT_SECRET` is **required** with no hardcoded default; the shipped `.env.example` carries a dev-only placeholder — replace it with a long random value (`openssl rand -hex 32`) for any real deployment.

| Service  | URL                              |
| -------- | -------------------------------- |
| Frontend | http://localhost:3000            |
| Backend  | http://localhost:3001            |
| Swagger  | http://localhost:3001/api/docs   |
| Postgres | localhost:5432                   |

Then open **http://localhost:3000** and sign in with the [default login](#default-login).

To stop: `docker compose down` (add `-v` to also remove the database volume).

---

## Running locally (without Docker)

Requires Node.js 20+ and a PostgreSQL instance. You can start just the database with Docker:

```bash
docker compose up -d db
```

### Backend → http://localhost:3001

```bash
cd backend
cp .env.example .env          # adjust DATABASE_URL if needed
npm install
npm run prisma:migrate        # create the schema
npm run seed                  # populate sample data
npm run start:dev
```

### Frontend → http://localhost:3000

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

---

## Default login

A default account is seeded into the database:

| Email                       | Password       |
| --------------------------- | -------------- |
| `demo@simpleinvoice.test`   | `Password123!` |

---

## Database seeding

The seed script (`backend/prisma/seed.ts`) is run with a single command:

```bash
cd backend
npm run seed
```

It creates the default user, a pool of customers, a sample invoice, and ~30 additional invoices with a varied mix of statuses, dates, amounts, and currencies so that search, filtering, sorting, and pagination are all meaningful to test. **Overdue is never seeded** — it is derived at read time, so some seeded `Pending`/`Draft` invoices have past due dates and therefore appear as `Overdue`.

> In Docker, the backend runs `prisma migrate deploy && npm run seed` on startup. Seeding is **idempotent** — it populates an empty database but skips when data already exists, so restarting the backend preserves your data. Force a re-seed with `SEED_FORCE=true npm run seed`.

---

## API & documentation

Interactive Swagger/OpenAPI docs are available at **http://localhost:3001/api/docs** while the backend is running.

| Method | Endpoint        | Auth | Description                                          |
| ------ | --------------- | :--: | --------------------------------------------------- |
| POST   | `/auth/login`   |  —   | Authenticate; returns a JWT access token            |
| GET    | `/auth/me`      |  ✓   | Current authenticated user                          |
| GET    | `/invoices`     |  ✓   | List with search, filter, sort, pagination          |
| GET    | `/invoices/:id` |  ✓   | Invoice detail                                      |
| POST   | `/invoices`     |  ✓   | Create an invoice                                   |

`GET /invoices` query params: `page`, `pageSize`, `sortBy` (`invoiceDate`/`dueDate`/`totalAmount`), `ordering` (`ASC`/`DESC`), `status` (`Draft`/`Pending`/`Paid`/`Overdue`), `keyword`, `fromDate`, `toDate`. Dates are `YYYY-MM-DD`; `fromDate`/`toDate` filter on the **invoice date** (inclusive of both bounds). Response shape: `{ "data": [...], "paging": { "page", "pageSize", "total" } }`.

---

## Environment variables

No secrets are hardcoded; everything is sourced from the environment. `.env.example` files are provided at the repo root (for Docker Compose), in `backend/`, and in `frontend/`.

**backend/.env**

| Variable          | Default                  | Description                                  |
| ----------------- | ------------------------ | -------------------------------------------- |
| `DATABASE_URL`    | —                        | PostgreSQL connection string                 |
| `JWT_SECRET`      | —                        | Secret used to sign JWTs                     |
| `JWT_EXPIRES_IN`  | `3600`                   | Access-token lifetime in seconds             |
| `FRONTEND_ORIGIN` | `http://localhost:3000`  | Allowed CORS origin for the SPA              |
| `PORT`            | `3001`                   | API port                                     |

**frontend/.env**

| Variable             | Default                 | Description           |
| -------------------- | ----------------------- | --------------------- |
| `VITE_API_BASE_URL`  | `http://localhost:3001` | Base URL of the API   |

---

## Testing

**Backend** (Jest + Supertest):

```bash
cd backend
npm test           # unit: totals, Overdue derivation, due-date validation, unique-number mapping
npm run test:e2e   # e2e: login (Bearer) → create invoice → verify in list + duplicate 409
```

**Frontend** (Vitest + React Testing Library):

```bash
cd frontend
npm test           # login validation, list rendering, create-form validation
```

---

## Design decisions & assumptions

- **Repository:** monorepo (`frontend/` + `backend/`) — one clone, one `docker compose up`.
- **ORM:** Prisma, pinned to **v6** (the installed v7 changed datasource configuration; v6 is mature and a clean fit).
- **Customer storage:** a **separate, normalized `customers` table** (FK from `Invoice`). On create we **find-or-create by email** (unique); an existing customer's details are **left unchanged**, so prior invoices keep the customer data they were created with.
- **Auth transport:** JWT **access token** returned by login, stored in `localStorage`, and sent as `Authorization: Bearer <token>`. _Tradeoff:_ localStorage is readable by JavaScript, so the SPA ships a strict **Content-Security-Policy** (plus `X-Frame-Options`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`) via nginx and the API sets security headers via **helmet**; an httpOnly cookie would resist XSS token theft but needs CSRF handling.
- **Status filtering is derivation-aware** so a filtered list stays consistent with the derived `Overdue` status (e.g. filtering `Pending` excludes past-due invoices, which show as `Overdue`).
- **Password hashing** uses `bcryptjs` (pure JS) rather than `bcrypt` to keep container builds free of native compilation.
- **Each invoice has exactly one line item**, but the schema (`InvoiceItem` is a one-to-many relation) already supports multiple for the future.
- **`paging: { page, pageSize, total }`** is the response shape used for list endpoints.
- Money is stored and computed as `Decimal(14,2)`; the frontend never calculates totals. Quantity/rate/tax/discount are bounded so computed totals can't overflow the column (oversized input returns `400`, not a database error).
- **Dates are date-only (`YYYY-MM-DD`)** anchored to UTC midnight end-to-end (validation, storage in `@db.Date`, and the Overdue boundary), so behaviour is timezone-independent. `currency` is validated against the set of supported codes so a symbol can always be derived.
- **Keyword search** (customer name and invoice number) uses PostgreSQL **`pg_trgm` GIN indexes** so the case-insensitive substring match (`ILIKE '%…%'`) is index-served rather than a sequential scan.

## Known limitations

- No refresh-token rotation — when the access token expires the user is redirected to log in again.
- The JWT is stored in `localStorage` (readable by JS); the shipped CSP + security headers reduce the XSS surface, but an httpOnly cookie would be stronger. Logout is client-side only; the stateless token is not revoked server-side and stays valid until it expires.
- No update/delete endpoints for invoices (out of scope for this project — list, detail, and create are supported).
- `totalPaid` is seeded/derived only; there is no payments feature to record payments against an invoice.
- The production bundle is a single chunk (~210 KB gzipped); code-splitting was not applied as it is unnecessary at this size.
