import assert from "node:assert/strict";
import { deleteRefusalMessage } from "./delete-refusal.ts";

const FALLBACK = "Could not delete this Channel. Try again.";

assert.equal(
  deleteRefusalMessage(new Error("Invalid input: remove this channel from its groups before deleting: Lobby, Cafe"), FALLBACK),
  "Remove this Channel from its groups first: Lobby, Cafe.",
);
assert.equal(
  deleteRefusalMessage(new Error("Already in use: these publications still target this channel: Summer Sale"), FALLBACK),
  "These Programs still target this Channel: Summer Sale.",
);
assert.equal(
  deleteRefusalMessage(new Error("Already in use: this channel has Program or playback history and cannot be deleted yet"), FALLBACK),
  "This Channel has Program or playback history and can't be deleted yet. Deactivate it instead.",
);
// Anything else keeps going through classifyApiError, never the raw text.
assert.equal(deleteRefusalMessage("boom", FALLBACK), FALLBACK);
assert.notEqual(deleteRefusalMessage(new Error("Invalid input: something else"), FALLBACK), "Invalid input: something else");

console.log("delete-refusal.check OK");
