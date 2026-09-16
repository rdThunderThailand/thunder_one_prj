import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, BookmarkIcon, ChevronDownIcon, EyeIcon, ImageIcon, MoreIcon } from "@/components/ui/icons";
import { knowledgeArticles } from "../mock-data";

// Thumbnails are a colored icon tile, not a real photo — no image assets
// exist for this mock data.
export function RecentArticlesList() {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">ความรู้ล่าสุด</h2>
        <span
          title="Not built yet"
          className="flex cursor-not-allowed items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400"
        >
          ดูทั้งหมด
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </span>
      </div>

      <Card className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {knowledgeArticles.map((article) => (
          <div key={article.id} className="flex items-center gap-4 p-4">
            <span
              className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-lg ${article.thumbnailTone}`}
            >
              <ImageIcon className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">{article.title}</p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{article.description}</p>
              <p className="mt-1 text-xs text-zinc-400">
                {article.dateLabel} · {article.authorName}
                {article.authorRole ? ` (${article.authorRole})` : ""} ·{" "}
                <span className="inline-flex items-center gap-1">
                  <EyeIcon className="h-3 w-3" />
                  {article.viewCount}
                </span>
              </p>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${article.tagTone}`}>
              {article.tagLabel}
            </span>
            <div className="flex shrink-0 items-center gap-2 text-zinc-400">
              <button
                type="button"
                title="Not built yet"
                className="cursor-not-allowed hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <BookmarkIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                title="Not built yet"
                className="cursor-not-allowed hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <MoreIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </Card>

      <span
        title="Not built yet"
        className="mt-3 flex cursor-not-allowed items-center justify-center gap-1.5 rounded-lg border border-zinc-200 py-2 text-sm font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
      >
        โหลดเพิ่มเติม
        <ChevronDownIcon className="h-3.5 w-3.5" />
      </span>
    </div>
  );
}
