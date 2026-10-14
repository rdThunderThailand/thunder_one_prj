# Plan — Layout Program cover from the largest zone (issue #230, ADR 0092)

Core only; no FE change (the FE already paints whatever `publication_cover` returns).

1. Core branch `fix/layout-cover-largest-zone-230` off `develop`: migration
   `20261009170000_layout_cover_largest_zone.sql` (live body, zone `ORDER BY lz.width * lz.height DESC,
   lz.position, cz.id`) + rollback with the previous body.
2. Before apply (develop): pick a live Layout Program whose largest zone is not its first; record which
   cover it returns now. **R0 gate: apply on develop.**
3. After apply: `prosrc` matches the file; grants still `service_role` only; the same Program now returns
   the largest zone's cover.
4. HTTP: Now & Next / Programs list on localhost (proxy → develop) show the new cover — ask before the
   browser check.
5. **R0 gates:** apply on prod (re-check md5 `22fe42b2…` first), push, Draft PR to `develop`.

The rendered whole-Layout cover was reviewed and deferred — see ADR 0092 Considered options.
