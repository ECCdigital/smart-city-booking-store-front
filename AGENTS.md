# Agent Instructions — Smart City Booking Storefront

Instructions for AI coding agents (Codex, Cursor, Claude Code). Human docs live in `README.md` and `doc/`.

## Project

Nuxt 4 / Vue 3 public booking UI for multi-tenant resource booking (rooms, sports facilities, makerspaces). Nitro BFF proxies the backend API; auth tokens live in HTTP-only cookies. GPL-3.0.

| Area | Path | Purpose |
|------|------|---------|
| Pages & UI | `app/pages/`, `app/components/` | Routes, layouts, Vue components |
| Client logic | `app/composables/`, `stores/` | Reusable logic, Pinia state |
| BFF / server | `server/api/` | Nitro routes proxying the backend API |
| Auth & cookies | `server/service/`, `server/api/auth/` | Token handling, SSO, card login |
| i18n | `i18n/locales/` | German (default) and English |
| Shared types | `shared/types/` | TypeScript types shared across layers |

See [docs/agents/architecture.md](docs/agents/architecture.md) for layout and data flow.

## Ecosystem

This repo is the **public storefront only**. Backend and admin live in separate repositories:

| Component | Repository | Role |
|-----------|------------|------|
| **Backend API** | [smart-city-booking-backend](https://github.com/ECCdigital/smart-city-booking-backend) | REST API, auth, bookings, tenants (v4.x required) |
| **Admin UI** | [smart-city-booking-vue-app](https://github.com/ECCdigital/smart-city-booking-vue-app) | Administration, configuration, JS web interface |
| **Storefront** | [smart-city-booking-store-front](https://github.com/ECCdigital/smart-city-booking-store-front) | Public booking UI (this repo) |

Do not assume backend or admin code is in this repo. API contract changes may require coordinated updates in the backend repo.

## Commands

```bash
npm install          # install dependencies
npm run dev          # dev server (needs running v4.x backend)
npm run build        # production build (Nitro node-server preset)
npm run preview      # local production preview
npm run lint:check   # eslint
```

Run `npm run lint:check` before finishing a task. Fix lint issues you introduce.

## Coding standards

- **Written language:** English for all code, comments, commit messages, PR titles/descriptions, and changelog entries
- **User-facing copy:** German and English via i18n — add keys to both `i18n/locales/de.json` and `i18n/locales/en.json`
- **Style:** ESLint (Nuxt flat config) — match surrounding code
- **DRY:** Reuse existing composables, stores, and server utilities; extract shared logic only when duplication is real — avoid premature abstractions
- **Scope:** Minimal, focused diffs; no drive-by refactors
- **API calls:** Client code calls `/api/*` (BFF), not the backend directly — use `useApiClient()` or `$fetch` with credentials
- **Auth:** Tokens in HTTP-only cookies — never expose tokens to client-side JavaScript
- **Tenancy:** Routes under `/t/:tenantID/...` — use `useTenantRoute()` for tenant-aware navigation
- **Secrets:** Never commit `.env`, credentials, or real tokens

Details: [docs/agents/coding-standards.md](docs/agents/coding-standards.md)

## Domain-specific guides

| Topic | File |
|-------|------|
| Architecture & data flow | [docs/agents/architecture.md](docs/agents/architecture.md) |
| Nitro BFF / server routes | [docs/agents/server.md](docs/agents/server.md) |
| Vue components & pages | [docs/agents/components.md](docs/agents/components.md) |
| i18n | [docs/agents/i18n.md](docs/agents/i18n.md) |

## Guardrails

- Do **not** change version branches (`version/1.x`) unless explicitly asked
- Do **not** commit without being asked
- Do **not** add dependencies without good reason
- Prefer extending existing composables/stores/server routes over duplicating logic
- Changes require a changelog entry in `doc/CHANGELOG.md`. Keep it short.
- Backend and admin repos are separate — see [Ecosystem](#ecosystem) above
- Requires **v4.x backend** — do not add v3 compatibility unless explicitly asked

## Tool setup

| Tool | Entry point |
|------|-------------|
| **Codex** | Reads this file (`AGENTS.md`) natively |
| **Cursor** | Reads `AGENTS.md` + `.cursor/rules/*.mdc` |
| **Claude Code** | Reads `CLAUDE.md` → imports this file |

Structure overview: [docs/agents/README.md](docs/agents/README.md)
