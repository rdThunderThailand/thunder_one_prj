# Skeleton shares a neutral four-pixel primitive

**Status:** accepted · 2026-11-13
**Extends:** ADR 0104 (component-family consolidation)
**Source:** owner chose option A, then requested `ui/...` as the canonical import/implementation name

Use one Skeleton implementation in `src/components/ui/Skeleton.tsx` with
`animate-pulse rounded-xs bg-muted`: neutral fill and the existing 4px radius token.
All 25 direct consumer files import `@/components/ui/Skeleton`; six imports were migrated
from lovable. Retain `src/components/ui/lovable/skeleton.tsx` as a named re-export for
compatibility. No entry point is deleted.

Preserve the lovable primitive's HTML div props and `cn` merge behavior. Caller classes
must override defaults, including explicit radii, sizes and backgrounds. Keep semantic
loading announcements in feature wrappers; do not add a duplicate status role to the primitive.

The alternative was neutral fill with the existing lovable 10px default radius. Option A
preserves the intended default style of the 19 shared-UI importers; the 6 lovable importer
files change from primary tint/10px to neutral/4px where not overridden. Majority usage
supports compatibility here but is not visual authority: the design-system Skeleton spec
does not mandate fill/radius. `cn` also makes shared-UI caller precedence explicit rather
than preserving accidental CSS ordering from template concatenation.

The two Skeleton implementation/entry-point files and six import statements change.
The canonical-name amendment replaces the initial reverse re-export direction; visual output
and props stay identical. No upstream token change, new dependency, wrapper redesign or
subsequent component family is included. Browser verification limits are recorded in the plan/session log; this decision
does not claim every live route transition has been observed.
