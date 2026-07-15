# Workspace Map

This repo contains a few different projects and a fair amount of generated output, so this is the quickest way to stay oriented.

## What serves `appathy.uk`

- [`src/app`](/root/appathy/src/app): main Next.js app router for the live public site and admin area
- [`src/components/site`](/root/appathy/src/components/site): public marketing components
- [`src/components/admin`](/root/appathy/src/components/admin): admin-specific components
- [`src/components/ui`](/root/appathy/src/components/ui): reusable primitives
- [`src/lib`](/root/appathy/src/lib): auth, Prisma, utilities, request helpers, validation, and constants
- [`public`](/root/appathy/public): static files such as images and uploads
- [`prisma`](/root/appathy/prisma): schema and seeds for the main app
- [`scripts`](/root/appathy/scripts): local setup helpers
- [`tests/e2e`](/root/appathy/tests/e2e): Playwright tests for the main app

## Other in-repo projects

- [`crm`](/root/appathy/crm): separate CRM app with its own `src`, `prisma`, and tests

## Directories to mostly ignore while editing

- [`.next`](/root/appathy/.next): active build output
- [`.next-broken-20260330-2047`](/root/appathy/.next-broken-20260330-2047): old broken build snapshot
- [`.next_broken_1774272244`](/root/appathy/.next_broken_1774272244): old broken build snapshot
- [`.next_failed_1774272447`](/root/appathy/.next_failed_1774272447): failed build snapshot
- [`.next_old`](/root/appathy/.next_old): archived build output
- [`.scf_deploy_work`](/root/appathy/.scf_deploy_work): unrelated deployment work area
- [`node_modules`](/root/appathy/node_modules): dependencies

## Suggested editing path

1. Start in [`src/app`](/root/appathy/src/app) for route ownership.
2. Move to [`src/components/site`](/root/appathy/src/components/site) or [`src/components/admin`](/root/appathy/src/components/admin) for UI.
3. Use [`src/lib`](/root/appathy/src/lib) for shared logic and server helpers.
4. Check [`public`](/root/appathy/public) only for static assets.
5. Stay out of archived `.next*` folders unless you are debugging build artifacts on purpose.
