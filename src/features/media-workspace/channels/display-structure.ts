import type { ChannelHealth, ChannelListItem } from "./types/index.ts";

export interface StructureScreenNode {
  key: string;
  label: string;
  resolution: string;
  output: string | null;
}

export interface StructureTree {
  player: { name: string; code: string; health: ChannelHealth | null } | null;
  screens: StructureScreenNode[];
}

function screenLabel(index: number): string {
  return `Screen ${String(index).padStart(2, "0")}`;
}

/** Player node → screen nodes (ADR 0074 §3). A single-screen Channel (`display_config` null)
 *  gets one synthetic screen node from its canvas `expected_resolution`, falling back to the
 *  Player's own reported resolution when the canvas is unset. */
export function structureNodes(
  channel: Pick<ChannelListItem, "player" | "health" | "display_config" | "expected_resolution">,
): StructureTree {
  const player = channel.player
    ? { name: channel.player.name, code: channel.player.code, health: channel.health }
    : null;

  if (channel.display_config && channel.display_config.screens.length > 0) {
    return {
      player,
      screens: channel.display_config.screens.map((screen) => ({
        key: String(screen.index),
        label: screenLabel(screen.index),
        resolution: screen.resolution,
        output: screen.output,
      })),
    };
  }

  return {
    player,
    screens: [
      {
        key: "1",
        label: "Screen",
        resolution: channel.expected_resolution ?? channel.player?.resolution ?? "Not set",
        output: null,
      },
    ],
  };
}
