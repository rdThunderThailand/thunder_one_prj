import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GuideBlock } from "../types";

export function headingId(index: number): string {
  return `section-${index + 1}`;
}

/** Headings of a Guide body, in order, for the "In this article" list. */
export function guideOutline(body: GuideBlock[]): { id: string; text: string }[] {
  return body.filter((b): b is Extract<GuideBlock, { type: "heading" }> => b.type === "heading").map((b, i) => ({ id: headingId(i), text: b.text }));
}

/** Renders one Guide body. Same component in the Help Center article and the drawer, so they cannot drift (AC-020). */
export function GuideBody({ body, dense = false }: { body: GuideBlock[]; dense?: boolean }) {
  // Index of each heading among headings, computed up front so ids match guideOutline().
  const headingIndexAt = body.map((_, i) => body.slice(0, i + 1).filter((b) => b.type === "heading").length - 1);
  return (
    <div className={cn("space-y-4 text-foreground", dense ? "text-[13px] leading-6" : "text-sm leading-7")}>
      {body.map((block, i) => {
        switch (block.type) {
          case "heading":
            return (
              <h2 key={i} id={headingId(headingIndexAt[i])} className={cn("scroll-mt-24 font-bold tracking-tight", dense ? "pt-1 text-sm" : "pt-2 text-lg")}>
                {block.text}
              </h2>
            );
          case "paragraph":
            return <p key={i} className="text-muted-foreground">{block.text}</p>;
          case "list":
            return (
              <ul key={i} className="space-y-1.5 pl-1">
                {block.items.map((item) => (
                  <li key={item} className="flex gap-2.5 text-muted-foreground">
                    <span aria-hidden="true" className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            );
          case "steps":
            return (
              <ol key={i} className="space-y-2">
                {block.items.map((step, n) => (
                  <li key={step.title} className="flex gap-3 rounded-xl border border-border-subtle bg-surface-subtle p-3">
                    <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-2xs font-bold text-primary-foreground">
                      {n + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold leading-6">{step.title}</p>
                      {step.text && <p className="text-muted-foreground">{step.text}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            );
          case "note": {
            const Icon = block.tone === "warning" ? AlertTriangle : Info;
            return (
              <aside
                key={i}
                className={cn(
                  "flex gap-3 rounded-xl border p-3",
                  block.tone === "warning" ? "border-warning/30 bg-warning-soft" : "border-info/20 bg-info-soft",
                )}
              >
                <Icon aria-hidden="true" className={cn("mt-1 h-4 w-4 shrink-0", block.tone === "warning" ? "text-warning" : "text-info")} />
                <div className="min-w-0">
                  {block.title && <p className="font-semibold">{block.title}</p>}
                  <p className="text-muted-foreground">{block.text}</p>
                </div>
              </aside>
            );
          }
        }
      })}
    </div>
  );
}
