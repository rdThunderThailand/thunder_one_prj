# Hybrid poll-based Device communication for Phase 1

Phase 0 (§3.3) left the Device communication architecture open between server push, device pull, or hybrid. We chose **hybrid poll**: Devices poll a heartbeat/job-check endpoint on a fixed interval for online status and pending Publish Jobs, and separately pull Asset bytes via signed URL. No persistent connection (WebSocket/MQTT) in Phase 1.

**Why:** True push adds real infra complexity (stateful connections, reconnect storms) that Phase 1 doesn't need — DOOH players tolerate a few seconds of latency on job pickup. Polling also keeps the seam clean for Phase 2+ Edge Nodes (see `CONTEXT.md`), which change only where Asset bytes are fetched from, not the job control flow.

**Status:** accepted. Revisit push (MQTT/WebSocket) in Phase 2+ if "publish now" latency becomes a real operational pain point, or if device counts make polling load a concern.
