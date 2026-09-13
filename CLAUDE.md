# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

An 18-module Enterprise Internal System (HR, CRM, Sales, Finance, Inventory, etc.) being built module-by-module in strict dependency order. Backend is a NestJS **modular monolith** (one deployable, one Postgres database, one Prisma schema split into per-module sections); frontend is a separate React + TypeScript SPA. Two independent npm projects (`backend/`, `frontend/`) — there is no root `package.json`.

Currently implemented (in build order): Module 1 (Auth), Module 2 (RBAC), Module 3 (Dashboard shell), Module 4 (Organization Management), Module 5 (Employee Management / HRM). Modules must land in spec order — each later module assumes the guards/services of every module before it.

## Commands

Run these from the `backend/` or `frontend/` directory — **not** the repo root.

### Backend (`backend/`)

```bash
npm run start:dev        # dev server with watch (nest start --watch) — NOT `npm run dev`, that script doesn't exist
npm run build             # tsc build via nest build
npm run lint               # eslint --fix
npm test                    # jest unit tests
npm run test:e2e           # jest e2e (test/jest-e2e.json)

npx prisma migrate dev --name <description>   # create + apply a migration after editing schema.prisma
npx prisma generate                            # regenerate the client (see Windows gotcha below)
npx prisma db seed                             # re-run prisma/seed.ts (idempotent)
npx prisma studio
```

Run a single Jest test: `npx jest path/to/file.spec.ts` or `npx jest -t "test name"`.

**Windows gotcha:** `nest start --watch` holds a lock on `node_modules/.prisma/client/query_engine-windows.dll.node`. Running `prisma migrate dev` or `prisma generate` while the dev server is running fails with `EPERM`. Stop the dev server first, run the Prisma command, then restart. `TaskStop` on the background task alone isn't always enough — check for and kill any orphaned `node ... dist/src/main` / `nest.js start --watch` processes for the backend directory before retrying.

### Frontend (`frontend/`)

```bash
npm run dev       # vite dev server, http://localhost:5173
npm run build      # tsc -b && vite build
npm run lint        # oxlint

npx shadcn@2.10.0 add <component>   # add a new shadcn/ui primitive into src/components/ui/ — pin this exact version, see gotcha below
```

**shadcn/ui CLI gotcha:** `npx shadcn@latest` resolves to a newer major (v4.x) with a completely different flow (presets, multiple base component libraries) that doesn't match this project's setup — always pin `shadcn@2.10.0` explicitly. Even that version's `init`/`add` sometimes fails fetching the base registry CSS with `Validation failed: css: Invalid input` (transient registry/CLI version skew) — when that happens, `components.json` and any component files still get written correctly; only the generated `globals.css` injection fails, so nothing further is needed since this project already hand-maintains its theme tokens in `src/index.css` (see below). `frontend/.npmrc` sets `legacy-peer-deps=true` so `npm install` doesn't hard-fail on Radix/React 19 peer-range mismatches — required before running any shadcn command.

### Infrastructure

- **Redis**: `docker-compose up -d` from the repo root (only Redis is dockerized).
- **PostgreSQL**: a native local install, not dockerized — must already be running on `localhost:5432`. Connection string lives in `backend/.env` (`DATABASE_URL`).
- Bootstrap admin credentials come from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `backend/.env` (defaults: `admin@enterprise.local` / `ChangeMe123!`), created by `prisma db seed`.

## Architecture

### Backend: modular monolith rules

