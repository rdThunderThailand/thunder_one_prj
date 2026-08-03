# Thunder One

DOOH (Digital Out-of-Home) video publishing platform — MVP.

Stack: Next.js (App Router) + TypeScript + Tailwind CSS + axios, package-managed with **pnpm**.

> Status: R&D. `auth` (login/register) and `overview` (dashboard home) have
> real UI, backed by mock data / placeholder endpoints — no backend exists
> yet. Everything else is folder/file scaffolding only.

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy `.env.example` to `.env.local` and fill in values as they become available.

## Architecture: feature-first

```
src/
  app/                 Routes only (App Router). Thin: compose features, no business logic.
    (auth)/              Unauthenticated shell — no sidebar/topbar
      login/page.tsx
      register/page.tsx
      layout.tsx
    (dashboard)/         Authenticated shell — Sidebar + Topbar + ShortcutsBar
      page.tsx            Overview (dashboard home, route "/")
      assets/page.tsx
      channels/page.tsx
      playlists/page.tsx
      layout.tsx

  features/            One folder per business domain. This is where most work happens.
    overview/          Dashboard home — composes widgets from other features
    assets/            Central Asset repository (upload/list/manage media files)
    channels/          Channel registry — publishing destinations, each backed by a Device
    playlists/         Ordered sequences of Assets (no scheduling/targeting — see Publication)
    auth/              Authentication / session — LoginForm, RegisterForm
      components/      Feature-scoped UI
      hooks/           Feature-scoped React hooks
      services/        API calls for this feature (axios), via src/lib/api/client
      types/           TypeScript types for this feature's domain
      index.ts         Public API of the feature — only export what's needed outside it

  components/          Shared/cross-feature UI
    ui/                 Design-system primitives (Button, Input, Card, Badge, ...)
    layout/             App shell pieces (Sidebar, Topbar, PageHeader, ShortcutsBar)

  hooks/               Shared/cross-feature hooks
  lib/
    api/client.ts       Shared axios instance
    utils/               Shared utility functions
  config/              Typed env/config access
  constants/           Shared constants/enums
  types/               Shared/global TypeScript types
```

### Rules of thumb

- A route file under `app/` should mostly import from `features/*` and render — avoid putting logic directly in `app/`.
- A feature should not reach into another feature's internals — only import from another feature's `index.ts`.
- Anything used by 2+ features belongs in `components/`, `hooks/`, `lib/`, or `types/` at the top level, not inside a feature.
- All HTTP calls go through `src/lib/api/client.ts` (axios instance), wrapped in a feature's `services/`.

## Scripts

```bash
pnpm dev      # start dev server
pnpm build    # production build
pnpm start    # start production server
pnpm lint     # eslint
```
