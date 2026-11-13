import { assetAssignBlock, assignBlockText } from "../../domain/assignment-assign.ts";
import { assetTransferBlock, transferBlockText } from "../../domain/assignment-transfer.ts";
import { canMoveAsset } from "../../domain/assignment-move-location.ts";
import { lifecycleMenu } from "../../domain/asset-lifecycle-actions.ts";
import type { AssetListRow } from "../../services/assets-list-types.ts";

export type SelectionAction = "assign" | "transfer" | "move-location";
type Link = { label: string; href: string };
/** Either the page that runs the action, or why this asset can't take it (with a better action when there is one). */
export type SelectionOutcome = { href: string } | { title: string; body: string; alternative: Link | null };

const LABELS = { assign: "assign", transfer: "transfer", "move-location": "move" } as const;
export const singleOnlyHint = (action: SelectionAction | "status") =>
  `Select only one asset to ${action === "status" ? "update its status" : LABELS[action]}`;

const base = (row: AssetListRow) => `/asset-workspace/assets/${encodeURIComponent(row.id)}`;
const asset = (row: AssetListRow) => ({ id: row.id, lifecycleStatus: row.status, condition: row.condition, custody: row.custody });

/** Same rules the profile uses; the target page checks again after it loads, so a stale row can't slip through. */
export function selectionOutcome(row: AssetListRow, action: SelectionAction): SelectionOutcome {
  const view = { label: "View asset", href: base(row) };
  if (action === "assign") {
    const block = assetAssignBlock(asset(row));
    if (!block) return { href: `${base(row)}/assign` };
    const transfer = selectionOutcome(row, "transfer");
    return { ...assignBlockText(block), alternative: "href" in transfer ? { label: "Transfer instead", href: transfer.href } : view };
  }
  if (action === "transfer") {
    const block = assetTransferBlock(asset(row));
    if (!block && (row.condition === "Good" || row.condition === "Fair")) return { href: `${base(row)}/transfer` };
    if (!block) {
      return { title: "This asset can't be transferred", alternative: view,
        body: "The asset condition could not be verified. View the asset before transferring." };
    }
    const alternative = block === "condition_blocks_transfer" ? { label: "Return instead", href: `${base(row)}/return` }
      : block === "no_custody" && !assetAssignBlock(asset(row)) ? { label: "Assign instead", href: `${base(row)}/assign` } : view;
    return { ...transferBlockText(block), alternative };
  }
  if (canMoveAsset({ lifecycleStatus: row.status, location: null })) return { href: `${base(row)}?tab=location&action=move-location` };
  return { title: "This asset can't be moved", body: "Only Available, Assigned or In Maintenance assets can be moved.", alternative: view };
}

/** Update Status menu: the profile's lifecycle menu, linked to the profile's action pages. */
export function statusMenu(row: AssetListRow) {
  // lifecycleMenu only reads whether there is a custodian, so the list's slimmer custody is enough.
  const custody = row.custody && { ...row.custody, since: null, avatarUrl: null, department: null, note: null };
  return lifecycleMenu({ lifecycleStatus: row.status, custody })
    .map((item) => ({ ...item, href: `${base(row)}/${item.action}` }));
}