- Each module lives under `backend/src/<module>/` with its own controllers/services/DTOs, but **all Prisma models share one `prisma/schema.prisma`**, organized into `// Module N — Name` comment-delimited sections in spec order.
- Modules never query another module's tables through its own service layer — either call that module's exported service, or (for lightweight cross-module references like "who manages this department" or "who approved this leave request") store a **plain, non-relational id field** (e.g. `Department.managerUserId`, `LeaveRequest.decidedByUserId`) rather than reaching into the owning module. Formal Prisma `@relation`s are fine for same-domain 1:1/1:many links that both models' own schema sections explicitly declare (e.g. `Employee.userId → User`, `Employee.reportingManagerId` self-relation) — the rule is about service-layer query boundaries, not the schema graph.
- Every list endpoint returns `{ success, data, meta }` via the global `ResponseInterceptor` (`common/interceptors/response.interceptor.ts`) and uses the shared `PaginationQueryDto` / `paginationSkipTake()` / `buildPaginationMeta()` from `common/pagination/pagination.dto.ts`.
  - **Gotcha**: if an endpoint needs a list filter beyond page/limit (e.g. `?status=`, `?branchId=`), do **not** combine `@Query() query: PaginationQueryDto` with a separate `@Query('status') status?: string` on the same handler — the global `ValidationPipe` has `whitelist: true, forbidNonWhitelisted: true`, and it validates the *entire* query object against the DTO, so the undeclared key fails with `property X should not exist`. Instead declare a dedicated DTO that `extends PaginationQueryDto` with the extra field(s) (see `employees/dto/list-leave-requests-query.dto.ts` for the pattern).
