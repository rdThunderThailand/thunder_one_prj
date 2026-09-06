# Ticket 15 implementation plan

1. Move the existing template management routes beneath `/media-workspace/layouts/templates` and
   redirect legacy composition URLs to the merged Layout routes.
2. Extend the current Composition list/editor as the merged Layout experience: template rail,
   content bindings, shared-geometry interruption, fork, save-as-template, and split-zone logic.
3. Keep the moved template editor in change-all mode, add focused geometry checks, then run static
   verification. Browser verification remains a separately authorised step.
