import { HelpLoadingShell } from "@/features/help/components/HelpLoadingShell";
import { ListPageSkeleton } from "@/features/help/components/HelpStates";

export default function Loading() {
  return (
    <HelpLoadingShell>
      <ListPageSkeleton locale="th" />
    </HelpLoadingShell>
  );
}
