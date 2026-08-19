import { PageHeader } from "@/components/layout/PageHeader";
import { TeamPage } from "@/features/ai-departments";

// Department Manager — "My Team".
export default function TeamRoute() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="My Team" subtitle="Your department's team and their assigned assets." />
      <TeamPage />
    </div>
  );
}
