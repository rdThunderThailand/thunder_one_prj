import { Fragment } from "react";
import { CheckIcon } from "@/components/ui/icons";

export type StageState = "complete" | "active" | "pending";

export type DeliveryStage = {
  label: string;
  caption: string;
  state: StageState;
};

function StageNode({ state, index }: { state: StageState; index: number }) {
  if (state === "complete") {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-success text-white">
        <CheckIcon className="h-4 w-4" />
      </span>
    );
  }

  if (state === "active") {
    return (
      <span className="relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-primary bg-card">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-soft opacity-60" />
        <span className="relative h-2 w-2 rounded-full bg-primary" />
      </span>
    );
  }

  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-border bg-card text-xs font-medium text-muted-foreground">
      {index + 1}
    </span>
  );
}

/** Horizontal stepper for the three delivery stages, with the connector into the
 * working stage animated so a bar that sits still between device polls still
 * reads as "in progress". */
export function DeliveryStages({ stages }: { stages: DeliveryStage[] }) {
  return (
    <ol className="flex mt-2 items-start">
      {stages.map((stage, i) => (
        <Fragment key={stage.label}>
          {i > 0 && (
            <li
              aria-hidden
              className={`relative mt-3.5 h-0.5 flex-1 overflow-hidden rounded-full ${
                stages[i - 1].state === "complete"
                  ? "bg-success"
                  : "bg-muted"
              } ${stage.state === "active" ? "stage-flow" : ""}`}
            />
          )}
          <li
            aria-current={stage.state === "active" ? "step" : undefined}
            className="flex w-28 shrink-0 flex-col items-center gap-1.5 text-center"
          >
            <StageNode state={stage.state} index={i} />
            <span
              className={`text-xs font-medium ${
                stage.state === "pending"
                  ? "text-muted-foreground"
                  : "text-foreground"
              }`}
            >
              {stage.label}
            </span>
            <span className="text-[11px] text-muted-foreground">{stage.caption}</span>
          </li>
        </Fragment>
      ))}
    </ol>
  );
}
