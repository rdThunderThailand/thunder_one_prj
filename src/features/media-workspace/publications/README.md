# publications

A publishable package that binds an Asset or Playlist snapshot to Channels and a Schedule — see `CONTEXT.md` at the repo root for the full definition. The UI calls it a Program; routes are `/media-workspace/program` (list), `/program/create`, `/program/[id]` (detail) and `/program/[id]/edit`, plus `/media-workspace/now-next` (ADR 0081, `docs/adr/0081-program-and-now-next-get-their-own-routes.md`). The calendar view is its own feature, `media-workspace/calendar`.

Real, backed by Thunder_Core: the list, create wizard, edit, detail, delivery progress and Now & Next flows all call the Media API. Plans live under `docs/media-workspace/publications/` and `docs/media-workspace/program/`.

- `components/` — `PublicationsListPage`, `CreatePublicationPage` (wizard: `PublicationStepper`, `BasicInfoForm`, `PrepareContentStep`, `ScheduleStep`, `ReviewStep`/`ReviewTargets`/`ReviewChecklist`), `PublicationDetailPage` with the delivery views (`DeliveryProgress`, `DeliveryStages`, `DeliveryDeviceTable`, `DeliveryDeviceDetail`), and `PublicationEditPage`. Sub-folders: `edit/` (edit rail, target/schedule/content cards and modals, `PublishChangesDialog`; `edit/schedule/` has the date-range and custom-dates pickers) and `now-next/` (`NowNextPage` and its KPI cards, Now Playing table, Up Next timeline)
- `services/` — `publications-api.ts` (list, get, save basic info/content/schedule, activate, republish, update published, cancel, duplicate, delete, retry targets, schedule-conflict check), plus the upload path (`upload-api.ts`, `tus-upload.ts`, `upload-bounds.ts`, `media-file-read.ts`)
- `store/usePublicationDraftStore.ts` — the create wizard's draft state; `hooks/` — draft creation, publish, delivery progress, leave guard, previews and Program edit
- Pure logic with `.check.mts` files beside it — schedule (`schedule*.ts`), step validation and stepper state, publish eligibility and drift, list query/display/status, Now & Next folds (`now-next*.ts`), target and playlist picker helpers
- `mock-data.ts` — leftover constants (publication types, priorities, wizard steps); `step-validation.ts` still reads `publicationTypes` from it
