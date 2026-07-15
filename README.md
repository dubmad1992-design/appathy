# Appathy

Public website and admin portal for Appathy.

## Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Prisma
- SQLite

## Local development

```bash
npm install
npm run build
npm run start
```

## Notes

- This workspace now serves the Appathy site at `https://appathy.uk/`.
- The SCF Cooling code is now kept in the isolated [`/root/SCFcooling`](/root/SCFcooling/README.md) workspace so changes there do not affect the Appathy Next.js app.
- The Macauleyraw portfolio is now treated as its own standalone project in [`/root/Macauleyraw`](/root/Macauleyraw), so this workspace no longer owns its app registry seed data or nginx config.

## Workspace map

- [`src/app`](/root/appathy/src/app): Next.js routes for the public site, admin pages, and API routes.
- [`src/components/site`](/root/appathy/src/components/site): Public-facing layout and marketing components.
- [`src/components/admin`](/root/appathy/src/components/admin): Admin shell and admin-only UI.
- [`src/components/ui`](/root/appathy/src/components/ui): Shared primitive UI components.
- [`src/lib`](/root/appathy/src/lib): Server helpers, auth, Prisma access, validation, constants, and utilities.
- [`public`](/root/appathy/public): Static assets served directly by the app.
- [`prisma`](/root/appathy/prisma): Schema, seed data, and local SQLite files.
- [`scripts`](/root/appathy/scripts): One-off local scripts for db setup and e2e prep.
- [`tests/e2e`](/root/appathy/tests/e2e): End-to-end coverage for the Appathy site.
- [`crm`](/root/appathy/crm): Separate CRM app kept in-repo, but not part of the `appathy.uk` runtime.

See the fuller guide in [`docs/WORKSPACE_MAP.md`](/root/appathy/docs/WORKSPACE_MAP.md).
