# Agent instructions — Invoify

This file guides automated coding agents (and humans) working in this repository.

## What this project is

**Invoify** is a Next.js web app for creating invoices: form-based editing, live preview, PDF generation, email delivery, and export (JSON, XLSX, CSV, XML). UI uses **Shadcn UI** + **Tailwind CSS**. Forms use **React Hook Form** with **Zod** validation.

## Stack (high level)

- **Next.js 15** (App Router), **React 18**, **TypeScript**
- **next-intl** for locale-aware routes under `app/[locale]/`
- **Puppeteer** (and **puppeteer-core** / **@sparticuz/chromium** where relevant) for PDF rendering
- **Nodemailer** for sending PDFs by email (server-side)

## Commands

From the repo root:

| Command        | Purpose              |
|----------------|----------------------|
| `npm install`  | Install dependencies |
| `npm run dev`  | Development server   |
| `npm run build`| Production build     |
| `npm run lint` | ESLint (Next.js)     |
| `npm run start`| Run production build |

There is no dedicated `test` script in `package.json`; prefer `npm run lint` and `npm run build` to validate changes.

## Repository layout

| Area | Role |
|------|------|
| `app/[locale]/` | Localized pages (`page.tsx`, `template/[id]/`, catch-all) |
| `app/components/` | Feature UI: invoice form, templates, modals, layout |
| `components/ui/` | Shadcn primitives (do not treat as disposable—extend consistently) |
| `app/api/invoice/` | API routes: `generate`, `export`, `send` |
| `lib/` | Schemas (`schemas.ts`), helpers, SEO, shared config (`variables.ts`) |
| `contexts/` | React context (e.g. form default values tied to `InvoiceSchema`) |
| `types.ts` | Types inferred from Zod (`InvoiceType`, etc.) |
| `messages/` | next-intl message JSON per locale |

## Conventions agents should follow

1. **Invoice data shape** — Single source of truth is `lib/schemas.ts` (`InvoiceSchema`, `ItemSchema`). If you add or change fields, update the schema, any templates that render them (`app/components/templates/invoice-pdf/`), and export paths that serialize invoice data.

2. **Imports** — Use the `@/` path alias as in existing files (e.g. `@/lib/schemas`, `@/components/ui/...`).

3. **UI** — Prefer existing Shadcn components under `components/ui/` and patterns in `app/components/reusables/`. Keep styling aligned with Tailwind + existing design tokens.

4. **i18n** — User-facing strings for localized routes should go through **next-intl** and the `messages/` files; avoid hardcoding English in `[locale]` routes without adding keys.

5. **PDF and server APIs** — PDF generation and email sending run on the server; keep secrets (SMTP, etc.) in environment variables, not in code. Do not commit credentials.

6. **Scope** — Match surrounding code style, naming, and file organization. Avoid unrelated refactors in the same change as a feature fix.

## Known product notes

- **Firefox**: There are known issues in Firefox (see project README / linked issue). When testing layout or PDF flows, Chromium-based browsers are the reliable baseline.

## Pull requests

Follow the project’s PR template if present under `.github/`. Keep commits focused; run `npm run lint` (and `npm run build` when touching types, routes, or build-sensitive code) before considering work complete.
