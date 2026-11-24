/** Which Channels a page looks at (ADR 0084 §2): everything, one Channel Group, or one Channel. */
export type ChannelScope = { kind: "all" } | { kind: "group"; id: string } | { kind: "channel"; id: string };

export const ALL_CHANNELS: ChannelScope = { kind: "all" };

/** `?group=` wins over `?channel=` if both are present; an empty value counts as absent. */
export function readChannelScope(params: URLSearchParams): ChannelScope {
  const group = params.get("group");
  if (group) return { kind: "group", id: group };
  const channel = params.get("channel");
  if (channel) return { kind: "channel", id: channel };
  return ALL_CHANNELS;
}

/** Sets exactly one of `group` / `channel` (or neither for All) and leaves every other param alone. */
export function writeChannelScope(scope: ChannelScope, params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params);
  next.delete("group");
  next.delete("channel");
  if (scope.kind !== "all") next.set(scope.kind, scope.id);
  return next;
}

export function sameScope(a: ChannelScope, b: ChannelScope): boolean {
  return a.kind === b.kind && (a.kind === "all" || a.id === (b as { id: string }).id);
}
