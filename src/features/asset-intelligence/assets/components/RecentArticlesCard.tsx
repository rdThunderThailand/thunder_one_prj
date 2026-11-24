import { Card } from "@/components/ui/Card";
import { ArrowRightIcon } from "@/components/ui/icons";
import { recentArticles } from "../mock-data";

export function RecentArticlesCard() {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">บทความล่าสุด</h2>
      <ul className="flex flex-col gap-2.5">
        {recentArticles.map((article) => (
          <li key={article.id}>
            <p className="truncate text-sm text-foreground">{article.title}</p>
            <p className="text-xs text-t1-gray-400">{article.dateLabel}</p>
          </li>
        ))}
      </ul>
      <button className="mt-3 flex items-center gap-1 border-t border-border pt-3 text-xs font-medium text-primary hover:text-accent-foreground">
        ดูทั้งหมด
        <ArrowRightIcon className="h-3 w-3" />
      </button>
    </Card>
  );
}
