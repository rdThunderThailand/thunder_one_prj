"use client";

import { Button } from "@/components/ui/Button";
import type { ChannelListItem } from "../../channels/types";
import { problemTargetText, unlistedPicksText, type ProblemTarget } from "../problem-targets";
import { useWizardProblemTargets } from "../hooks/useWizardProblemTargets";

/**
 * ADR 0122 rule 17: a Draft can still target a Channel that was deleted or deactivated since it was
 * saved, and Publish refuses it. Names each one under its saved name with Remove. In the wizard, one
 * more line covers unsaved picks missing from the Channel list. Renders nothing when there are none.
 * Modelled on `LayoutNotActiveNotice`.
 */
export function ProblemTargetsNotice({
  targets,
  onRemove,
  unlistedCount = 0,
  onRemoveUnlisted,
}: {
  targets: ProblemTarget[];
  onRemove: (id: string) => void;
  unlistedCount?: number;
  onRemoveUnlisted?: () => void;
}) {
  if (targets.length === 0 && unlistedCount === 0) return null;

  return (
    <div
      role="status"
      className="flex flex-col gap-2 rounded-lg bg-warning-muted px-4 py-3 text-sm text-warning"
    >
      {unlistedCount > 0 && onRemoveUnlisted && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span>{unlistedPicksText(unlistedCount)}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={onRemoveUnlisted}
          >
            Remove
          </Button>
        </div>
      )}
      {targets.map((target) => (
        <div
          key={target.id}
          className="flex flex-wrap items-center gap-x-3 gap-y-2"
        >
          <span>{problemTargetText(target)}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRemove(target.id)}
          >
            Remove
          </Button>
        </div>
      ))}
    </div>
  );
}

/**
 * The wizard's mount: the selected Channels it cannot show, removed from the draft. `channels` is
 * null until the Channel list has loaded without error.
 */
export function WizardProblemTargetsNotice({ channels }: { channels: ChannelListItem[] | null }) {
  const { targets, unlistedIds, remove, removeUnlisted } = useWizardProblemTargets(channels);
  return (
    <ProblemTargetsNotice
      targets={targets}
      onRemove={remove}
      unlistedCount={unlistedIds.length}
      onRemoveUnlisted={removeUnlisted}
    />
  );
}
