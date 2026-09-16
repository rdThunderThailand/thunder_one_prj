# Plan: Edit Channel Figma reshape — 2026-09-16

## Scope

Reshape the existing Edit Channel page to the supplied single- and multi-screen Figma layouts while preserving the existing update API and validation flow.

1. Replace the wizard-shaped editor content with three numbered cards: Basic Information, Display Configuration, and Player & Output Mapping.
2. Keep existing writable fields only: name, output kind, location, description, display configuration, Player, and output labels.
3. Rework the right rail into a truthful Figma-aligned preview placeholder, current status, structure, and groups; do not invent unavailable Program, playlist, or thumbnail data.
4. Keep Cancel, Save changes, Player reservation validation, lifecycle actions, and existing route behavior unchanged.

## Verification

- Targeted ESLint, TypeScript, and `git diff --check`.
- Browser verification at the reported edit route after the user selects the verification option.
