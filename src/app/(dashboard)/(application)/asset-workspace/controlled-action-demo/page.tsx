import { ControlledActionDemo } from "@/features/asset-workspace/components/controlled-action/ControlledActionDemo";

// P1-08 demo of the controlled action dialog; flag-gated with the rest of the App (docs/adr/0097).
// Not in the nav. Removed in Phase 3.
export default function ControlledActionDemoPage() {
  return <ControlledActionDemo />;
}
