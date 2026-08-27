import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { ArrowRightIcon, ClipboardIcon, EyeIcon, HelpIcon, MoreIcon, PlayIcon, SettingsIcon, StarIcon } from "@/components/ui/icons";
import { featuredArticles, type FeaturedArticleData } from "../mock-data";

const iconFor: Record<FeaturedArticleData["icon"], React.ReactNode> = {
  book: <ClipboardIcon className="h-4 w-4" />,
  document: <ClipboardIcon className="h-4 w-4" />,
  play: <PlayIcon className="h-4 w-4" />,
  question: <HelpIcon className="h-4 w-4" />,
  wrench: <SettingsIcon className="h-4 w-4" />,
};

export function FeaturedArticlesCard() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">บทความแนะนำ</h2>
        <button className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          ดูทั้งหมด
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>
      <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {featuredArticles.map((article) => (
          <li key={article.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${article.iconTone}`}>
              {iconFor[article.icon]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{article.title}</p>
              <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${article.tagTone}`}>
                {article.tag}
              </span>
              <div className="mt-1.5 flex items-center gap-2 text-xs text-zinc-400">
                <Avatar name={article.author} size={16} />
                {article.author}
                <span>·</span>
                {article.dateLabel}
                <span className="flex items-center gap-1">
                  <EyeIcon className="h-3 w-3" />
                  {article.views}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-zinc-300">
              <button type="button" title="Not built yet" className="cursor-not-allowed hover:text-zinc-500 dark:hover:text-zinc-400">
                <StarIcon className="h-4 w-4" />
              </button>
              <button type="button" title="Not built yet" className="cursor-not-allowed hover:text-zinc-500 dark:hover:text-zinc-400">
                <MoreIcon className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <button className="mt-3 flex items-center justify-center gap-1.5 border-t border-zinc-100 pt-3 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:border-zinc-800 dark:text-indigo-400">
        ดูบทความทั้งหมด
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </button>
    </Card>
  );
}
