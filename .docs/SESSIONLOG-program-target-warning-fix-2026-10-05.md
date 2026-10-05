# Program removed-target warning — 2026-10-05

Owner requested fixing the warning and including the change in existing Draft PR #215, whose Thai language selection remains approved.

## Cause and smallest correction

useProgramEdit calls removedTargetLabels(stored, edited). That helper intentionally returns one label for each removed target row, including a Group or direct Device. Existing program-edit.check.mts verifies that a Group counts once. PublishChangesDialog incorrectly called the result a Channel count and asserted that playback would stop on every named entry.

The shared dialog now says `Will remove N target(s): labels`. It accurately describes the proposed stored-target edit for Channels, Groups and legacy direct Devices. It does not mistake a Group for a Channel or assert stopped playback when a Channel is still reached through another selected target. The existing plural suffix and zero-target conditional remain unchanged.

No target expansion, snapshot interpretation, API, schema, persistence, activation or permission rule changed. ADR 0080's confirmation intent is retained; this copy reports the target changes that the current model actually knows, without inventing an affected-Channel count. A detailed Channel impact calculation would require a separately validated snapshot/current-reach contract and is not part of this copy correction.

## Verification

- Existing program-edit.check.mts: exited 0, including Group-once and unchanged-target cases. Existing Node MODULE_TYPELESS_PACKAGE_JSON warning only.
- Targeted ESLint for PublishChangesDialog.tsx: exited 0.
- TypeScript `npx tsc --noEmit`: exited 0.
- Production build: initial sandbox attempt failed downloading the existing Manrope/Geist Mono Google Fonts. Retried with network access; `npm run build` exited 0, compiled and generated 107 static pages.
- git diff --check passed; staged diff is checked before commit.
- Browser verification for this new copy remains pending the owner's method selection under CLAUDE.md section 3. Previous #215 screenshots prove the old warning, not this new text. PR remains Draft; no browser pass is claimed.

One JSX text change; no additional test or dependency for a copy-only change. No shared-data write, fixture recreation, reactivation, heartbeat, production change or cleanup performed in this fix session. Previous accepted fixtures remain cancelled/inactive. Owner controls Ready/merge.
