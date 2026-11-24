# Multi-tenant SaaS, not single-tenant-per-deployment

The plan (§3.4, §13) requires "Organization-level data isolation" and "Devices cannot receive work from another organization" but never states whether Organization is a hard tenant boundary within a shared deployment, or just an internal grouping within a single customer's own instance.

We chose **true multi-tenant SaaS**: one ThunderOne deployment serves many customer Organizations, isolated by `organization_id` on every core table and enforced at the data-access layer (not just the UI).

**Why:** "Devices cannot receive work from another organization" only makes sense as a hard security boundary if unrelated Organizations coexist in the same system. Retrofitting tenant isolation into a schema built single-tenant-first would be a rewrite, not a migration — this needs to be right from Phase 0.

**Status:** accepted.
