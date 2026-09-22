import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { BoxIcon, MonitorIcon } from "@/components/ui/icons";
import { structureNodes } from "../display-structure";
import type { ChannelListItem } from "../types";

const HEALTH_COLOR: Record<"online" | "warning" | "offline", BadgeColor> = {
  online: "green",
  warning: "yellow",
  offline: "red",
};

function HealthBadge({ health }: { health: "online" | "warning" | "offline" | null }) {
  if (health === null) return <Badge color="zinc">No player</Badge>;
  return (
    <Badge color={HEALTH_COLOR[health]} variant="pill">
      {health[0]!.toUpperCase() + health.slice(1)}
    </Badge>
  );
}

/** D1's "Channel Structure" tree: the Player node, one line down to its Screen nodes. A
 *  single-screen Channel renders as one Player → one Screen; verified in the browser. Multi-screen
 *  rendering is covered only by `display-structure.check.mts` until ticket 08 can create one. */
export function ChannelStructureTree({
  channel,
}: {
  channel: Pick<ChannelListItem, "player" | "health" | "display_config" | "expected_resolution">;
}) {
  const tree = structureNodes(channel);

  if (!tree.player) {
    return <p className="text-sm text-zinc-400">No Player assigned to this Channel.</p>;
  }

  return (
    <div className="flex flex-col items-center gap-0 rounded-xl border border-zinc-100 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
      <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <BoxIcon className="h-4 w-4 shrink-0 text-zinc-400" />
        <div className="text-left">
          <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{tree.player.name}</p>
          <p className="text-[11px] text-zinc-400">{tree.player.code}</p>
        </div>
        <HealthBadge health={tree.player.health} />
      </div>

      <div className="h-3 w-px bg-zinc-300 dark:bg-zinc-700" aria-hidden="true" />

      <div className="flex flex-wrap justify-center gap-4">
        {tree.screens.map((screen) => (
          <div key={screen.key} className="flex flex-col items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <MonitorIcon className="h-4 w-4 text-zinc-400" />
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{screen.label}</p>
            <p className="text-[11px] text-zinc-400">{screen.resolution}</p>
            {screen.output && <p className="text-[11px] text-zinc-400">{screen.output}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
