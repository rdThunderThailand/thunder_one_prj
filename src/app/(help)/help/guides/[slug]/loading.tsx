import { HelpLoadingShell } from "@/features/help/components/HelpLoadingShell";
import { ArticleSkeleton } from "@/features/help/components/HelpStates";

export default function Loading() {
  return (
    <HelpLoadingShell>
      <ArticleSkeleton locale="th" />
    </HelpLoadingShell>
  );
}
