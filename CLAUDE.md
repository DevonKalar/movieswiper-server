# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev               # Start dev server with hot reload (tsup watch + node dist/server.js)
npm run build             # Production build via tsup
npm start                 # Run production build
npm test                  # Run all tests once
npm run test:watch        # Run tests in watch mode
npm run vitest:coverage   # Generate coverage report
npm run lint              # ESLint
npm run format            # Prettier

# Run a single test file
npx vitest run tests/unit/services/tmdb.test.ts

# Database
npx prisma migrate dev    # Run migrations
npx prisma generate       # Regenerate Prisma client
npx prisma studio --config ./prisma.config.ts
```

## Architecture

**Request flow:** `app.ts` (Express + middleware) → `routes/index.ts` (mounts sub-routers with auth middleware) → `routes/*.ts` (thin: validate + call service) → `services/*.ts` (business logic + Prisma) or `clients/*.ts` (external HTTP).

**Key layers:**

- `models/` — Zod schemas + inferred input types. Validation middleware (`@middleware/validate`) attaches parsed data to `req.validatedBody`, `req.validatedParams`, `req.validatedQuery`.
- `routes/` — No business logic. Apply `validateReqBody/Params/Query`, read from `req.validated*`, call services, return typed responses.
- `services/` — All business logic and database access via Prisma.
- `clients/` — Thin wrappers over OpenAI and TMDB HTTP APIs.
- `types/` — Response shapes and domain types. `express.d.ts` extends `Request` with `user`, `validatedBody`, `validatedParams`, `validatedQuery`.

**Auth:** JWT stored in httpOnly cookie (`auth_token`) or `Authorization: Bearer` header. `requireUser` blocks unauthenticated requests; `optionalUser` allows them but attaches user if token is present. Both are applied at the router level in `routes/index.ts`, not in individual route handlers.

**Recommendations logic:** Authenticated users get popular TMDB movies filtered to exclude their watchlist. The service paginates through TMDB pages until 20 non-watchlisted movies are collected (up to 10 pages ahead of `startPage`).

**Watchlist:** Movies are upserted into the `Movies` table (keyed by TMDB ID) before creating `Watchlist` entries. `POST /api/watchlist` accepts `{ movies: Movie[] }` and uses `createMany` with `skipDuplicates: true`.

## Path Aliases

Defined in both `tsconfig.json` and `vitest.config.ts`:

| Alias           | Maps to            |
| --------------- | ------------------ |
| `@/*`           | `src/*`            |
| `@models/*`     | `src/models/*`     |
| `@routes/*`     | `src/routes/*`     |
| `@services/*`   | `src/services/*`   |
| `@clients/*`    | `src/clients/*`    |
| `@middleware/*` | `src/middleware/*` |
| `@utils/*`      | `src/utils/*`      |
| `@tests/*`      | `tests/*`          |

## Testing

- **Unit tests** (`tests/unit/`) use MSW (Mock Service Worker) via `setupMSW()` to intercept HTTP calls to TMDB/OpenAI. MSW handlers live in `tests/mocks/handlers.ts`.
- **Integration tests** (`tests/integration/`) use Supertest against a real PostgreSQL database. They create test data in `beforeAll` and clean up in `afterAll`. Each test file spins up its own Express app instance with the router under test.
- Tests use Vitest globals (`describe`, `it`, `expect`) — no imports needed for these.
- **Co-location:** tests for a module should live in a `__tests__/` folder adjacent to that module (e.g. `src/middleware/__tests__/errorHandler.test.ts`). Use `tests/unit/` and `tests/integration/` only for tests that don't have a natural co-location point.

## Environment Variables

Required: `DATABASE_URL`, `OPENAI_API_KEY`, `TMDB_BEARER_TOKEN`, `JWT_SECRET`. Copy `.env.example` to `.env` to get started.
