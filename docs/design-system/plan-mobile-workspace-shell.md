# Repair mobile workspace shell

Scope approved2026-11-13: Media,People,Thunder Care and Asset mobile shell repair.
Use the existing DS rule: below768px sidebar becomes a drawer; desktop navigation stays.

Confirmed facts: current fixed224px Sidebar and intrinsic default Topbar widths cause
390px page overflow. Prior regression review contains screenshots/measurements. Asset
main/list pages remain placeholders in this worktree; do not build missing workflows.

1. Reuse canonical Dialog for modal mobile navigation with a labelled trigger, close control,
   focus containment/return and existing Sidebar content; close on navigation/desktop resize.
2. Reduce mobile header chrome while retaining search,Help,notifications and account access.
3. Check all four landing pages at390/320/768 and desktop1440; repair only residual
   responsive layout constraints that prevent those main pages fitting. Preserve domain flows.
4. Run narrow checks/type/lint and record browser evidence/session log. No backend writes or Git actions.

Status: implemented and browser-checked for the scoped main pages. See [review](review-mobile-workspace-shell-2026-11-13.md) for checks, evidence and limits.
