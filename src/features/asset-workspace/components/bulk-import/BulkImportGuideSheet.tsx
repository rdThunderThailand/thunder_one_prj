"use client";

import type { ReactNode } from "react";
import { Tag } from "@/components/ui/Tag";
import { InfoIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/lovable/sheet";
import { formatBytes, formatCount } from "../../domain/asset-import-format";
import type { ImportOptions } from "../../domain/asset-import-types";

interface Rule {
  term: string;
  body: ReactNode;
}

/** Bulk import rules from the P0 spec (11 numbered rules), with values from import options. Opens from `children`. */
export function BulkImportGuideSheet({ options, children }: { options: ImportOptions; children: ReactNode }) {
  const required = options.columns.filter((column) => column.required).map((column) => column.label);
  const separator = options.referenceMatching.locationPathSeparator;
  const needsAssignee = options.conditions.filter((condition) => !options.conditionsByStatus.Available.includes(condition));
  const limits = [
    "XLSX or CSV UTF-8",
    `Up to ${formatBytes(options.file.maxBytes)}`,
    `Up to ${formatCount(options.file.maxRows)} rows`,
  ];
  const sections: { title: string; rules: Rule[] }[] = [
    {
      title: "Your file",
      rules: [
        { term: "Template", body: "Use the template and keep its header row. Columns that are not in the template are ignored." },
        { term: "Required columns", body: `${list(required)}.` },
      ],
    },
    {
      title: "Column rules",
      rules: [
        { term: "Category", body: "Category code, or its exact Thai or English name." },
        {
          term: "Location",
          body: (
            <>
              Location code, the full path (for example <Code>{["Building A", "Floor 1", "Lobby"].join(` ${separator} `)}</Code>),
              or a name that exists only once. Unknown or repeated names stop that row.
            </>
          ),
        },
        {
          term: "Asset Tag",
          body: (
            <>
              Leave blank to generate one (<Code>{options.tagGeneration.format}</Code>). A tag you enter must not be in use already.
            </>
          ),
        },
        {
          term: "Serial Number",
          body: "Required when the category asks for it. A serial already in use is a warning: you can still register it by giving a reason at Review.",
        },
        {
          term: "Acquisition Date",
          body: (
            <>
              <Code>{options.dateFormat}</Code>, for example <Code>2026-05-12</Code>.
            </>
          ),
        },
        {
          term: "Condition",
          body: `${list(options.conditions, "or")}. Blank means ${options.defaultCondition}.${
            needsAssignee.length ? ` ${list(needsAssignee, "or")} needs an Assignee.` : ""
          }`,
        },
        {
          term: "Assignee",
          body: "A member's email, an org unit code or name, or a person's exact name. Blank means unassigned.",
        },
        {
          term: "Limits",
          body: `XLSX or CSV (save CSV as "CSV UTF-8"), up to ${formatBytes(options.file.maxBytes)} and ${formatCount(options.file.maxRows)} rows.`,
        },
      ],
    },
    {
      title: "If some rows fail",
      rules: [
        {
          term: "Error file",
          body: (
            <>
              Rows with errors are not registered. Download the Error file, fix it and upload it again.
              Keep its <Code>Import ID</Code> and <Code>Source Row</Code> columns and do not add rows to it: a row
              without a known Source Row is refused.
            </>
          ),
        },
      ],
    },
  ];
  // Numbering continues across sections (1–11).
  const starts = sections.map((_, index) => 1 + sections.slice(0, index).reduce((sum, section) => sum + section.rules.length, 0));

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="space-y-1 border-b border-border p-5 pr-12">
          <SheetTitle className="text-base">
            Import guide
          </SheetTitle>
          <SheetDescription className="text-xs leading-relaxed">
            Prepare your file so every row can be registered.
          </SheetDescription>
          <ul aria-label="File limits" className="flex flex-wrap gap-1.5 pt-2">
            {limits.map((limit) => (
              <li key={limit}>
                <Tag className="h-6 px-2 text-xs">
                  {limit}
                </Tag>
              </li>
            ))}
          </ul>
        </SheetHeader>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-5">
          {sections.map((section, sectionIndex) => (
            <section key={section.title} aria-labelledby={`import-guide-${section.title}`} className="space-y-2">
              <h3 id={`import-guide-${section.title}`} className="text-xs font-semibold text-muted-foreground">
                {section.title}
              </h3>
              <ol start={starts[sectionIndex]} className="space-y-3">
                {section.rules.map((rule, ruleIndex) => {
                  const number = starts[sectionIndex] + ruleIndex;
                  return (
                    <li key={rule.term} className="flex gap-3 text-xs leading-relaxed">
                      <span
                        aria-hidden="true"
                        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent font-semibold tabular-nums text-accent-foreground"
                      >
                        {number}
                      </span>
                      <p className="min-w-0 pt-0.5 text-muted-foreground">
                        <span className="font-semibold text-foreground">{rule.term}. </span>
                        {rule.body}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
          <p className="flex items-start gap-2 rounded-control bg-info-muted p-3 text-xs leading-relaxed text-info">
            <InfoIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            The template&apos;s Reference sheet lists the categories and locations you can use.
          </p>
        </div>
        <SheetFooter className="border-t border-border p-4">
          <SheetClose asChild>
            <Button variant="outline" size="sm" className="min-w-20 max-sm:h-10">
              Close
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Code({ children }: { children: ReactNode }) {
  return <code className="rounded bg-muted px-1 py-0.5 font-mono text-2xs text-foreground">{children}</code>;
}

function list(items: string[], last = "and") {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} ${last} ${items.at(-1)}`;
}
