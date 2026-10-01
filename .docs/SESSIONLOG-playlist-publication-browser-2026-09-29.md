# Session Log — Playlist Publication Browser Verification — 2026-09-29

## Browser verification

Authenticated local ThunderOne (`localhost:3000`, `Aurora Test A`) on `codex/playlist-publication-full-preview`:

- Saved Playlist Publication `5b1ffb72-3b7c-4f15-8e52-badd2dc60ebd` showed **Open full preview** on its detail page. The preview route loaded the image for `VENDI SUWAN Monitor 1L` and a 20-second timeline, without the prior content-load error.
- Saved Composition Publication `0de3eada-0f55-4abe-8941-66010d28c994` retained the link and rendered its four Zones, images and 30-second timeline.
- Repeated both preview routes against the local production build on port 3004. Keyboard activation of Play moved the Playlist timeline from 0 to 5 seconds and the Composition timeline from 0 to 6 seconds; Pause stopped both. The temporary server was stopped afterward.
- No save, publish, activation, database mutation, commit, push or deploy was performed.

## Limit

The browser's mouse-click automation did not visibly activate Play, while keyboard activation did. Production has not been deployed or retested.
