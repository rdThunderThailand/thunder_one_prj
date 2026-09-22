# Plan — Lovable → thunder_one_prj port workflow

Status: **rev 3, [DECIDED] on the four §6 questions; R1–R6 wording reviewed — ready to move into
`CLAUDE.md` on the owner's go** (2026-09-18). Rev 1 was reviewed and reworked: its central claim that "installing shadcn gives
Lovable 1:1" was wrong (see §3).

Goal: make a Lovable port land accurately on the first pass **without breaking the repo's data,
behavior, or shell contracts**.

Context: the first port (branch `style/lovable-tokens`, ADR 0075) needed several review rounds to
match the mockup even though the full Lovable source was available from the start.

## 1. What actually went wrong (evidence from the first port)

| Symptom the owner caught | Root cause |
|---|---|
| Cards kept `border-zinc-200`, `border-border` was stacked on top | Lovable classes were *merged into* existing markup, not *replacing* it |
| Every card's hover state missing | Source was read once, then written from memory |
| Profile block, date box, icon baselines wrong | Repo has no `Button variant="outline"` / `size="icon"`; the port approximated by hand |
| Three rounds of the owner pointing at elements | Lovable's `preview_url` was never compared against `localhost` |

Underlying conflict: CLAUDE.md §8 + ponytail say "shortest diff, don't touch what you don't have to".
Right for bug fixes, wrong for a design port — under that pressure the AI reliably keeps the old class.
None of this was an MCP/extraction problem.

## 2. Rules (→ CLAUDE.md, new section "Porting from Lovable")

**R1 — Replace, don't stack.**
Replace the complete visual treatment of every touched element; never leave conflicting legacy
classes alongside Lovable's. Elements outside the task's surface stay untouched — the boundary is
explicit, the inside is exact. Copy *treatment*, not markup: fake controls, mock-only responsive
behavior, or structure that contradicts the data/behavior contract are not ported.

**R2 — Two authorities, one boundary.**
- Visual presentation within the explicitly touched surface → **Lovable is authoritative.**
- Data, behavior, accessibility, routes, permissions, and code structure → **the repository and
  accepted ADRs are authoritative.**
(ADR 0075 already states this split; CLAUDE.md must carry both sentences so "repo is the source of
truth" is not read as covering the palette.)

**R3 — Checklist at component/state level, compared against source while implementing.**
Per touched component: layout, spacing, type, color, icon, hover, focus, disabled, loading, empty,
responsive. Tick each against the Lovable file *as you implement* — no copying class strings into a
scratchpad, no writing from memory.

**R4 — Side-by-side proof, behind the repo's browser gate.**
Before declaring visual completion, offer the repository's browser-verification choices (CLAUDE.md
§3). If browser verification is approved, compare Lovable's `preview_url` and `localhost` side by
side and report the remaining deltas yourself. The owner confirms a diff list; they do not discover
it.

**R5 — Dependencies for UI/motion: propose in full, never install silently.**
If matching Lovable needs a package, stop and propose with: the exact direct packages
(runtime vs dev), what each replaces, why native/existing code cannot do it, which routes/bundles
are affected, and which files change. Report size only when a real bundle delta was measured.
Install only after an explicit yes. §8's default ("write it yourself") is unchanged — R5 only
permits *asking*.

**R6 — Copy primitive parity; do not infer it from a library name.**
For each touched surface, copy the primitive implementation from the pinned Lovable source. Use an
existing repository or upstream shadcn primitive only after comparing the implementation,
configuration, and required dependencies. (Decision record and namespace: §3.)

## 3. Primitives — decision: **B (modified): copy exact Lovable primitives per surface**

Facts:
- `thunder_one_prj` is not shadcn: a bespoke 22-file kit in `src/components/ui/`, no `cn`, no Radix,
  no `class-variance-authority`. Legacy usage inside Media Workspace alone: 133 files (`Button` 57,
  `Card` 49, `Modal` 23…). `Card` is imported by 282 files repo-wide.
