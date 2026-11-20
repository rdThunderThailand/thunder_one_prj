# Media Library shared rails and Tags

## Scope

- Reuse `PageHeader`, `FeatureFolderRail`, and the same `TagsRail` across Media Library, Playlists, and Layouts.
- Replace the disabled Media Library Tags control with a functional Tags rail.
- Derive tag counts and filtering from `MediaAsset.tags`, then paginate the filtered result.

## Constraint

Thunder Core currently returns Asset tags but has no Asset `tag_id` list filter or post-upload tag mutation endpoint. This change therefore provides read/filter behavior only and does not invent an unsupported write contract.

## Verification

- Run the shared tag-filtering checks and the existing Playlist regression check.
- Run ESLint, TypeScript, and `git diff --check`.
- Verify the visible Media Library interaction separately in an authenticated browser.
