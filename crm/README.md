# Appathy CRM

Production-shaped CRM for a small service business managing customers, recurring services, invoices, reminders, payments, notes, documents, and staff access.

## Stack

- Next.js 15 + TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- Secure cookie sessions with database-backed session records
- RBAC with roles and permissions tables
- Transactional email with Resend-first provider abstraction and SMTP fallback via Nodemailer
- Server-side invoice PDF generation with `jspdf`
- Cron-safe reminder sweep with idempotent reminder jobs

## Project structure

```text
crm/
├── prisma/
│   ├── migrations/202603250001_init/migration.sql
│   ├── schema.prisma
│   └── seed.ts
├── public/uploads/
├── scripts/run-reminders.ts
├── src/
│   ├── app/
│   │   ├── (auth)/login|forgot-password|reset-password
│   │   ├── (app)/dashboard|customers|invoices|subscriptions|tasks|reports|settings|users|notifications
│   │   ├── api/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── charts/
│   │   ├── crm/
│   │   ├── layout/
│   │   ├── providers/
│   │   └── ui/
│   ├── lib/
│   │   ├── auth/
│   │   ├── constants/
│   │   ├── db/
│   │   ├── utils.ts
│   │   └── validators/
│   ├── server/
│   │   ├── actions/
│   │   ├── queries/
│   │   └── services/
│   └── types/
├── .env.example
├── middleware.ts
├── next.config.ts
└── package.json
```

## Phase map

### Phase 1: architecture and file structure

- Standalone CRM app isolated in `/root/appathy/crm`
- Clear split between UI, server actions, API routes, queries, validators, and service layer
- Modular dashboard, customers, invoices, subscriptions, tasks, reports, settings, and notifications areas

### Phase 2: database schema and backend

- PostgreSQL Prisma schema with:
  - users, roles, permissions, user_roles, role_permissions
  - sessions, password_reset_tokens
  - companies, contacts, addresses
  - invoices, invoice_items, payments
  - subscriptions, subscription_events
  - reminder_rules, reminder_jobs
  - email_templates, email_logs
  - tasks, task_comments
  - notes, documents, communication_logs
  - notifications, audit_logs, settings
- Initial SQL migration included in `prisma/migrations/202603250001_init/migration.sql`
- Realistic service-business seed data included in `prisma/seed.ts`

### Phase 3: frontend pages and UI

- Auth flows:
  - `/login`
  - `/forgot-password`
  - `/reset-password`
- Main CRM areas:
  - `/dashboard`
  - `/customers`
  - `/customers/[customerId]`
  - `/companies`
  - `/invoices`
  - `/invoices/new`
  - `/invoices/[invoiceId]`
  - `/subscriptions`
  - `/subscriptions/[subscriptionId]`
  - `/tasks`
  - `/reports`
  - `/settings`
  - `/users`
  - `/notifications`

### Phase 4: automation, reminders, and email

- Reminder engine in `src/server/services/reminders.ts`
- Idempotent reminder jobs keyed by entity/date/offset
- Template rendering and email logging in `src/server/services/email.ts`
- Cron-triggerable endpoint at `POST /api/reminders/run`

### Phase 5: invoice PDF generation and reporting

- PDF invoices generated in `src/server/services/pdf.ts`
- Send endpoint at `POST /api/invoices/[invoiceId]/send`
- PDF endpoint at `GET /api/invoices/[invoiceId]/pdf`
- Reporting summary at `/reports`

### Phase 6: QA and setup

- `npx tsc --noEmit` passes
- Prisma schema validates
- Prisma client generation works in this environment when local engine paths are set explicitly
- Next production build still reports a generic Webpack failure in this sandbox environment; see notes below

## Environment

Copy `.env.example` to `.env.local` and update:

```bash
cp .env.example .env.local
```

Important variables:

- `DATABASE_URL`
- `SESSION_SECRET`
- `APP_URL`
- `CRON_SECRET`
- `BUSINESS_*`
- `INVOICE_PREFIX`
- `PAYMENT_DETAILS`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASSWORD`

## Setup

Install dependencies:

```bash
npm install
```

Generate Prisma client:

```bash
PRISMA_QUERY_ENGINE_LIBRARY=./node_modules/@prisma/engines/libquery_engine-debian-openssl-3.0.x.so.node \
PRISMA_SCHEMA_ENGINE_BINARY=/root/.cache/prisma/master/c2990dca591cba766e3b7ef5d9e8a84796e47ab7/debian-openssl-3.0.x/schema-engine \
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/appathy_crm?schema=public" \
npx prisma generate --schema prisma/schema.prisma
```

Apply schema:

```bash
npx prisma migrate deploy --schema prisma/schema.prisma
```

Seed the CRM foundation:

```bash
npm run db:seed
```

Seed the CRM with realistic outgoing subscriptions and payment history for QA:

```bash
npm run db:seed:sample
```

To create a bootstrap admin during seeding, set:

```bash
CRM_BOOTSTRAP_ADMIN_EMAIL="admin@yourdomain.com"
CRM_BOOTSTRAP_ADMIN_PASSWORD="choose-a-strong-password"
```

Optional sample-data flags:

```bash
CRM_INCLUDE_SAMPLE_DATA="true"
```

Start development:

```bash
npm run dev
```

Run the reminder worker manually:

```bash
npm run jobs:reminders
```

## Bootstrap access

- The seed no longer creates demo customers, invoices, or sample staff accounts.
- Set `CRM_BOOTSTRAP_ADMIN_EMAIL` and `CRM_BOOTSTRAP_ADMIN_PASSWORD` before running `npm run db:seed` if you want it to create an initial admin login.
- Set `CRM_INCLUDE_SAMPLE_DATA=true` or run `npm run db:seed:sample` if you want realistic outgoing subscriptions, payment history, and reminder-ready dates for QA.

## End-to-end QA

Run the outgoings browser flow:

```bash
npm run e2e:outgoings
```

What it covers:

- sign in with a dedicated QA admin
- create a new outgoing subscription
- confirm the outgoing appears in dashboard activity
- trigger the reminder sweep and verify the notification appears
- record a payment
- verify the payment surfaces in reports

Optional e2e credentials:

```bash
CRM_E2E_ADMIN_EMAIL="e2e-admin@appathy.local"
CRM_E2E_ADMIN_PASSWORD="ChangeMe123!"
```

## API overview

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET|POST /api/customers`
- `GET|PATCH /api/customers/[customerId]`
- `GET|POST /api/invoices`
- `POST /api/invoices/[invoiceId]/send`
- `GET /api/invoices/[invoiceId]/pdf`
- `POST /api/invoices/[invoiceId]/payments`
- `GET|POST /api/subscriptions`
- `PATCH /api/subscriptions/[subscriptionId]`
- `GET|POST /api/tasks`
- `PATCH /api/tasks/[taskId]`
- `GET|PATCH /api/settings`
- `GET /api/notifications`
- `POST /api/documents`
- `POST /api/reminders/run`

## Security notes

- Sessions are stored server-side and represented in the browser by an HTTP-only cookie
- Password reset tokens are hashed before storage
- RBAC is enforced in server actions and API handlers
- Reminder jobs use idempotency keys to prevent duplicate sends
- Audit logging is wired for login, invoice, reminder, payment, and settings actions

## Known follow-up

- The CRM structure, schema, seed, server layer, pages, APIs, and reminder system are in place.
- In this sandbox, `next build` still ends with a generic Webpack failure after server bundle compilation, even though TypeScript and Prisma validation pass. The codebase is left in a generation-ready state with the exact Prisma engine workaround documented above.