- Lovable is shadcn (Tailwind v4 + Radix + `cn`), and its token variable names are shadcn's — which
  is why ADR 0075 could paste them into `globals.css` unchanged. The tokens already match; the
  components do not.
- **shadcn does not guarantee primitive parity.** It delivers editable source, not a shared runtime;
  `Button variant="outline"` matches Lovable only if the implementation, config, and version are the
  ones Lovable used ([shadcn introduction](https://ui.shadcn.com/docs),
  [components.json](https://ui.shadcn.com/docs/components-json)). `shadcn init` therefore does not
  achieve the goal, and the CLI warns it may overwrite existing components
  ([CLI docs](https://ui.shadcn.com/docs/cli)).

Options considered:

| | A. Mapping table only | **B (modified). Copy Lovable's primitives, per surface** | C. Migrate the whole kit |
|---|---|---|---|
| Fidelity | Every port still hand-rolls variants | Exact: the same source Lovable rendered | Exact |
| Blast radius | none | Only files the port touches | 282+ files, Apps with no target design |
| Deps | none | Derived from the copied files' real imports, approved via R5 | same, all at once |

**Decision [DECIDED]:**
1. **No `shadcn init`, no pre-installing a primitive set.** When a port touches a surface, copy the
   exact primitive implementation that surface uses from the Lovable project (via MCP `read_file`),
   at Lovable's commit. Use upstream shadcn only when the two implementations are confirmed
   equivalent.
2. **Namespace `src/components/ui/lovable/`.** The legacy kit is **not** renamed — `Card` has 282
   importers, and shadcn's default `button.tsx` would collide with `Button.tsx` on a
   case-insensitive filesystem.
3. **Legacy imports remain allowed.** New or touched Lovable-ported surfaces use the `lovable/`
   namespace; nothing else migrates. The "1 day" estimate applies to Topbar + Overview only, not to
   Media Workspace's 133 legacy call sites.
4. **Dependencies are derived, not predicted.** After copying a primitive, list its direct imports
   (Lovable's `package.json` is the reference; note `clsx` is currently only transitive here via
   `recharts` — a direct import needs a direct declaration) and propose them under R5. Rev 1's
   nine-package list is withdrawn.
5. **Sequencing [DECIDED]:** finish `style/lovable-tokens` first — complete the outstanding
   verification, then commit/PR the current work. Primitive adoption is a follow-up branch/PR so ADR
   0075's blast radius does not grow.

## 4. Corrections to the team workflow doc (as it applies to this repo)

- "Never merge Lovable's `src/components/ui/*` into a repo that already has shadcn" — this repo does
  not have shadcn; §3 replaces that rule with "copy per surface into `ui/lovable/`".
- Add the R2 two-authority split — the current single sentence is the direct cause of the palette
  carry-over.
- Rephrase "dependency creep" from a blanket "don't" into R5's "propose in full".
- Keep the generic doc as background; the repo-specific block (§2–§3) goes in `CLAUDE.md`.

## 5. Sequence

1. Owner confirms the R1–R6 wording above (or edits it) → write the block into `CLAUDE.md`.
2. ~~Close out `style/lovable-tokens`~~ — done: PR #130 merged into `dev` 2026-09-18. For any later
   port: complete verification, then commit/open a Draft PR only when explicitly requested; ask for
   the PR language at that point.
3. Follow-up branch: copy the primitives Topbar/Overview actually use into `ui/lovable/`, propose
   their derived deps (R5), re-express the hand-rolled controls on them.
4. Skill `/port-lovable` encoding R1–R6 — after two or three manual ports, so the checklist format
   comes from real cases.

## 6. Decisions recorded (owner, 2026-09-18)

1. Primitive strategy: **B modified** — copy exact Lovable primitives per surface; no `shadcn init`;
   nothing pre-installed.
2. Namespace: **`src/components/ui/lovable/`**; legacy kit keeps its names.
3. Sequencing: **the first port shipped on its own** (PR #130, merged 2026-09-18); primitive adoption is a separate PR.
4. R5: **full detail** — exact direct packages, runtime/dev, what they replace, why native/existing
   won't do, affected routes/bundles, files changed; size only when measured.
