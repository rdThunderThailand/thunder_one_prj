import { PageHeader } from "@/components/layout/PageHeader";
import { MissionControlPage } from "@/features/ai-mission-control";

export default function MissionControlRoute() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mission Control"
        subtitle="Here's what needs your attention across every asset."
      />
      <MissionControlPage />
    </div>
  );
}
