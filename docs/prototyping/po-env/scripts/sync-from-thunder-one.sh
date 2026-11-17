#!/usr/bin/env bash
# Copy the design system, primitives, nav, glossary and domain types from the product repo.
# Usage: scripts/sync-from-thunder-one.sh [path-to-thunder_one_prj]   (default: ../thunder_one_prj)
# Keep this list in step with "Synced files" in AGENTS.md and SYNCED in scripts/prototype-guard.mjs.
set -euo pipefail

SRC="${1:-../thunder_one_prj}"
DEST="$(cd "$(dirname "$0")/.." && pwd)"
[ -f "$SRC/AGENTS.md" ] || { echo "not a thunder_one_prj checkout: $SRC" >&2; exit 1; }

command -v rsync >/dev/null || { echo "rsync is required (apt-get install rsync)" >&2; exit 1; }

dirs=(
  src/components/ui
  src/design-system
  public/brand
)
files=(
  src/lib/utils.ts
  src/lib/media-kind.ts
  src/types/domain.ts
  src/app/globals.css
  src/config/nav/media-workspace.tsx
  src/config/nav/types.ts
  CONTEXT.md
)

for d in "${dirs[@]}"; do
  mkdir -p "$DEST/$d"
  rsync -a --delete "$SRC/$d/" "$DEST/$d/"
done
# Skill: .agents/skills is the primary copy (most agents read it). Fall back to .claude/skills when the
# product checkout has no .agents copy, and write the same skill to both paths here.
SKILL_SRC="$SRC/.agents/skills/thunderone-ui"
if [ ! -f "$SKILL_SRC/SKILL.md" ]; then
  echo "warning: $SKILL_SRC missing; falling back to .claude/skills/thunderone-ui" >&2
  SKILL_SRC="$SRC/.claude/skills/thunderone-ui"
  [ -f "$SKILL_SRC/SKILL.md" ] || { echo "no thunderone-ui skill in $SRC" >&2; exit 1; }
fi
for d in .agents/skills/thunderone-ui .claude/skills/thunderone-ui; do
  mkdir -p "$DEST/$d"
  rsync -a --delete "$SKILL_SRC/" "$DEST/$d/"
done

for f in "${files[@]}"; do
  mkdir -p "$DEST/$(dirname "$f")"
  cp "$SRC/$f" "$DEST/$f"
done

# Record what was synced so drift is visible in review.
git -C "$SRC" rev-parse HEAD > "$DEST/SYNCED_FROM"
echo "synced from $(cat "$DEST/SYNCED_FROM")"
