import type { ReactNode } from "react";
import type { ImportBatch } from "../../domain/asset-import-types";
import { CheckCircleIcon, WarningTriangleIcon, XCircleIcon, SearchIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/lovable/input";
import { TabsList, TabsTrigger } from "@/components/ui/lovable/tabs";
import { cn } from "@/lib/utils";
import { formatCount } from "../../domain/asset-import-format";

export function BulkImportRowsToolbar({ tabs, validate, result, variant, searchId, search, setSearch, toolbar }: {
  tabs: { key: string; label: string; count?: number; icon?: ReactNode }[];
  validate: boolean; result: boolean; variant: string; searchId: string; search: string;
  setSearch: (value: string) => void; toolbar?: ReactNode;
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <TabsList
        className={cn(
          "h-auto max-w-full flex-wrap justify-start gap-1 bg-muted p-1",
          // One line of tabs; scrolls sideways when the card is too narrow.
          validate && "w-full basis-full flex-nowrap overflow-x-auto",
        )}
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.key}
            value={tab.key}
            className={cn(
              "min-h-8 gap-1 whitespace-normal text-2xs sm:text-xs",
              validate && "flex-1 shrink-0 whitespace-nowrap px-2",
            )}
          >
            {tab.icon}
            {tab.label} (
            {tab.count === undefined ? "…" : formatCount(tab.count)})
          </TabsTrigger>
        ))}
      </TabsList>
      <div className="relative min-w-0 flex-1 basis-52">
        <label htmlFor={searchId} className="sr-only">
          Search import rows
        </label>
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={searchId}
          value={search}
          maxLength={100}
          onChange={(event) => setSearch(event.target.value)}
          className="h-9 pl-9 text-xs"
          placeholder={
            result
              ? "Search row, name or message…"
              : variant === "review"
                ? "Search by asset name, asset tag, serial number…"
                : "Search row, name or issue…"
          }
        />
      </div>
      {toolbar}
    </div>
  );
}

export function importRowsTabs(batch: ImportBatch | null | undefined, result: boolean) {
  const counts = batch?.counts;
  const tabs: { key: string; label: string; count?: number; icon?: ReactNode }[] = result
    ? [
        { key: "all", label: "All Rows", count: batch?.totalRows },
        { key: "created", label: "Created", count: counts?.created, icon: <CheckCircleIcon className="size-4 text-success" /> },
        { key: "created_with_warning", label: "Created with Warnings", count: counts?.createdWithWarning, icon: <WarningTriangleIcon className="size-4 text-warning" /> },
        { key: "not_registered", label: "Not Registered", count: counts?.notRegistered, icon: <XCircleIcon className="size-4 text-error" /> },
      ]
    : [
        { key: "all", label: "All", count: batch?.totalRows },
        { key: "valid", label: "Ready", count: counts?.valid, icon: <CheckCircleIcon className="size-4 text-success" /> },
        { key: "warning", label: "Warnings", count: counts?.warning, icon: <WarningTriangleIcon className="size-4 text-warning" /> },
        { key: "error", label: "Errors", count: counts?.error, icon: <XCircleIcon className="size-4 text-error" /> },
      ];

  return tabs;
}
