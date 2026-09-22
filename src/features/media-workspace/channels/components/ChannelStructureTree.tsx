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
    return <p className="text-sm text-muted-foreground">No Player assigned to this Channel.</p>;
  }

  return (
    <div className="flex flex-col items-center gap-0 rounded-xl border border-border bg-muted p-4">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-sm">
        <BoxIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="text-left">
          <p className="text-xs font-semibold text-foreground">{tree.player.name}</p>
          <p className="text-[11px] text-muted-foreground">{tree.player.code}</p>
        </div>
        <HealthBadge health={tree.player.health} />
      </div>

      <div className="h-3 w-px bg-border" aria-hidden="true" />

      <div className="flex flex-wrap justify-center gap-4">
        {tree.screens.map((screen) => (
          <div key={screen.key} className="flex flex-col items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 shadow-sm">
            <MonitorIcon className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-semibold text-foreground">{screen.label}</p>
            <p className="text-[11px] text-muted-foreground">{screen.resolution}</p>
            {screen.output && <p className="text-[11px] text-muted-foreground">{screen.output}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
