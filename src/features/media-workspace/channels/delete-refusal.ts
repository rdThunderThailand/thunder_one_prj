import { classifyApiError } from "../../../lib/api/api-error.ts";

const GROUPS_PREFIX = "Invalid input: remove this channel from its groups before deleting: ";
const PROGRAMS_PREFIX = "Already in use: these publications still target this channel: ";
const HISTORY_MESSAGE = "Already in use: this channel has Program or playback history and cannot be deleted yet";

/**
 * `media_channel_delete` refusals (ADR 0122 rules 5-7), worded for the delete dialog. `classifyApiError`
 * would turn the `Invalid input:` one into a generic message and hide the Group names; anything
 * unrecognised still goes through it.
 */
export function deleteRefusalMessage(caught: unknown, fallback: string): string {
  const message = caught instanceof Error ? caught.message : "";
  if (message.startsWith(GROUPS_PREFIX)) {
    return `Remove this Channel from its groups first: ${message.slice(GROUPS_PREFIX.length)}.`;
  }
  if (message.startsWith(PROGRAMS_PREFIX)) {
    return `These Programs still target this Channel: ${message.slice(PROGRAMS_PREFIX.length)}.`;
  }
  if (message === HISTORY_MESSAGE) {
    return "This Channel has Program or playback history and can't be deleted yet. Deactivate it instead.";
  }
  return classifyApiError(caught, fallback).message;
}
