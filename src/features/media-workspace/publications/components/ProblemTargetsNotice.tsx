"use client";

import { Button } from "@/components/ui/Button";
import { problemTargetText, type ProblemTarget } from "../problem-targets";
import { useWizardProblemTargets } from "../hooks/useWizardProblemTargets";

/**
 * ADR 0122 rule 17: a Draft can still target a Channel that was deleted or deactivated since it was
 * saved, and Publish refuses it. Names each one under its saved name with Remove. Renders nothing
 * when there are none. Modelled on `LayoutNotActiveNotice`.
 */
export function ProblemTargetsNotice({
  targets,
  onRemove,
}: {
  targets: ProblemTarget[];
  onRemove: (id: string) => void;
}) {
  if (targets.length === 0) return null;

  return (
    <div
      role="status"
      className="flex flex-col gap-2 rounded-lg bg-warning-muted px-4 py-3 text-sm text-warning"
    >
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

/** The wizard's mount: reads the loaded problem targets and removes from the draft. */
export function WizardProblemTargetsNotice() {
  const { targets, remove } = useWizardProblemTargets();
  return (
    <ProblemTargetsNotice
      targets={targets}
      onRemove={remove}
    />
  );
}
