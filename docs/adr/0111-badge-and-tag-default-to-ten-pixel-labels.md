# Badge and Tag default to ten-pixel labels

Status: accepted locally · 2026-11-13
Supersedes: ADR 0109 font-size default only.

The owner confirmed OD-03 at 10px in the Badge/Tag discussion. Use the existing
`text-2xs` token for canonical Badge dot, pill and legacy tone bases. Tag and
StatusBadge inherit that default. Preserve explicit caller sizes and all status maps,
props, padding, radii and dot behavior. Button/body/heading typography is unchanged.

Keeping 12px was the previous interim choice while approval was pending. Forcing
all caller text to 10px would erase page-specific density decisions and is rejected.
This records the local scoped decision; the vendored skill and generated theme stay
unmodified. It does not resolve the upstream design system's entire typography scale.

Verification: Badge.check.mts failed on the old default and passes on text-2xs;
caller text overrides remain covered. Live Thunder Care status labels compute to10px.
See the regression review for desktop/mobile evidence and coverage limits.
