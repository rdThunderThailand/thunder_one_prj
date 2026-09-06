# 13 — Player spans all displays when configured to

**Spec:** `docs/layouts/spec-composition-content.md` ·
**Decided by:** `docs/adr/0050-wide-layouts-across-monitors.md` §5

**Repo:** `signage/Ads_Manager_WindowApp-main` — **not this branch, and not to be modified without
being asked.** This ticket exists so the decision is not lost, not so an agent picks it up.

**What to build:** a one-machine, three-monitor install reports the size of the surface it actually
paints. Today `DeviceInfoService.cs:32` reads the *window* bounds and the window is
`WindowState="Maximized"`, which on Windows fills whichever single monitor it is on — so the customer's
machine reports 1920×1080, not 5760×1080.

**Blocked by:** Nothing technically. **The real gate on the three-monitor customer is B1, the
multi-Zone renderer, which does not exist** — this ticket alone changes only a reported number.

**Status:** not-for-agent — needs the player repo and an explicit instruction

- [ ] `AppConfig` gains `SpanAllDisplays: bool = false`
- [ ] When true, the window is `WindowState = Normal` positioned at
      `SystemParameters.VirtualScreen{Left,Top,Width,Height}` instead of maximized
- [ ] `GetPhysicalBounds` then reports the spanned size with no further change; the device-profile
      endpoint already accepts it (`screen_width: z.number().int().positive()`, no upper bound)
- [ ] Default stays **off**. Production holds 504 devices that have never reported a screen size and
      four that have, every one a single-monitor install; a technician attaching a maintenance monitor
      to any of them would otherwise stretch the running signage across both
- [ ] Nobody has yet measured what a real three-monitor machine reports. Confirm the prediction (1920
      before, 5760 after) on real hardware rather than assuming it
- [ ] `AUDIT_Player_Gaps_Priority.md`'s A6 row is corrected: display-change handling is **not**
      missing — `App.xaml.cs:112` already subscribes to `SystemEvents.DisplaySettingsChanged` with a
      two-second debounce. B7 (multi-player sync) does not apply to a one-machine span
