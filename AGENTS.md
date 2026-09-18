<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## JSX formatting

Write JSX with one element per line, matching the surrounding file. A `return` statement that renders more than a couple of elements gets multi-line JSX with normal indentation, not a single collapsed line.

## Media Workspace styling

Inside `src/features/media-workspace/` use the tokens from `src/app/globals.css` (`primary`, `foreground`,
`muted-foreground`, `border`, `card`, `success/warning/danger`) — no raw `indigo-*`/`zinc-*`/`bg-white`
and no `dark:` variants (the app is light-only). ADR 0075, Consequences.

New or changed Media Workspace UI must use the copied primitives in `src/components/ui/lovable/`
and the tokens in `src/app/globals.css` as its component source. Copy an existing Lovable primitive
instead of recreating it locally. ADR 0076, Decision 1.

## Porting from Lovable

Full rules R1–R6 and the primitive decision: `docs/media-workspace/plan-lovable-port-workflow.md` §2–§3 — read before any port.

- Two authorities: visual presentation inside the touched surface → Lovable; data, behavior, accessibility, routes, permissions, code structure → this repo and its ADRs.
- Replace the whole visual treatment of each touched element, checking every state (hover, focus, disabled, loading, empty, responsive) against the Lovable file as you implement.
- New UI/motion dependency: propose in full (packages, what each replaces, why native won't do, routes, files) and wait for a yes.
- Primitives: copy the exact Lovable source into `src/components/ui/lovable/`; the legacy `src/components/ui/` kit stays as is.
- Before calling a port done: offer the browser-verification choices, then compare Lovable's `preview_url` with localhost and report the deltas yourself.
