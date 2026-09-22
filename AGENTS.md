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
