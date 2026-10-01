# Create Channel modal sizing — 2026-09-16

## Changed

- Expanded the Create Channel modal to the preview width.
- Allowed its Player picker dropdown to overflow the dialog instead of being clipped.
- Placed Cancel/Back at the footer's left edge and Next/Create at its right edge.

## Verification

- Passed: `git diff --check`.
- Passed: `pnpm exec eslint src/components/ui/Modal.tsx src/features/media-workspace/channels/components/create-wizard/CreateChannelModal.tsx`.
- Pending: browser verification of the expanded picker and footer at the reported desktop viewport.
