# Module Roadmap

The fixed list of all 18 modules, their build order, and what each one contains, per the original spec. This file doesn't change as work progresses — for current build status (what's actually done vs pending), see `project_status.md`.

**Build rule**: modules are implemented strictly in this order. Each phase depends on every module in the phase before it (e.g. every module from Phase 2 onward assumes Module 1's auth guards and Module 2's permission system are already in place).

## Phase 1 — Foundation

| #   | Module                  | Contains                                                                                                                                                                                                                                                          |
| --- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Authentication          | Register (company email + password), login issuing JWT access + refresh tokens, forgot/reset password via time-limited email token, optional 2FA, account lockout after configurable failed attempts, login history (timestamp/IP/outcome), session list + revoke |
| 2   | RBAC                    | CRUD roles, granular per-module permissions (view/create/edit/delete), assign one or more roles to a user, server-side permission checks enforced on every endpoint                                                                                               |
| 3   | Dashboard (shell)       | Role-specific landing page after login with widget placeholders; widgets link through to their full module view once built                                                                                                                                        |
| 4   | Organization Management | Company profile (name, fiscal year, working hours), branches/office locations, departments with hierarchy, company holidays                                                                                                                                       |

## Phase 2 — Core People & Access

| #   | Module                    | Contains                                                                                                                                                                                                                                                                                                                              |
| --- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5   | Employee Management (HRM) | Employee profile (department, designation, reporting manager, joining date, encrypted salary, address, emergency contact), attendance check-in/out + history, leave request + manager/HR approval workflow, monthly payroll generation as a BullMQ background job (gross/deductions/net), performance reviews (period, rating, notes) |
| 6   | Audit Logs                | Global interceptor logs every mutating action (user, action, entity, before/after diff, IP, timestamp); admin-only search/filter by user, module, date range; retained independently of the records they describe                                                                                                                     |
| 7   | Security Hardening        | Rate limiting on auth and other sensitive endpoints, CSRF protection on state-changing requests, input validation/sanitization on every endpoint, encryption at rest for sensitive fields                                                                                                                                             |

## Phase 3 — Revenue Engine

| #   | Module             | Contains                                                                                                                                                                                           |
| --- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 8   | CRM                | Leads (source, status, assignment) → convert to customer; meetings/calls logged against a customer; notes attachable to any lead/customer/deal; deals tracked through configurable pipeline stages |
| 9   | Sales Management   | Product/service catalog with pricing and tax; quotes → convert to orders; invoices generated from orders; payments recorded against invoices with outstanding balance tracked                      |
| 10  | Finance Management | Income/expense transactions by category; bank account balance tracking; expense approval workflow; P&L and cash-flow reports for a date range                                                      |

## Phase 4 — Operations

| #   | Module                 | Contains                                                                                                                                                                                     |
| --- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 11  | Asset Management        | *(Redesigned from the original "Inventory Management" — this business sells only software/services, not physical goods, so there is no resale stock/warehouse model to track.)* Individual company-owned equipment (laptops, monitors, phones, other equipment) issued to employees; status lifecycle (Assigned / Available / Under Repair / Retired, never deleted once retired); assignment requires selecting an employee |
| 12  | Internal Purchasing     | *(Redesigned from the original "Procurement Management" — no vendor supply chain to manage internally.)* Purchase Request → Manager/Admin approval → "Mark as Purchased" workflow; approval alone creates no financial record; marking purchased (with the actual amount paid) auto-creates a Finance expense, and an Asset record when the category is Equipment |
| 13  | Document Management    | Upload documents against any record (employee, customer, project) to local storage; version history on re-upload; access restricted by role or specific user; file type/size limits enforced |

## Phase 5 — Experience Layer

| #   | Module                       | Contains                                                                                                                                                                                                                                        |
| --- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 14  | Notification System          | In-app, email, SMS, push notifications dispatched through one shared service; per-user channel preferences per event type; read/unread state; delivered via BullMQ jobs and pushed live via WebSockets                                          |
| 15  | Calendar Management          | Events (meeting/deadline/leave/holiday) with multiple attendees; shared department/company-wide calendar view; reminder notification ahead of event start                                                                                       |
| 16  | Dashboard (full integration) | Real widgets: HR summary (headcount, attendance, leave) for HR/Admin; Sales summary (pipeline, revenue) for Sales roles; Finance summary (invoices, cash position) for Finance/Admin; live updates pushed via WebSockets, not full page reloads |
| 17  | Reports & Analytics          | Sales performance report (filterable by date range, rep); HR report (headcount, attendance, leave trends); Finance report (income, expenses, outstanding invoices); export to PDF/Excel                                                         |

## Phase 6 — Extensibility

| #   | Module             | Contains                                                                                                                                                                                                              |
| --- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 18  | Settings           | Company-wide settings (branding, timezone, currency format); API key generation/revocation; manual + scheduled backups (database and local file storage directory), with restore                                      |
| 19  | API & Integrations | Documented REST API for external use; payment gateway integration (Stripe/PayPal) for invoice payments; transactional email provider for outbound email; optional Slack/Microsoft Teams integration for notifications |

## Cross-cutting rules that apply to every module

- `/api/v1` base path, HTTPS only, JSON bodies, `Authorization: Bearer <token>`.
- Success shape `{ success, data, meta }`, error shape `{ success: false, error: { code, message } }`.
- List endpoints share one pagination utility (`?page=&limit=` → `{ page, limit, total, totalPages }`).
- File uploads go through the one shared local-storage service; no module writes to disk directly.
- Every create/update/delete is captured by the global audit-log interceptor automatically.
- Every route enforces RBAC at the API layer, not just in the UI.
