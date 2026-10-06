import { HelpLoadingShell } from "@/features/help/components/HelpLoadingShell";
import { HomeSkeleton } from "@/features/help/components/HelpStates";

export default function Loading() {
  return (
    <HelpLoadingShell>
      <HomeSkeleton locale="th" />
    </HelpLoadingShell>
  );
}
