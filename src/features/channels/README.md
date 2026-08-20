# channels

Channel registry for business-facing publishing destinations. A Channel represents one or more equal Physical Devices that receive the same media and schedule; it is not a Device or a substitute for `/media/screens` data.

## Implemented routes

- `/channels` — Channel list, operational summary, filters, keyboard-operated Channel-name disclosures, and a detail rail.
- `/channels/create` — create editor for a physical delivery Channel.
- `/channels/[channelId]/edit` — edit editor for an existing Channel.

The current editor supports physical `dooh` and `in_store` Channels only. `online` and `social` remain deferred connector-backed endpoint categories; an existing Channel in either category renders an unsupported-category state instead of a partial editor. The UI does not offer device registration, primary/backup roles, monitoring controls, or fabricated local saves.

## Future backend contract

The typed frontend adapter expects these Thunder_Core Media API endpoints:

- `GET /media/channels?category={category}&lifecycle={lifecycle}`
- `GET /media/channels/{channelId}`
- `GET /media/channels/reference-data`
- `GET /media/screens` — Physical Device candidates only; never Channel rows.
- `POST /media/channels`
- `PATCH /media/channels/{channelId}`
- `DELETE /media/channels/{channelId}`
- `POST /media/channels/{channelId}/activate`
- `POST /media/channels/{channelId}/deactivate`

For compatibility-complete Device assignment, `GET /media/screens` must return reported
`orientation: "landscape" | "portrait" | null` and `resolution: "{width}x{height}" | null` for
each candidate. The parser accepts omitted fields during staged rollout and preserves them as
`null`, but that truthfully yields a partial/unavailable profile: orientation blocking and
resolution confirmation can run only for the dimensions the Device actually reports. Malformed
orientation or resolution values are rejected instead of being treated as unknown.

`GET /media/channels/reference-data` may expose `channel_types[].is_active`. Inactive Types remain
visible only so an existing Channel can preserve its current value; other inactive Types are not
selectable. If the current Type is absent from reference data, the editor merges the detail value
back as `Current — unavailable` rather than retaining an invisible id.

Thunder_Core must implement the Channel RPC/API contract and capability enforcement before any Channel write can succeed. Until that backend gate exists, this slice must remain read-only in practice and render its real unavailable/error state rather than claim a successful write.

## Structure

- `components/` — feature-scoped list, detail, and editor UI.
- `channel-logic.ts` — pure validation, filtering, health, and compatibility logic.
- `services/` — typed API contract and response parsing, isolated from components.
- `types/` — Channel domain types.
