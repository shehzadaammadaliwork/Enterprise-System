# Changelog

What changed, session by session. Most recent first. For current build status see `project_status.md`; for the fixed module list/order see `MODULE_ROADMAP.md`.

## 2026-08-05 — Module 4, Module 5, project docs

**Module 4 — Organization Management**
- Prisma models: `CompanyProfile` (singleton), `Branch`, `Department` (self-referencing hierarchy + cycle-detection guard on parent assignment), `CompanyHoliday`.
- Backend: full CRUD for all four, RBAC-guarded under the `organization` module slug, audit-logged automatically.
- Frontend: tabbed `/organization` page (Company profile, Branches, Departments tree, Holidays), new shared `Modal` component, table/tab/tree CSS added to `index.css`.
- Bug found + fixed: the department tree endpoint didn't `include` the `branch` relation, so every department silently showed "No branch" regardless of what was set.

**Module 5 — Employee Management (HRM)**
- Prisma models: `Employee` (encrypted salary, department/reporting-manager links, address/emergency contact), `AttendanceRecord`, `LeaveRequest`, `PayrollRun` + `PayslipItem` (encrypted gross/deductions/net), `PerformanceReview`.
- Backend: 5 services/controllers — employee profiles, attendance check-in/out, leave request + approve/reject workflow, payroll generation as a real **BullMQ background job** (`PayrollProcessor`) with a WebSocket completion event via the shared `EventsGateway`, and performance reviews.
- Frontend: My Work (self-service hub — check-in/out, leave requests, payslips, reviews), Employees list/detail (HR), Leave Approvals queue, Payroll (trigger runs + live-polling detail view).
- Bugs found + fixed during browser verification:
  - Two salary-ciphertext leaks — nested Prisma `include` on Employee relations (leave requests' `employee`, payroll's `payslip.employee`, a department manager's own `reportingManager`) was pulling every column including `salaryEncrypted` into API responses. Fixed by switching those to `select`-scoped whitelists.
  - A systemic pagination bug: any endpoint combining `@Query() query: PaginationQueryDto` with a separate named `@Query('filterField')` tripped the global `forbidNonWhitelisted` validator (`property X should not exist`, HTTP 400). Fixed by giving each filtered list endpoint (leave requests, departments, employees) its own DTO subclass declaring the extra field, and checked for/fixed every occurrence of the pattern, not just the one that surfaced first.

**Docs**
- Added `CLAUDE.md`, `project_status.md`, `MODULE_ROADMAP.md`, this changelog.

## 2026-08-04 — Auth/signup UI redesign, rebrand

- Redesigned Login/Register/Forgot/Reset-password pages to a split-screen layout (brand gradient panel + form panel) matching a reference design supplied by the user; rebranded app-wide to **Innova Tech Biz**.
- Added a real light/dark theme toggle (`useTheme`, `data-theme` attribute + `localStorage`, wired into `index.css`'s CSS custom properties) — not just cosmetic, applies app-wide.
- Added icon-decorated form inputs (`IconField`, inline dependency-free icon set in `shared/components/icons.tsx`).
- Kept the sign-up form to real backend fields only (first/last name, email, password) rather than adding cosmetic fields (username/gender/phone/invitation-code) that don't map to any actual functionality — a deliberate scope decision, confirmed with the user.
- Wired "Remember me" for real: added `Session.persistent` (new migration), carried forward across refresh-token rotations; unchecked issues a session-only cookie, checked issues the normal persistent one.
- Bugs found + fixed via browser testing:
  - A CSS comment used `///` (TypeScript-style) instead of `/* */`, silently breaking the brand-gradient panel (invalid CSS was dropping the following declaration).
  - A deadlock in the frontend axios interceptor: the silent-refresh call itself could 401, and the retry logic tried to refresh again using the same in-flight promise, hanging forever on any protected route reached right after a fresh page load. Fixed by excluding `/auth/refresh` from the retry-via-refresh logic.
  - `POST /auth/refresh` with no cookie returned HTTP 200 with a `success:false` body instead of 401 — fixed to throw properly.

## 2026-08-03/04 — Module 1 (Auth) + Module 2 (RBAC), common infra, frontend shell

- Wired all common infrastructure into `AppModule`: Prisma, Redis/BullMQ, global `ValidationPipe`, `HttpExceptionFilter`, `ResponseInterceptor` + `AuditLogInterceptor`, helmet, CORS, rate limiting (`ThrottlerGuard`), CSRF (double-submit cookie via `csrf-csrf`).
- Built the shared local-disk `StorageService` (path-traversal-safe, size/type limits) for later modules.
- **Module 2 (RBAC)** built first since Auth's guards depend on it: role/permission CRUD, user↔role assignment, Redis-cached permission checks, global `PermissionsGuard`, self-service `GET /rbac/me`.
- **Module 1 (Auth)**: register/login/refresh/logout, account lockout, login history, session list/revoke, forgot/reset password, TOTP 2FA. Access token via Bearer header; refresh token as an httpOnly rotating cookie with theft-detection (reuse of an already-rotated token revokes every session for that user).
- Seed script (`prisma/seed.ts`): all 68 permissions (17 modules × 4 actions), all 13 system roles, Admin granted every permission, bootstrap Admin user.
- Frontend shell: React Router + TanStack Query + Zustand + axios client (CSRF token attachment, silent access-token refresh on 401) + Socket.IO client, auth pages, permission/role route guards, a role-aware dashboard shell with placeholder widgets.
- Bugs found + fixed via real browser testing (not just `tsc`):
  - CSRF path-matching compared against `req.path`, which is mount-relative inside Nest middleware — fixed to use `req.originalUrl`.
  - `csrf-csrf`'s thrown errors weren't recognized by `HttpExceptionFilter`, surfacing as 500 instead of 403 — added an `http-errors`-shape branch.
  - The shared WebSocket gateway's CORS was `origin: '*'` combined with credentials, which browsers reject — changed to a concrete origin.
  - `otplib` v13's default Base32 plugin pulled in an ESM-only dependency that crashed under `ts-node`/CommonJS — pinned to v12's classic `authenticator` API instead.

## Earlier (prior to this project's tracked history)

- Initial scaffold: NestJS backend + React/Vite frontend as two independent npm projects, `docker-compose.yml` for Redis, Prisma initialized against a native local Postgres install, base schema section for Auth/RBAC/Audit Logs, common infra files stubbed out (not yet wired into `AppModule`).
