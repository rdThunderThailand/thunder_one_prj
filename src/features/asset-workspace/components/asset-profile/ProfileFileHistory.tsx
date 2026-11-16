"use client";

import { useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ExternalLinkIcon, FileTextIcon, FolderOpenIcon, ImageIcon, XIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { fileSize } from "../../domain/asset-profile";
import { assignmentHistoryDate } from "../../domain/assignment-history";
import { useProfileRead } from "../../hooks/use-asset-profile";
import {
  FILE_HISTORY_ACTIONS, FILE_HISTORY_TYPES, getAssetFileHistory, type AssetFileHistoryRow,
} from "../../services/asset-history-tabs-api";
import { ProfileAssignmentPager } from "../assignments/ProfileAssignmentPager";
import { ProfileFilterSelect } from "./ProfileFilterSelect";
import {
  HistoryActor, HistorySearch, HistoryTabRow, HistoryTabTable, historyTabState, PanelField, useHistorySearch,
} from "./ProfileHistoryTabParts";

const columns = ["#", "Date", "Action", "File Name", "File Type", "Performed By", "Related Context", "Size"];
const widths = ["w-8", "w-24", "w-24", "", "w-16", "", "w-28", "w-16"];
const CONTEXT = { asset_photo: "Asset Photo", asset_document: "Asset Document", registration: "Registration", warranty: "Warranty" } as const;
// ADR 0098 map: Uploaded = success, Removed = error.
const ACTION = { uploaded: { label: "Uploaded", tone: "green" }, removed: { label: "Removed", tone: "red" } } as const;
const typeLabel = (type: AssetFileHistoryRow["fileType"]) => FILE_HISTORY_TYPES.find(({ id }) => id === type)?.label ?? "—";
const when = (at: string) => { const value = assignmentHistoryDate(at); return `${value.date} ${value.time}`; };

function FileName({ row }: { row: AssetFileHistoryRow }) {
  const Icon = row.fileType === "image" ? ImageIcon : FileTextIcon;
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Icon aria-hidden="true" className="size-4 shrink-0 text-primary" />
      <span title={row.fileName ?? undefined} className="min-w-0 truncate">{row.fileName || "—"}</span>
    </span>
  );
}

/** Frame 13 File History (FE 09): Uploaded / Removed only; Version, Download and Export are left out (owner). */
export function ProfileFileHistory({ context, assetId, enabled, onViewFiles, layout }: {
  context: string; assetId: string; enabled: boolean; onViewFiles: () => void;
  layout: (content: ReactNode, panel: ReactNode) => ReactNode;
}) {
  const [page, setPage] = useState(1);
  const [fileType, setFileType] = useState<string | null>(null);
  const [action, setAction] = useState<string | null>(null);
  const [actorId, setActorId] = useState<string | null>(null);
  // undefined: first row of the page; null: panel closed.
  const [selectedId, setSelectedId] = useState<string | null | undefined>(undefined);
  const search = useHistorySearch(() => goToPage(1));
  const query = { page, q: search.q, fileType, action, actorId };
  const history = useProfileRead(`${context}:${assetId}:file-history:${JSON.stringify(query)}`,
    (signal) => getAssetFileHistory(context, assetId, query, signal), enabled);

  if (!enabled) return layout(null, null);
  const result = history.result?.ok ? history.result.data : null;
  const selected = selectedId === null ? null : result?.data.find((row) => row.id === selectedId) ?? result?.data[0] ?? null;
  function goToPage(next: number) {
    setPage(next);
    setSelectedId(undefined);
  }
  function filter(set: (value: string | null) => void) {
    return (value: string | null) => { set(value); goToPage(1); };
  }

  const results = historyTabState(history, {
    loading: "Loading file history…", table: <HistoryTabTable caption="File history" columns={columns} widths={widths} minWidth="min-w-xl" />,
    noun: "file history", empty: "No file history yet.", filtered: Boolean(search.q.trim() || fileType || action || actorId),
    onClear: () => { search.clear(); setFileType(null); setAction(null); setActorId(null); goToPage(1); },
    onFirstPage: () => goToPage(1),
  }) ?? (result && (
    <div className="flex min-h-64 flex-1 flex-col justify-between">
      <HistoryTabTable caption="File history" columns={columns} widths={widths} minWidth="min-w-xl">
        {result.data.map((row, index) => (
          <HistoryTabRow key={row.id} selected={row.id === selected?.id} onSelect={() => setSelectedId(row.id)}>
            <td className="px-3 py-3 align-top tabular-nums">{(result.page - 1) * result.pageSize + index + 1}</td>
            <td className="px-3 py-3 align-top tabular-nums">{when(row.at)}</td>
            <td className="px-3 py-3 align-top">
              <Badge color={ACTION[row.action].tone} variant="pill">{ACTION[row.action].label}</Badge>
            </td>
            <td className="px-3 py-3 align-top">
              <FileName row={row} />
            </td>
            <td className="px-3 py-3 align-top">{typeLabel(row.fileType)}</td>
            <td className="px-3 py-3 align-top">
              <HistoryActor name={row.actorName} />
            </td>
            <td className="px-3 py-3 align-top">{CONTEXT[row.context]}</td>
            <td className="px-3 py-3 align-top tabular-nums">{row.sizeBytes === null ? "—" : fileSize(row.sizeBytes)}</td>
          </HistoryTabRow>
        ))}
      </HistoryTabTable>
      <ProfileAssignmentPager page={result.page} pageSize={result.pageSize} total={result.total} totalPages={result.totalPages}
        itemLabel={result.total === 1 ? "file history record" : "file history records"} onPageChange={goToPage} />
    </div>
  ));

  const content = (
    <Card className="@container/file-history min-w-0 p-0 focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none" aria-busy={history.pending}>
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 pt-3">
        <div className="flex items-start gap-2">
          <FileTextIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <div>
            <h2 className="text-sm font-semibold">File History</h2>
            <p className="text-xs text-muted-foreground">Track file uploads and removals for this asset.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onViewFiles}>
          <FolderOpenIcon aria-hidden="true" className="size-4" />
          View Current Files
        </Button>
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-2 px-4 py-3 @md/file-history:grid-cols-2 @4xl/file-history:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))]">
        <HistorySearch id="profile-file-history-search" label="Search file history" value={search.search} onChange={search.setSearch} />
        <ProfileFilterSelect label="File Type" value={fileType} options={FILE_HISTORY_TYPES} onChange={filter(setFileType)} />
        <ProfileFilterSelect label="Action" value={action} options={FILE_HISTORY_ACTIONS} onChange={filter(setAction)} />
        <ProfileFilterSelect label="Performed By" value={actorId}
          options={(result?.actors ?? []).map(({ id, name }) => ({ id, label: name }))} onChange={filter(setActorId)} />
      </div>
      {results}
    </Card>
  );
  return layout(content, selected ? (
    <FileHistoryPanel row={selected} onClose={() => setSelectedId(null)} onViewFiles={onViewFiles} />
  ) : null);
}

