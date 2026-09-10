// Which visual state a wizard step is in, given where the operator is now
// (`currentStep`) and the furthest step they have ever reached (`furthestStep`,
// bumped in the draft store's `goNext`). A step at or below `furthestStep` stays
// reachable even after the operator jumps back, so step 3 is still clickable
// while they are editing step 2.

export type StepState = "active" | "complete" | "reachable" | "upcoming";

export function getStepState(args: {
  step: number;
  currentStep: number;
  furthestStep: number;
}): StepState {
  const { step, currentStep, furthestStep } = args;
  if (step === currentStep) return "active";
  if (step < furthestStep) return "complete";
  if (step <= furthestStep) return "reachable";
  return "upcoming";
}

/** A non-active step the operator may click to jump to. */
export function isStepSelectable(state: StepState): boolean {
  return state === "complete" || state === "reachable";
}
