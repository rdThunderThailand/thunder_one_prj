"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/lovable/button";
import { ChevronRightIcon, DownloadIcon } from "@/components/ui/icons";
import {
  EXPORT_SUBTITLE, EXPORT_TITLE, exportFileName, exportFileNameError, exportScopeFor, readExportHandoff, type ExportOption,
} from "../../domain/asset-lifecycle-actions";
import { exportCountIssue, filteredAssetExport, selectedAssetExport } from "../../domain/asset-export";
import { useProfileRead } from "../../hooks/use-asset-profile";
import { AssetExportError, requestAssetExport } from "../../services/asset-export-client";
import { downloadBlob } from "../../services/asset-import-template";
import { getAssetsFilters, getAssetsList } from "../../services/assets-list-api";
import type { AssetListQuery } from "../../services/assets-list-query";
import { AssetsFileProgress } from "../assets-list/AssetsFileProgress";
import { AssignFlowTitle } from "../assignments/AssignFlowHeader";
import { AssignFlowWorkspace } from "../assignments/AssignFlowWorkspace";
import { changeStatusBodyClass, changeStatusFooterFrame, changeStatusFooterSurface } from "./ChangeStatusLoading";
import { readStoredHandoff } from "./export-handoff";
import { ExportFieldsCard, ExportFormatCard, ExportOptionsCard, ExportPreviewCard, ExportSelectCard } from "./ExportPanels";

const listQuery = (filters: Record<string, string>, pageSize: number) =>
  ({ page: 1, pageSize, sort: "created_at", ...filters }) as AssetListQuery;
const noSubscribe = () => () => {};
const total = (read: { result: { ok: boolean; data?: { total: number } } | null }) =>
  read.result?.ok ? read.result.data?.total ?? null : null;

