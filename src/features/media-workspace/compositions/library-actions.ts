import type { CompositionLibraryItem } from "./types";

export type CompositionLibraryAction =
  | "duplicate"
  | "activate"
  | "deactivate"
  | "move"
  | "trash"
  | "restore"
  | "delete-forever";

export function actionsForComposition(
  item: Pick<CompositionLibraryItem, "status">,
  inTrash: boolean,
): CompositionLibraryAction[] {
  if (inTrash) return ["restore", "delete-forever"];
  return [
    "duplicate",
    item.status === "active" ? "deactivate" : "activate",
    "move",
    "trash",
  ];
}
