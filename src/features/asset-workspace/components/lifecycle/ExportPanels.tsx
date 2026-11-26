"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/lovable/button";
import { Input } from "@/components/ui/lovable/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";
import { CheckCircleIcon, EyeIcon, FileTextIcon, ListIcon, SettingsIcon } from "@/components/ui/icons";
import { EXPORT_NAME_MAX, type ExportOption } from "../../domain/asset-lifecycle-actions";
import { EXPORT_COLUMNS } from "../../domain/asset-export";
import { ASSET_STATUSES } from "../../domain/asset-status";
import type { AssetFilterOptions, AssetListRow } from "../../services/assets-list-types";
import { LifecycleStatus } from "./LifecycleSummary";

const OPTION_LABELS: Record<ExportOption, string> = {
  all: "All assets", filtered: "Current filtered list", selected: "Selected assets",
  category: "By category", location: "By location", status: "By status",
};

function SectionHeader({ icon: Icon, title, body, extra }: { icon: typeof FileTextIcon; title: string; body: string; extra?: ReactNode }) {
  return (
    <header className="space-y-0.5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon aria-hidden="true" className="size-4 shrink-0 text-accent-foreground" />
        {title}
        {extra}
      </h2>
      <p className="pl-6 text-xs text-muted-foreground">{body}</p>
    </header>
  );
}

const count = (value: number | null | undefined) => (typeof value === "number" ? ` (${value.toLocaleString("en-GB")})` : "");