function FileHistoryPanel({ row, onClose, onViewFiles }: { row: AssetFileHistoryRow; onClose: () => void; onViewFiles: () => void }) {
  return (
    <Card role="complementary" aria-label="File History Detail"
      className="min-w-0 space-y-4 overscroll-contain p-4 text-xs focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <h2 className="min-w-0 truncate text-sm font-semibold">File History Detail</h2>
        <Button variant="ghost" size="icon-sm" aria-label="Close file history detail" onClick={onClose}>
          <XIcon aria-hidden="true" className="size-4" />
        </Button>
      </div>
      <div className="space-y-1">
        <p className="font-semibold">
          <FileName row={row} />
        </p>
        <p className="text-muted-foreground">{CONTEXT[row.context]}</p>
      </div>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 rounded-control bg-accent/50 p-3 [&>div]:contents [&_dt]:text-muted-foreground">
        <PanelField label="Action">
          <Badge color={ACTION[row.action].tone} variant="pill">{ACTION[row.action].label}</Badge>
        </PanelField>
        <PanelField label="Date & Time">
          <time dateTime={row.at} className="tabular-nums">{when(row.at)}</time>
        </PanelField>
        <PanelField label="Performed By">
          <HistoryActor name={row.actorName} />
        </PanelField>
        <PanelField label="Related Context">{CONTEXT[row.context]}</PanelField>
        <PanelField label="File Type">{typeLabel(row.fileType)}</PanelField>
        <PanelField label="File Size">{row.sizeBytes === null ? "—" : fileSize(row.sizeBytes)}</PanelField>
        <PanelField label="Reason">
          <span className="whitespace-pre-wrap">{row.reason || "—"}</span>
        </PanelField>
      </dl>
      {!row.url && <p className="text-muted-foreground">This file is no longer available.</p>}
      <div className="flex flex-wrap gap-2">
        {row.url && (
          <Button asChild size="sm">
            <a href={row.url} target="_blank" rel="noopener noreferrer">
              <ExternalLinkIcon aria-hidden="true" className="size-4" />
              Open File
            </a>
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onViewFiles}>
          <FolderOpenIcon aria-hidden="true" className="size-4" />
          View Current Files
        </Button>
      </div>
    </Card>
  );
}
