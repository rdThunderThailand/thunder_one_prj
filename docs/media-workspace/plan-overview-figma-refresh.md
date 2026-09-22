# Media Workspace Overview Figma refresh

## Scope

Align `/media-workspace` and its Media Workspace sidebar with Figma nodes `169:1880` and `193:5078` without changing its data contracts or hiding existing routes.

1. Keep the existing channel, publication, and now/next reads.
2. Recompose the dashboard as the Figma three-column desktop grid with responsive fallbacks.
3. Surface unavailable delivery telemetry honestly instead of inventing a metric.
4. Preserve existing navigation targets and disabled actions where no route exists.
5. Apply the Figma sidebar width, typography, spacing, active treatment, and collapse affordance only to Media Workspace.
6. Commit Figma-exported logo and navigation SVGs locally so the sidebar does not depend on expiring design URLs.

## Verification

Run type checking, lint the changed components, and inspect the rendered route after user approval for browser verification.
