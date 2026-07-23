@AGENTS.md

# CLAUDE.md

Guidance for Claude Code working in this repo.

> **Status: R&D scaffolding.** Folders, `index.ts` barrels and `.gitkeep` only — no feature logic exists yet. Don't assume an existing implementation; check the file before referencing it.

## Commands

```bash
pnpm dev      # dev server (localhost:3000)
pnpm build    # production build
pnpm lint     # eslint
```

pnpm only — this repo has `pnpm-workspace.yaml` and a pnpm lockfile. No test runner is set up yet.

## What this is

Thunder One = **DOOH (Digital Out-of-Home) video publishing frontend**. Upload video → assign to screens via playlists → publish.

**It has no backend of its own.** The backend is the sibling project `Thunder_Core` (`../Thunder_Core`), which owns the database and exposes `/api/core/v1/media/*`. This repo is a client: axios → `NEXT_PUBLIC_API_BASE_URL`.

Before designing anything data-shaped, read `../Thunder_Core/docs/media_core_mapping.md` — it holds the agreed entity mapping and the Phase 0 decisions (pull-based player polling, `device_credentials` bearer auth, 1h signed URLs, 60s heartbeat). Don't re-decide those here.

### Terminology — the one trap

| This repo says      | Thunder_Core stores it in                             | Note                                              |
| ------------------- | ----------------------------------------------------- | ------------------------------------------------- |
| Video / media asset | `media_core.media_assets` (+ `public.files`)          |                                                   |
| Screen / player     | `public.assets`                                       | **not** `public.devices` — that's for IoT sensors |
| Playlist / schedule | `media_core.playlists`, `playlist_items`, `schedules` |                                                   |

Thunder*Core's word "Asset" means \_physical equipment*, not media file. Never use "asset" unqualified in code or docs here — say `video` or `screen`.

## Architecture: feature-first

Full tree and rationale in [README.md](README.md). The rules that matter when writing code:

- `src/app/` is **routes only** — import from `features/*` and render. No business logic, no fetching.
- A feature imports another feature **only through its `index.ts`**. Never reach into `features/x/services/...` from outside `x`.
- Used by 2+ features → promote to top-level `components/`, `hooks/`, `lib/`, `types/`. Used by one → keep it inside the feature.
- **Every HTTP call goes through `src/lib/api/client.ts`** (the shared axios instance), wrapped in that feature's `services/`. Never `axios.create()` again, never `fetch()` a backend URL directly.
- **Env vars only via `src/config/env.ts`.** No `process.env.*` scattered around. New var → add to `env.ts` _and_ `.env.example`.
- Path alias: `@/` → `src/`.

# Workflow Rules

- **Ask First (Pre-Execution Review):** ก่อนเขียนโค้ดหรือเปลี่ยนโครงสร้างหลัก ต้องเสนอ 2–3 ทางเลือกและรอการอนุมัติ
- **Risk tags:** R0 = irreversible (ขออนุญาตก่อน) / R1 = costly (ระบุเหตุผล) / R2 = easy (ทำได้เลย)
- **NO MAGIC:** ห้ามเดาว่ามีไฟล์/โฟลเดอร์อยู่ ถ้าไม่แน่ใจให้ถาม
- **Verify Before Done:** ต้องมีหลักฐานการทดสอบก่อนบอกว่าเสร็จ — ฟีเจอร์ที่พึ่ง external API (Thunder Core ฯลฯ) `npm run build` ผ่านอย่างเดียว**ไม่นับว่าเสร็จ** ต้องมี manual E2E checklist หรือระบุชัดว่ายังไม่ได้ verify กับ Thunder จริง
- **No Scope Creep:** ทำแค่ที่สั่ง ห้ามเพิ่มฟีเจอร์เอง ห้าม refactor โค้ดที่ไม่เกี่ยว

## Conventions

- Server Components by default; `"use client"` only where interactivity or hooks are actually needed.
- TypeScript strict. Type explicitly, avoid `any`. Feature-local types in `features/<x>/types/`, shared ones in `src/types/`.
- Tailwind CSS 4 only — no separate CSS files beyond `globals.css`.
- Components: `PascalCase.tsx`. Hooks: `useThing.ts`. Utilities/directories: kebab-case.
- Don't add dependencies. Current set is deliberately tiny (next, react, axios, tailwind) — if something seems to need a library, say so before installing.
- Make surgical changes. No abstractions until a pattern repeats 3+ times; no scaffolding "for later".
- camelCase (vars/functions), PascalCase (components/types), kebab-case (files), SCREAMING_SNAKE (constants)
- Boolean: is/has/should/can prefix; arrow functions; public API บนสุด helpers ล่าง
- ไฟล์ ≤ 300 บรรทัด; ไม่มี `any`, dead code, commented-out code
- **ไม่ใส่ Claude เป็น contributor** — ไม่มี "Co-Authored-By: Claude" ใน commits