- Every mutating request is captured automatically by the global `AuditLogInterceptor` — modules never write their own audit log calls. Use the `@AuditEntity('Name')` decorator on a handler only to override the auto-guessed entity name.
- Every route is guarded globally by `ThrottlerGuard` → `JwtAuthGuard` → `PermissionsGuard` (registered in that order in `app.module.ts`). A route needs no per-route guard wiring — mark it `@Public()` to skip auth entirely, or `@RequirePermission('<module-slug>', 'VIEW'|'CREATE'|'EDIT'|'DELETE')` to require a specific permission (module slugs are the fixed list in `common/constants/modules.constant.ts`, seeded once for every module × action pair). No decorator means "authenticated, no specific permission" — that's the pattern for self-service `/me` endpoints.
- Sensitive fields (salary, TOTP secrets) are encrypted at rest with `FieldEncryptionService` (`common/security/encryption.service.ts`, AES-256-GCM). Never `include` a relation that carries an encrypted column without `select`-scoping it first — Prisma's `include` pulls every scalar column along with it, which has already leaked raw ciphertext into unrelated API responses twice (leave-request and payroll-run listings that nested the full `Employee` row). Always whitelist nested selects when the related model has an encrypted field.
- BullMQ: `common/queue/queue.module.ts` sets up the shared Redis connection globally; a feature module registers its own named queue via `BullModule.registerQueue({ name: '<queue>' })` and a `@Processor('<queue>') extends WorkerHost` consumer (see `employees/processors/payroll.processor.ts`). Use `otplib@12` (pinned) — v13's default plugin drags in an ESM-only dependency that crashes under `ts-node`/CommonJS at runtime.
- One shared WebSocket gateway (`common/websocket/events.gateway.ts`, global) — modules inject `EventsGateway` and call `emitToUser`/`emitToAll`/`emitToRoom` rather than opening their own namespace. Its `@WebSocketGateway` CORS option is read from `process.env` directly (evaluated before Nest's DI container exists), not `ConfigService`.
- CSRF (`common/middleware/csrf.middleware.ts`, double-submit cookie): applied to all mutating requests except a fixed exempt list of pre-auth `/auth/*` routes, and to Bearer-only requests carrying no cookies at all. Inside Nest middleware, `req.path` is relative to the middleware's mount point (prefix-stripped) — always match against `req.originalUrl`, not `req.path`, when comparing against a route allowlist.
- Refresh tokens rotate on every use and live in an httpOnly cookie (`AuthService.refresh`); a reused/already-rotated token revokes every session for that user as theft protection. "Remember me" controls whether that cookie is persistent or session-only (`Session.persistent`, carried forward across rotations) — see `auth/auth.controller.ts`'s `setRefreshCookie`.

### Frontend structure

- `shared/api/client.ts`: single axios instance. Request interceptor attaches the in-memory access token (never localStorage) and a CSRF token for mutating requests; response interceptor does refresh-and-retry on 401. `refreshAccessToken()` is deduplicated (single in-flight promise) — always reuse it (e.g. from `useAuthBootstrap`) rather than calling the raw `/auth/refresh` endpoint directly, since React StrictMode's double-effect-invocation will otherwise race two refresh calls against the backend's one-time-use rotation and revoke the session.
- `shared/stores/auth.store.ts` (zustand): holds the access token, user, roles, and permission keys (`"<module>:<action>"` strings from `GET /rbac/me` / `GET /employees/me`-adjacent self endpoints). `hasPermission(module, action)` / `hasRole(name)` back the route guards.
- `shared/guards/`: `RequireAuth` (redirect to `/login` if no token, waits on `isInitializing`), `PermissionGuard`/`RoleGuard` (client-side UX only — the API enforces the real check regardless).
- Route convention (`app/routes/router.tsx`): public auth routes at top level; everything else nested under `RequireAuth` → `AppLayout`, with per-route `PermissionGuard` wrapping where a module permission applies. Sidebar nav items in `AppLayout` are conditionally shown based on `hasPermission`.
- Feature folders (`features/<module>/{api,pages,components}`) mirror the backend module boundary: `api/types.ts` mirrors the Prisma-shaped response, `api/*.api.ts` wraps axios calls, `api/hooks.ts` wraps them in TanStack Query with query-key-based invalidation.
- Manual light/dark theme toggle (`shared/hooks/useTheme.ts`) sets `data-theme` on `<html>`, which `index.css`'s `:root[data-theme="dark"|"light"]` blocks override; falls back to `prefers-color-scheme` if never toggled. This sentence is unchanged by the shadcn/ui migration below — only what *consumes* the `data-theme` attribute changed (Tailwind's `dark:` variant now, via `@custom-variant dark (&:where([data-theme="dark"] ...))` in `index.css`, instead of raw `:root[data-theme]` rules reaching every component directly). CSS custom properties only — no CSS-in-JS.
- **Design system: shadcn/ui** (Radix UI primitives + Tailwind v4, copy-in components under `src/components/ui/`, not a runtime dependency). `src/lib/utils.ts` exports the standard `cn()` (`clsx` + `tailwind-merge`) helper every component uses for its `className` prop. Icons are `lucide-react` throughout — no hand-rolled icon set. `src/index.css` hand-maintains the actual color/spacing values (`--text`, `--bg`, `--accent`, `--danger`, etc., themed per `data-theme`) and maps them onto shadcn's semantic token names (`--color-primary`, `--color-foreground`, etc.) via a `@theme inline` block — shadcn components consume the semantic names, this app's own code can still use the original token names directly where useful (e.g. the auth split-panel's fixed, non-theme-dependent `--brand-grad`).
  - **Gotcha — spurious `onValueChange` on a controlled `<Select>`:** Radix's `Select` fires a spurious `onValueChange("")` once on mount (its hidden native `<select>` bubble-input syncing before the controlled value settles) — not a real user selection. This app's `src/components/ui/select.tsx` wrapper swallows any `onValueChange("")` call centrally for this reason (safe: no `SelectItem` in this app ever uses `""` as a real value — "all"/"none" states use an explicit sentinel like `'__all__'`). Don't "fix" this by reverting to the plain Radix passthrough.
  - **Gotcha — `<SelectValue>` shows blank on first paint:** don't rely on Radix's internal item-label lookup for a `Select` whose value is set programmatically (e.g. from fetched data) rather than by a user click — pass the label explicitly as `<SelectValue>{knownLabel}</SelectValue>` instead of a bare `<SelectValue />`/`placeholder`-only version, or it can render empty until the user has opened the dropdown at least once.
  - `shared/components/Modal.tsx` and `IconField.tsx` are thin adapters — internals are shadcn `Dialog`/`Input`, but their prop signatures (`{title, onClose, children}` / `{label, icon, isPassword, ...}`) are frozen so every call site across the app is unchanged. Prefer extending these adapters over calling raw shadcn primitives directly for modal/icon-field use cases already covered by them.

### Conventions when adding a new module

Follow the working method the codebase has used for every module so far: Prisma schema section + migration → service layer → controller with `@RequirePermission`/`@AuditEntity` → frontend `api/` + `pages/` → wire into `app.module.ts` / `router.tsx` / `AppLayout` nav → smoke test with curl → verify in an actual browser (Playwright via `chromium-cli`/local script, not just `tsc`) before considering the module done. Several real bugs in this codebase (salary leaking through unscoped `include`, the pagination whitelist 400, a CSS `///` comment silently breaking the brand gradient, an axios refresh-interceptor deadlock) were only caught by the browser-verification step, not by the TypeScript build.
