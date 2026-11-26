"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { DownloadIcon, EyeIcon, FileTextIcon, ImageIcon, MoreIcon, SearchIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/lovable/dropdown-menu";
import { Input } from "@/components/ui/lovable/input";
import { Skeleton } from "@/components/ui/Skeleton";
import { filterFileRows, profileFileRows, type ProfileFileRow } from "../../domain/asset-profile-display.mts";
import { fileSize } from "../../domain/asset-profile";
import type { AssetFiles } from "../../services/asset-profile-contract";
import type { AssetReadResult } from "../../services/assets-list-types";
import { ErrorState } from "../states/ErrorState";
import { EmptyState } from "../states/states";
import { FileUploader, ProfileFilePreview } from "./ProfileFilePreview";
import { ProfileFilterSelect } from "./ProfileFilterSelect";
import { formatDay } from "./ProfileParts";

const columns = ["Name", "File Type", "Size", "Uploaded By", "Uploaded Date", "Actions"];
const widths = ["", "w-20", "w-20", "w-36", "w-28", "w-16"];
type FilesResult = { result: AssetReadResult<AssetFiles> | null; pending: boolean; reload: () => void };

function RowActions({ file, onPreview }: { file: ProfileFileRow; onPreview: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${file.filename}`}>
          <MoreIcon aria-hidden="true" className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onPreview}>
          <EyeIcon aria-hidden="true" />
          Preview
        </DropdownMenuItem>
        {file.url ? (
          <DropdownMenuItem asChild>
            <a href={file.url} target="_blank" rel="noopener noreferrer" download={file.filename}>
              <DownloadIcon aria-hidden="true" />
              Download
            </a>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem disabled>
            <DownloadIcon aria-hidden="true" />
            Download
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FilesTable({ rows, selectedId, onSelect }: {
  rows?: ProfileFileRow[]; selectedId?: string; onSelect?: (row: ProfileFileRow) => void;
}) {
  return (
    <div className="min-w-0 overflow-x-auto">
      <table className="w-full min-w-xl table-fixed text-left text-xs">
        <caption className="sr-only">Files</caption>
        <colgroup>
          {widths.map((width, index) => <col key={columns[index]} className={width} />)}
        </colgroup>
        <thead className="bg-muted text-2xs text-muted-foreground">
          <tr>
            {columns.map((heading) => (
              <th key={heading} scope="col" className="border-b border-border px-3 py-3 font-semibold">{heading}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows ? rows.map((row) => {
            const selected = row.fileId === selectedId;
            const Icon = row.type === "Image" ? ImageIcon : FileTextIcon;
            return (
              <tr key={row.fileId} tabIndex={0} aria-selected={selected} onClick={() => onSelect?.(row)}
                onKeyDown={(press) => {
                  if (press.target !== press.currentTarget || (press.key !== "Enter" && press.key !== " ")) return;
                  press.preventDefault();
                  onSelect?.(row);
                }}
                className={`outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${selected
                  ? "bg-accent [&>td:first-child]:border-l-2 [&>td:first-child]:border-primary" : "hover:bg-muted/50"}`}>
                <td className="px-3 py-3 align-top">
                  <span className="flex min-w-0 items-start gap-2">
                    <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span className="min-w-0">
                      <span className="block font-semibold wrap-anywhere text-foreground">{row.filename}</span>
                      <span className="block text-2xs text-muted-foreground">{row.linkedTo}</span>
                    </span>
                  </span>
                </td>
                <td className="px-3 py-3 align-top">{row.type}</td>
                <td className="px-3 py-3 align-top tabular-nums">{fileSize(row.sizeBytes)}</td>
                <td className="px-3 py-3 align-top">
                  <FileUploader uploader={row.uploadedBy} />
                </td>
                <td className="px-3 py-3 align-top tabular-nums">{formatDay(row.uploadedAt)}</td>
                <td className="px-3 py-2 align-top" onClick={(click) => click.stopPropagation()} onKeyDown={(press) => press.stopPropagation()}>
                  <RowActions file={row} onPreview={() => onSelect?.(row)} />
                </td>
              </tr>
            );
          }) : Array.from({ length: 5 }, (_, index) => (
            <tr key={index} aria-hidden="true">
              {columns.map((column) => (
                <td key={column} className="px-3 py-4">
                  <Skeleton className="h-5 w-full motion-reduce:animate-none" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Frame 06, read-only (owner 2026-11-12): files are added or removed on the record they belong to. */
export function ProfileFiles({ files }: { files: FilesResult }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<string | null>(null);
  const [uploader, setUploader] = useState<string | null>(null);
  // undefined: first row; null: preview closed.
  const [selectedId, setSelectedId] = useState<string | null | undefined>(undefined);
  const all = files.result?.ok ? profileFileRows(files.result.data) : null;
  const rows = all ? filterFileRows(all, { q, type, uploader }) : null;
  // A chosen file that the filters hide closes the preview instead of showing another file.
  const selected = selectedId === null ? null : selectedId === undefined ? rows?.[0] ?? null
    : rows?.find((row) => row.fileId === selectedId) ?? null;
  const types = [...new Set(all?.map((row) => row.type))].map((value) => ({ id: value, label: value }));
  const uploaders = [...new Map(all?.flatMap((row) => row.uploadedBy?.name ? [[row.uploadedBy.id, row.uploadedBy.name] as const] : []))]
    .map(([id, label]) => ({ id, label }));

  let results;
  if (!files.result || (files.pending && !all)) {
    results = (
      <div role="status" aria-label="Loading files…" className="motion-reduce:[&_*]:animate-none">
        <FilesTable />
      </div>
    );
  } else if (!files.result.ok) {
    results = <div className="p-4"><ErrorState title="Couldn't load files." body="Check your connection and retry." onRetry={files.reload} /></div>;
  } else if (!all?.length) {
    results = <div className="p-4"><EmptyState title="No files yet." body="Photos, documents and warranty documents appear here." /></div>;
  } else if (!rows?.length) {
    results = (
      <div className="p-4">
        <EmptyState title="No files match your filters." body="Change the search or filters." action={(
          <Button variant="outline" onClick={() => { setQ(""); setType(null); setUploader(null); }}>Clear filters</Button>
        )} />
      </div>
    );
  } else {
    results = <FilesTable rows={rows} selectedId={selected?.fileId} onSelect={(row) => setSelectedId(row.fileId)} />;
  }

  return (
    <div className="@container/files min-w-0">
      <div className={`grid min-w-0 items-start gap-3 ${selected ? "@3xl/files:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]" : ""}`}>
        <Card className="min-w-0 p-0 focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none" aria-busy={files.pending}>
          <div className="space-y-3 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">Files</h2>
              <p className="text-xs text-muted-foreground">Documents related to this asset.</p>
            </div>
            <div className="grid min-w-0 grid-cols-1 gap-2 @xl/files:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
              <div role="search" className="relative min-w-0">
                <label htmlFor="profile-files-search" className="sr-only">Search files</label>
                <SearchIcon aria-hidden="true" className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground" />
                <Input id="profile-files-search" type="search" maxLength={200} value={q} placeholder="Search files..."
                  className="h-10 pl-9 md:text-xs" onChange={(event) => setQ(event.target.value)} />
              </div>
              <ProfileFilterSelect label="File Type" value={type} options={types} onChange={setType} />
              <ProfileFilterSelect label="Uploaded By" value={uploader} options={uploaders} onChange={setUploader} />
            </div>
          </div>
          {results}
        </Card>
        {selected && <ProfileFilePreview file={selected} onClose={() => setSelectedId(null)} />}
      </div>
    </div>
  );
}
