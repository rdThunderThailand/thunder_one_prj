import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, EyeIcon } from "@/components/ui/icons";
import { popularArticles } from "../mock-data";

export function PopularArticlesCard() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">บทความยอดนิยม</h2>
        <button className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          ดูทั้งหมด
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>
      <ul className="flex flex-col gap-2.5">
        {popularArticles.map((article) => (
          <li key={article.id} className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {article.rank}
            </span>
            <p className="min-w-0 flex-1 truncate text-sm text-zinc-700 dark:text-zinc-200">{article.title}</p>
            <span className="flex shrink-0 items-center gap-1 text-xs text-zinc-400">
              <EyeIcon className="h-3 w-3" />
              {article.views}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
