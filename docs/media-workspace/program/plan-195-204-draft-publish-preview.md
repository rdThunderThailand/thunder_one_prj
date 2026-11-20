# Plan: advisory draft publishing and bounded preview controls

Owner approved the independently scrutinized revision-2 plan on 2026-10-02.
Issues: #195 and #204. Implement #195 first; separate commits and Draft PRs. No Core API/schema/migration changes or hardware Player dependency.

## #195

Existing d348545 first-publish dialog wiring is already on main. Reuse that dialog and save/activate path. Conflict lookup is advisory while checking or failed; only publishing busy disables confirm. Refresh Channel/Group membership on every dialog open; direct-device targets bypass the lookup. Failed metadata rejects rather than masquerading as an empty result. Keep current form snapshot and publication exclusion. Remove the unsupported claim that activation re-checks conflicts. Cancel before confirmation does not write; preserve existing partial-save/activation failure semantics.

## #204

Use shared PreviewControls. Content width below 24rem: first row play/time/seek, second row mute/speed/options/fullscreen. Wide controls stay one row. Keep 32px buttons, flexible timeline, bounded time and full accessible text. Footer annotation cannot force width.

Owner-approved browser finding: an expanded sidebar at viewport 390 leaves a 76px frame. Below 152px of control content, permit additional action wrapping and a separate timeline row so all controls remain usable. Above this exception, retain the planned one/two-row layout.

Keep media aspect ratio and clipping. Place the same controls instance beside the media frame in a width-matched wrapper: absolute overlay when frame height fits, normal flow below otherwise. Observe frame and invariant controls body with ResizeObserver only for overlay stages. Required height is body +70px (32px top, 12px bottom, 2px border, 24px banner allowance). Reserve identical horizontal padding/border in both placements to prevent oscillation. Default below until measured; disconnect on unmount. Resize must not remount media or reset the clock. Truncate both zone name and time with accessible full text.

Use existing Lovable DropdownMenu primitives with optional portalContainer, default unchanged. Controlled menu-open state pins overlay visibility while focus is portalled; hover:none/coarse-pointer devices retain controls while playing. Track owned fullscreen context in event-handler state; exact-stage fullscreen governs sizing, owned ancestor governs popup container. Close menus on placement/context changes. Preserve speed 1/2/3, Actual size/Fit, seek, transitions and media-fit; tokens only, no dependencies.

## Verification and delivery

Browser verification preference is requested at each acceptance point. #195: overlap/no overlap, slow/failing Channel/conflict lookup, all target types, reopen, Cancel/no writes, one confirm, activation failure, existing published path. Restore browser network settings after failure tests. Real HTTP/DB evidence is separate from UI tests.

#204: viewports 1440/1024/390, frames 220/260/320/480 and content-width boundary 383/384; portrait/landscape/32:9, long metadata, resize/no oscillation, keyboard/touch/menu/fullscreen, all seven callers. The main preview belongs to ReviewStep, not its info-only rail; the current product labels Review as Step 4 and Publish as Step 5.

Run relevant existing node checks, targeted lint, TypeScript, production build and git diff --check. No new runner; static checks are not browser proof. Shared-develop fixture/activation/cleanup requires exact-ID approval; never test activation on production or modify shared Playlist/Layout. Incomplete activation remains unverified, PRs Draft. Owner Ready/merge. Reassess release diff before frontend patch v0.6.1; do not promote unrelated changes. Physical playback remains deferred until demo is online.
