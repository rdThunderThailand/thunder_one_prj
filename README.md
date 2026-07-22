# Thunder One

DOOH (Digital Out-of-Home) video publishing platform — MVP.

Stack: Next.js (App Router) + TypeScript + Tailwind CSS + axios, package-managed with **pnpm**.

> Status: R&D. This repo currently contains folder/file scaffolding only —
> no feature logic is implemented yet.

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
    (dashboard)/
      videos/page.tsx
      screens/page.tsx
      playlists/page.tsx
      layout.tsx

  features/            One folder per business domain. This is where most work happens.
    videos/            Video content library (upload/list/manage assets)
    screens/           Screen / player registry
    playlists/         Scheduling — assign videos to screens
    auth/              Authentication / session
      components/      Feature-scoped UI
      hooks/           Feature-scoped React hooks
      services/        API calls for this feature (axios), via src/lib/api/client
      types/           TypeScript types for this feature's domain
      index.ts         Public API of the feature — only export what's needed outside it

  components/          Shared/cross-feature UI
    ui/                 Design-system primitives (buttons, inputs, ...)
    layout/             App shell pieces (header, sidebar, ...)

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
