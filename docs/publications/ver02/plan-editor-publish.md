# Plan — editor to Publication wizard handoff

## Scope

- Add a Publish action to saved Playlist and Composition editors.
- Generalize the Create wizard seed from `compositionId` to `playlistId` and `assetId`.
- Keep the existing pending-seed resolver: an existing draft is never overwritten before the operator chooses Start fresh.

## Implementation

1. Parse one typed seed from the three supported query parameters.
2. Apply the seed to the matching draft field and move the wizard to Step 2; resolve an Asset kind from the existing Asset load.
3. Route saved, unchanged Playlist and Composition editors to the wizard with their id.
4. Keep Publish disabled until the editor content has been saved.

## Verification

- Extend the existing seed resolver assertion file.
- Run targeted ESLint, TypeScript with the documented pre-existing-error allowance, and `git diff --check`.
- Ask before completion-level browser verification.
