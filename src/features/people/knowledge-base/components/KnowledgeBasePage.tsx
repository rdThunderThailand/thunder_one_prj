import { KnowledgeAnnouncementsCard } from "./KnowledgeAnnouncementsCard";
import { KnowledgeBaseFilterBar } from "./KnowledgeBaseFilterBar";
import { KnowledgeBaseHeader } from "./KnowledgeBaseHeader";
import { KnowledgeCategoriesRow } from "./KnowledgeCategoriesRow";
import { KnowledgeNeedHelpCard } from "./KnowledgeNeedHelpCard";
import { PopularTopicsCard } from "./PopularTopicsCard";
import { RecentArticlesList } from "./RecentArticlesList";

// HR Manager — the knowledge base (`/people/knowledge-base`). A plain
// Server Component — no selection/detail-panel state, same as people/policy.
export function KnowledgeBasePage() {
  return (
    <div className="flex flex-col gap-6">
      <KnowledgeBaseHeader />
      <KnowledgeBaseFilterBar />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <KnowledgeCategoriesRow />
          <RecentArticlesList />
        </div>
        <div className="flex flex-col gap-4">
          <PopularTopicsCard />
          <KnowledgeAnnouncementsCard />
          <KnowledgeNeedHelpCard />
        </div>
      </div>
    </div>
  );
}
