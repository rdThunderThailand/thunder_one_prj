import { FeaturedArticlesCard } from "./FeaturedArticlesCard";
import { KnowledgeBaseHeader } from "./KnowledgeBaseHeader";
import { KnowledgeCategoriesCard } from "./KnowledgeCategoriesCard";
import { KnowledgeFilterBar } from "./KnowledgeFilterBar";
import { KnowledgeQuickAccessCard } from "./KnowledgeQuickAccessCard";
import { KnowledgeStatTilesRow } from "./KnowledgeStatTilesRow";
import { PopularArticlesCard } from "./PopularArticlesCard";
import { RecentArticlesCard } from "./RecentArticlesCard";

// The Asset/IT Manager ("Asset Admin") knowledge base, matching the
// reference mockup exactly (Nie, 2026-08-26) — the last item in this
// sidebar's "ช่วยเหลือ" section to get a real page.
export function KnowledgeBasePage() {
  return (
    <div className="flex flex-col gap-6">
      <KnowledgeBaseHeader />
      <KnowledgeStatTilesRow />
      <KnowledgeFilterBar />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <KnowledgeCategoriesCard />
        <div className="lg:col-span-2">
          <FeaturedArticlesCard />
        </div>
        <div className="flex flex-col gap-4">
          <KnowledgeQuickAccessCard />
          <PopularArticlesCard />
          <RecentArticlesCard />
        </div>
      </div>
    </div>
  );
}
