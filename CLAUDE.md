# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commit rules

**NEVER add `Co-Authored-By` lines to any commit message.** Commits must show only the human author. No exceptions.

## Commands

```bash
npm run dev     # start dev server (Next.js, Turbopack) at http://localhost:3000
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint (flat config, eslint-config-next core-web-vitals + typescript)
```

There is no test runner configured yet.

## Important: unfamiliar Next.js version

`package.json` pins `next@16.2.12`, `react@19.2.4`, and `react-dom@19.2.4` — versions beyond this model's training data. APIs and conventions may differ from what you expect. Per `AGENTS.md`, read the relevant docs in `node_modules/next/dist/docs/` (organized into `01-getting-started`, `02-guides`, `03-api-reference` under the `app` router section) before writing routing, data-fetching, or config code, and watch for deprecation notices.

## Architecture

This is a Next.js App Router project (`app/` directory), currently an early-stage scaffold for a personal finance app ("Pockit"). Styling is Tailwind CSS v4, imported directly in `app/globals.css` via `@import "tailwindcss"` (no `tailwind.config` file — theme tokens are defined inline with `@theme`).

Routing is split into two route groups under `app/`, each with its own layout:

- `app/(auth)/` — unauthenticated flow (`login/`)
- `app/(dashboard)/` — authenticated app shell, with sibling routes: `analytics/`, `chatbot/`, `settings/`, `subscriptions/`, `wallet/`, plus a dashboard index page

`app/components/layout/sidebar.tsx` holds the dashboard's navigation shell.

**Current state:** the route-group layouts (`(auth)/layout.tsx`, `(dashboard)/layout.tsx`), the sidebar component, and every page inside `(auth)` and `(dashboard)` are empty stub files — the directory structure has been scaffolded but not yet implemented. `app/page.tsx` and `app/layout.tsx` at the root still contain the unmodified `create-next-app` boilerplate. When implementing a route, check sibling stubs for the intended structure before introducing new conventions.

Path alias `@/*` resolves to the project root (see `tsconfig.json`).
