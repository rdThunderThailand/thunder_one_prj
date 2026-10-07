import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, t } from "../copy";
import { guideHref } from "../navigation";
import type { GuideCard } from "../repository";
import type { Locale } from "../types";
import { ContentTypeIcon, GuideTags } from "./GuideMeta";

/** One Guide as a list row. Used by Search, Browse, Article related lists and Home. */
export function GuideRow({
  card,
  locale,
  from,
  showUpdated = true,
  compact = false,
}: {
  card: GuideCard;
  locale: Locale;
  from?: string | null;
  showUpdated?: boolean;
  compact?: boolean;
}) {
  // Following a card that is only in the other language opens it in that language, which the
  // article then states plainly — it is never relabelled as the requested one.
  const href = guideHref(card.slug, { lang: card.inRequestedLocale ? locale : card.shownLocale, from });
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-start gap-3 rounded-xl border border-border bg-card transition-colors hover:border-primary/40 hover:bg-primary-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        compact ? "p-3" : "p-4",
      )}
    >
      <ContentTypeIcon type={card.contentType} size={compact ? "sm" : "md"} />
      <div className="min-w-0 flex-1">
        <GuideTags card={card} locale={locale} />
        <p className={cn("mt-1.5 font-semibold text-foreground group-hover:text-primary", compact ? "text-sm" : "text-[15px]")} lang={card.shownLocale}>
          {card.title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground" lang={card.shownLocale}>
          {card.summary}
        </p>
        {showUpdated && !compact && (
          <p className="mt-2 text-2xs text-muted-foreground">
            {t("updated", locale, { date: formatDate(card.updatedAt, locale) })}
          </p>
        )}
      </div>
      <ChevronRight aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}

export function GuideList({ cards, locale, from, compact }: { cards: GuideCard[]; locale: Locale; from?: string | null; compact?: boolean }) {
  return (
    <ul className="grid content-start gap-2">
      {cards.map((card) => (
        <li key={card.guideId}>
          <GuideRow card={card} locale={locale} from={from} compact={compact} />
        </li>
      ))}
    </ul>
  );
}
