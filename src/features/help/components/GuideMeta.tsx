import { BookMarked, BookOpenText, Lightbulb, Rocket, Wrench, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/lovable/badge";
import { cn } from "@/lib/utils";
import { CONTENT_TYPE_LABEL, LOCALE_NAME, WORKSPACE_LABEL, t } from "../copy";
import type { GuideCard } from "../repository";
import type { ContentType, Locale, WorkspaceKey } from "../types";

const ICONS: Record<ContentType, LucideIcon> = {
  "getting-started": Rocket,
  "how-to": BookOpenText,
  concept: Lightbulb,
  troubleshooting: Wrench,
  reference: BookMarked,
};

/**
 * One neutral treatment for every Content Type: they are taxonomy, not status, so none of them
 * borrows success/warning/danger colours (design system DS-04).
 */
export function ContentTypeIcon({ type, size = "md", className }: { type: ContentType; size?: "sm" | "md" | "lg"; className?: string }) {
  const Icon = ICONS[type];
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-lg bg-primary-soft text-primary",
        size === "sm" && "h-7 w-7",
        size === "md" && "h-9 w-9",
        size === "lg" && "h-11 w-11 rounded-xl",
        className,
      )}
    >
      <Icon className={size === "lg" ? "h-5 w-5" : "h-4 w-4"} strokeWidth={1.8} />
    </span>
  );
}

export function ContentTypeTag({ type }: { type: ContentType }) {
  return (
    <Badge variant="outline" className="rounded-full border-border px-2 py-0 text-2xs font-semibold text-muted-foreground">
      {CONTENT_TYPE_LABEL[type]}
    </Badge>
  );
}

export function WorkspaceTag({ workspace, locale }: { workspace: WorkspaceKey; locale: Locale }) {
  return (
    <Badge variant="outline" className="rounded-full border-border px-2 py-0 text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
      {WORKSPACE_LABEL[workspace][locale]}
    </Badge>
  );
}

/** Shown when a list item is in the other language, so a Thai title is never passed off as English (AC-010). */
export function LocaleOnlyTag({ shown, locale }: { shown: Locale; locale: Locale }) {
  return (
    <Badge variant="outline" className="rounded-full border-dashed border-border px-2 py-0 text-2xs font-semibold text-muted-foreground" lang={locale}>
      {t("onlyIn", locale, { lang: LOCALE_NAME[shown][locale] })}
    </Badge>
  );
}

export function GuideTags({ card, locale, showWorkspace = true }: { card: GuideCard; locale: Locale; showWorkspace?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {showWorkspace && card.workspaces.filter((w) => w !== "general").map((w) => <WorkspaceTag key={w} workspace={w} locale={locale} />)}
      <ContentTypeTag type={card.contentType} />
      {!card.inRequestedLocale && <LocaleOnlyTag shown={card.shownLocale} locale={locale} />}
    </div>
  );
}
