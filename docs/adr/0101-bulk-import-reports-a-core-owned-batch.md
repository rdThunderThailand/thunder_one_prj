# 0101 — Bulk Import reports a batch that Core owns

Status: proposed (2026-11-05). Implements the owner-approved Bulk Import design of 2026-11-02 (ticket
84, UC-010). Contract: Notes `Assets/bulk import/`.

## Context

One file can register up to 5,000 Assets and partly succeed. Confirming takes many requests, and a
response can be lost after Core has committed. A screen that guesses what happened could report an Asset
as not created when it was.

## Decision

1. **Core's answer is the only result.** Counts, row results and files come from Core reads; the frontend
   never builds them.
2. **The batch status decides the step**, so a reload lands in the right place.
3. **A retry repeats the same request.** Lost responses are settled by reading the batch before sending
   again, so no Asset is created twice.
4. **A row's outcome is its `result`**, not its validation severity.
5. **The Error File can be Excel or CSV.** Core sends CSV; the frontend converts it to a text-only sheet so
   no value changes. Rows are fixed in that file and re-imported as a new linked batch.

## Considered options

- **An XLSX endpoint in Core.** Rejected: the installed `xlsx` package produces the same file with no
  backend change.
- **Edit a row on screen.** Rejected (design Q7): not in MVP.

## Consequences

- Browser acceptance is still to be done, and Core's normal import stayed closed when last checked on
  2026-11-04.
- Core's CSV guard adds `'` before values starting with `=`, `+`, `-` or `@`, and nothing removes it on
  re-upload.
- Clean-up of batches abandoned before confirm is not decided.