export function ExportPageView({ context }: { context: string }) {
  const raw = useSyncExternalStore(noSubscribe, readStoredHandoff, () => null);
  const handoff = useMemo(() => readExportHandoff(raw), [raw]);
  const [chosen, setChosen] = useState<ExportOption | null>(null);
  const [picks, setPicks] = useState<Partial<Record<ExportOption, string>>>({});
  const [name, setName] = useState(() => exportFileName());
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<AssetExportError | null>(null);
  const controller = useRef<AbortController | null>(null);
  const back = handoff?.from ?? "/asset-workspace/assets";

  const option: ExportOption = chosen ?? (handoff?.ids ? "selected" : handoff?.filters ? "filtered" : "all");
  const options: ExportOption[] = [
    "all", ...(handoff?.filters ? ["filtered" as const] : []), ...(handoff?.ids ? ["selected" as const] : []), "category", "location", "status",
  ];
  const pick = picks[option] ?? "";
  const scope = exportScopeFor(option, handoff, pick);
  const filters = scope?.kind === "filtered" ? scope.filters : null;

  const filterOptions = useProfileRead(`${context}:export-filters`, (signal) => getAssetsFilters(context, signal));
  const all = useProfileRead(`${context}:export-all`, (signal) => getAssetsList(context, listQuery({}, 1), signal));
  const filtered = useProfileRead(`${context}:export-filtered:${JSON.stringify(handoff?.filters ?? {})}`,
    (signal) => getAssetsList(context, listQuery(handoff?.filters ?? {}, 1), signal), Boolean(handoff?.filters));
  const preview = useProfileRead(`${context}:export-preview:${JSON.stringify(filters)}`,
    (signal) => getAssetsList(context, listQuery(filters ?? {}, 5), signal), filters !== null);

  const count = scope?.kind === "selected" ? scope.ids.length : filters && !preview.pending ? total(preview) : null;
  const issue = count === null ? null : exportCountIssue(count);
  const nameError = exportFileNameError(name);
  const blocked = [401, 403].includes(error?.status ?? 0);
  const canExport = Boolean(scope) && count !== null && !issue && !nameError && !sending && !blocked;
  const previewState = scope?.kind === "selected" ? "selection" : !scope ? "pick"
    : preview.pending || !preview.result ? "loading" : preview.result.ok ? "ready" : "error";

  useEffect(() => () => controller.current?.abort(), []);

  async function exportFile() {
    if (!canExport || !scope || count === null) return;
    const request = scope.kind === "selected" ? selectedAssetExport(scope.ids).request : filteredAssetExport(listQuery(scope.filters, 1), count).request;
    const abort = new AbortController();
    controller.current = abort;
    setSending(true);
    setError(null);
    try {
      const file = await requestAssetExport(context, request, abort.signal);
      const filename = `${name.trim()}.csv`;
      downloadBlob(file.blob, filename);
      toast.success(`Export ready: ${filename}`);
    } catch (failure) {
      if (abort.signal.aborted) return;
      setError(failure instanceof AssetExportError ? failure : new AssetExportError("The file could not be downloaded. Try again.", 0, "DOWNLOAD_FAILED"));
    } finally {
      if (controller.current === abort) { controller.current = null; setSending(false); }
    }
  }

  function cancel() {
    controller.current?.abort();
    controller.current = null;
    setSending(false);
  }

  return (
    <AssignFlowWorkspace>
      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Link className="hover:underline" href="/asset-workspace/assets">Assets</Link>
        <ChevronRightIcon aria-hidden="true" className="size-3 shrink-0" />
        <span aria-current="page" className="font-semibold text-foreground">{EXPORT_TITLE}</span>
      </nav>
      <div data-assign-body className={changeStatusBodyClass}>
        <div className="min-w-0 space-y-3">
          <div className="rounded-card border border-border bg-card p-4">
            <AssignFlowTitle origin={{ href: back, label: "Back" }} title={EXPORT_TITLE} subtitle={EXPORT_SUBTITLE} />
          </div>
          <div className="grid min-w-0 items-start gap-3 @min-4xl/assign-flow:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <div aria-busy={sending} className="min-w-0 space-y-3">
              <ExportSelectCard
                option={option}
                options={options}
                counts={{ all: total(all), filtered: total(filtered), selected: handoff?.ids?.length }}
                onOption={(value) => { setChosen(value); setError(null); }}
                pick={pick}
                onPick={(value) => setPicks((previous) => ({ ...previous, [option]: value }))}
                filters={filterOptions.result?.ok ? filterOptions.result.data : null}
                disabled={sending}
              />
              <ExportFormatCard />
              <ExportFieldsCard />
            </div>
            <div className="min-w-0 space-y-3">
              <ExportPreviewCard
                rows={preview.result?.ok ? preview.result.data.rows : []}
                total={count}
                state={previewState}
                onRetry={preview.reload}
              />
              <ExportOptionsCard name={name} onName={setName} error={nameError} disabled={sending} />
            </div>
          </div>
        </div>
      </div>
      <footer className={changeStatusFooterFrame}>
        <div className="space-y-2">
          {(issue || error) && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-error/20 bg-error-muted p-3">
              <p role="alert" className="text-xs">{error?.message ?? issue}</p>
              {error?.status === 401 && (
                <Button asChild size="sm">
                  <Link href="/login">Sign in</Link>
                </Button>
              )}
            </div>
          )}
          <div className={changeStatusFooterSurface}>
            {sending ? (
              <>
                <div className="min-w-0 flex-1">
                  <AssetsFileProgress
                    kind="assets"
                    description={`Preparing CSV for ${(count ?? 0).toLocaleString("en-GB")} assets`}
                    stage="Waiting for the asset service…"
                  />
                </div>
                <Button type="button" variant="outline" size="sm" onClick={cancel}>Cancel</Button>
              </>
            ) : (
              <>
                <Button asChild variant="outline" size="sm" className="min-w-20 max-sm:h-10">
                  <Link href={back}>Cancel</Link>
                </Button>
                <p role="status" className="ml-auto text-xs text-muted-foreground tabular-nums">
                  {count !== null && scope ? `Exporting ${count.toLocaleString("en-GB")} ${count === 1 ? "asset" : "assets"}` : ""}
                </p>
                <Button type="button" size="sm" className="min-w-28 max-sm:h-10" disabled={!canExport} onClick={() => void exportFile()}>
                  <DownloadIcon aria-hidden="true" className="size-4" />
                  {error ? "Retry export" : "Export File"}
                </Button>
              </>
            )}
          </div>
        </div>
      </footer>
    </AssignFlowWorkspace>
  );
}
