import type { ChannelListItem } from "../../../channels/types";

const SHOWN = 6;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

// ponytail: Channels have no picture in the data model, so frame 03's thumbnails are initials — swap in an image here once one exists.
export function ChannelAvatars({ channels }: { channels: readonly ChannelListItem[] }) {
  if (channels.length === 0) return null;
  const rest = channels.length - SHOWN;

  return (
    <ul
      aria-label="Target channels"
      className="mt-3 flex flex-wrap gap-1.5"
    >
      {channels.slice(0, SHOWN).map((channel) => (
        <li
          key={channel.id}
          title={channel.name}
          className="flex h-9 w-12 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary"
        >
          {initials(channel.name) || "?"}
        </li>
      ))}
      {rest > 0 && (
        <li className="flex h-9 w-12 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground">
          +{rest}
        </li>
      )}
    </ul>
  );
}