export function ExportSelectCard({ option, options, counts, onOption, pick, onPick, filters, disabled }: {
  option: ExportOption; options: ExportOption[]; counts: Partial<Record<ExportOption, number | null>>;
  onOption: (option: ExportOption) => void; pick: string; onPick: (value: string) => void;
  filters: AssetFilterOptions | null; disabled: boolean;
}) {
  const choices = option === "category" ? filters?.categories ?? []
    : option === "location" ? filters?.locations ?? [] : ASSET_STATUSES.map((status) => ({ id: status, name: status }));
  const by = option === "category" || option === "location" || option === "status";
  return (
    <Card className="space-y-4 p-4">
      <SectionHeader icon={ListIcon} title="1. Select Assets" body="Choose which assets to export." />
      <fieldset disabled={disabled} className="space-y-3">
        <legend className="sr-only">Assets to export</legend>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
          {options.map((value) => (
            <label key={value} className="flex min-h-6 cursor-pointer items-center gap-2 text-foreground">
              <input
                type="radio"
                name="export-scope"
                value={value}
                checked={option === value}
                onChange={() => onOption(value)}
                className="size-4 accent-primary"
              />
              {OPTION_LABELS[value]}
              <span className="tabular-nums text-muted-foreground">{count(counts[value])}</span>
            </label>
          ))}
        </div>
        {by && (
          <div className="max-w-sm space-y-1.5 text-xs">
            <label id="export-pick-label" className="font-medium text-foreground">{OPTION_LABELS[option].replace("By ", "Choose a ")}</label>
            <Select value={pick} onValueChange={onPick}>
              <SelectTrigger aria-labelledby="export-pick-label" className="h-10 text-xs">
                <SelectValue placeholder={filters || option === "status" ? "Select…" : "Loading…"} />
              </SelectTrigger>
              <SelectContent>
                {choices.map((choice) => (
                  <SelectItem key={choice.id} value={choice.id}>{choice.name || `Unnamed (${choice.id})`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {option === "category" && <p className="text-2xs text-muted-foreground">Includes sub-categories.</p>}
          </div>
        )}
      </fieldset>
    </Card>
  );
}

export function ExportFormatCard() {
  return (
    <Card className="space-y-4 p-4">
      <SectionHeader icon={FileTextIcon} title="2. Choose Format" body="Select file format and file options." />
      <div className="flex max-w-60 items-start gap-3 rounded-control border border-primary bg-accent/40 p-3">
        <FileTextIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">CSV</p>
          <p className="text-xs text-muted-foreground">CSV (UTF-8)</p>
        </div>
        <CheckCircleIcon aria-label="Selected" className="size-4 shrink-0 text-primary" />
      </div>
    </Card>
  );
}

export function ExportFieldsCard() {
  return (
    <Card className="space-y-4 p-4">
      <SectionHeader icon={ListIcon} title="3. Fields" body={`Included columns (${EXPORT_COLUMNS.length}). Every export uses this standard set.`} />
      <ul className="grid gap-x-4 gap-y-2 pl-6 text-xs text-foreground sm:grid-cols-2 lg:grid-cols-3">
        {EXPORT_COLUMNS.map((column) => (
          <li key={column} className="flex items-center gap-2">
            <CheckCircleIcon aria-hidden="true" className="size-3.5 shrink-0 text-primary" />
            {column}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function ExportPreviewCard({ rows, total, state, onRetry }: {
  rows: AssetListRow[]; total: number | null; state: "ready" | "loading" | "error" | "selection" | "pick"; onRetry: () => void;
}) {
  return (
    <Card className="space-y-3 p-4">
      <SectionHeader
        icon={EyeIcon}
        title="Export Preview"
        extra={<span className="font-normal text-muted-foreground">(First 5 rows)</span>}
        body="This is a preview of the data that will be exported."
      />
      {state === "ready" && rows.length ? (
        <div className="overflow-x-auto rounded-control border border-border">
          <table className="w-full min-w-80 table-fixed text-left text-xs">
            <colgroup>
              <col className="w-[20%]" />
              <col className="w-[21%]" />
              <col className="w-[17%]" />
              <col className="w-[25%]" />
              <col className="w-[17%]" />
            </colgroup>
            <thead className="bg-muted/60 text-muted-foreground">
              <tr>
                {["Asset Tag", "Asset Name", "Category", "Status", "Location"].map((head) => (
                  <th key={head} scope="col" className="truncate px-2 py-2 font-medium">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="truncate px-2 py-2" title={row.asset_code}>{row.asset_code}</td>
                  <td className="truncate px-2 py-2 font-medium text-foreground" title={row.name}>{row.name}</td>
                  <td className="truncate px-2 py-2" title={row.category_name ?? undefined}>{row.category_name || "—"}</td>
                  <td className="overflow-hidden px-2 py-2 whitespace-nowrap"><LifecycleStatus value={row.status} /></td>
                  <td className="truncate px-2 py-2" title={row.location_name ?? undefined}>{row.location_name || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-control border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          {state === "loading" && <p role="status">Loading preview…</p>}
          {state === "ready" && <p>No assets match this choice.</p>}
          {state === "selection" && <p>Preview is not available for a selection.</p>}
          {state === "pick" && <p>Choose a value above to preview the assets.</p>}
          {state === "error" && (
            <>
              <p role="alert">The preview could not be loaded.</p>
              <Button type="button" variant="outline" size="sm" onClick={onRetry}>Retry</Button>
            </>
          )}
        </div>
      )}
      <div className="flex flex-wrap justify-between gap-2 text-2xs text-muted-foreground">
        <span className="tabular-nums">
          {state === "ready" && total !== null ? `Showing ${rows.length} of ${total.toLocaleString("en-GB")} assets` : ""}
        </span>
        <span>Preview is limited to 5 rows</span>
      </div>
    </Card>
  );
}

export function ExportOptionsCard({ name, onName, error, disabled }: {
  name: string; onName: (name: string) => void; error: string | null; disabled: boolean;
}) {
  return (
    <Card className="space-y-3 p-4">
      <SectionHeader icon={SettingsIcon} title="Export Options" body="Name the file before exporting." />
      <div className="space-y-1.5 text-xs">
        <label htmlFor="export-file-name" className="font-medium text-foreground">
          File Name <span aria-hidden="true" className="text-error">*</span>
        </label>
        <div className="flex">
          <Input
            id="export-file-name"
            value={name}
            maxLength={EXPORT_NAME_MAX + 20}
            disabled={disabled}
            required
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "export-file-name-error" : undefined}
            onChange={(event) => onName(event.target.value)}
            className="rounded-r-none"
          />
          <span className="flex items-center rounded-r-control border border-l-0 border-input bg-muted px-3 text-muted-foreground">.csv</span>
        </div>
        {error && <p id="export-file-name-error" className="text-error">{error}</p>}
      </div>
    </Card>
  );
}
