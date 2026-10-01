# Edit Channel Figma reshape — 2026-09-16

- Replaced the wizard-shaped editor view with numbered Basic Information, Display Configuration, and Player & Output Mapping cards.
- Moved Save and Cancel to the end of the form and added the Figma-style layout badge in the page header.
- Reworked the right rail with a truthful preview placeholder, current status, existing screen structure, groups, and lifecycle controls. No unavailable Program, playlist, or thumbnail data was fabricated.
- Static verification: `pnpm exec eslint src/features/media-workspace/channels/components/ChannelEditorPage.tsx src/features/media-workspace/channels/components/ChannelEditorForm.tsx src/features/media-workspace/channels/components/EditChannelSidebar.tsx`, `pnpm exec tsc --noEmit`, and `git diff --check` pass. Browser verification is pending.
