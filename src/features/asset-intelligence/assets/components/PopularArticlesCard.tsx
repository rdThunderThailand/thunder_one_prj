import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, EyeIcon } from "@/components/ui/icons";
import { popularArticles } from "../mock-data";

export function PopularArticlesCard() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">บทความยอดนิยม</h2>
        <button className="flex items-center gap-1 text-xs font-medium text-primary hover:text-accent-foreground">
          ดูทั้งหมด
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>
      <ul className="flex flex-col gap-2.5">
        {popularArticles.map((article) => (
          <li key={article.id} className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
              {article.rank}
            </span>
            <p className="min-w-0 flex-1 truncate text-sm text-foreground">{article.title}</p>
            <span className="flex shrink-0 items-center gap-1 text-xs text-t1-gray-400">
              <EyeIcon className="h-3 w-3" />
              {article.views}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
