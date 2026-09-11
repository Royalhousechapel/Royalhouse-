# Royalhouse Chapel Worldwide Digital Kingdom Platform

A mobile-first member experience for Royalhouse Chapel Worldwide, bringing ministry content, sermons, events, prayer, giving, ministries, and member access into one premium app.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/royalhouse-mobile` — Expo mobile app and the first member-facing product surface
- `artifacts/royalhouse-mobile/app/(tabs)/index.tsx` — home, sermons, giving, events, prayer, ministries, branch directory, and profile flows
- `artifacts/royalhouse-mobile/constants/colors.ts` — Royalhouse navy/gold design tokens
- `artifacts/royalhouse-mobile/assets/images` — supplied logo, payment reference, and ministry atmosphere asset
- `lib/api-spec/openapi.yaml` — shared backend contract for future website/admin/mobile synchronization

## Architecture decisions

- The first release uses Expo Go for the mobile experience and PostgreSQL/API persistence as the shared source of truth for branches, people, Connect Team assignments, interactions, follow-ups, workflow options, and audit records.
- Replit-managed Clerk provides authentication. Expo sends Clerk bearer tokens to the API, and role/module permissions are enforced server-side; mobile visibility is not an authorization boundary.
- Royal blue and royal gold are the primary brand signals, derived from the supplied payment reference and the supplied Victory Center logo.
- The mobile experience is organized around daily member behavior: listen, give, pray, attend, find a ministry, and manage a member profile.
- The shared OpenAPI contract and generated React Query/Zod clients synchronize the website, admin portal, and mobile client.

## Product

The Royalhouse Chapel mobile app gives members a welcoming home feed, live-service entry point, sermon library, event calendar, giving flow with one-time and recurring options, prayer center, ministry directory, global branch directory, and digital member profile.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Use the artifact-managed Expo workflow for previews so Expo Go receives the correct host configuration.
- Giving and prayer flows still include local-first member actions, while administrative identity and Connect Team workflows are server-backed.
- Connect Team workflow choices remain configurable records with trigger configuration; do not hard-code the final outcome list in the mobile UI.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
