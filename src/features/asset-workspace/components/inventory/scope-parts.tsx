"use client";

// Pieces Start Inventory step 2 (Define Scope) and step 3 (Review & Start) share: chart colours, the Expected Assets
// list dialog and the category bars.
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/lovable/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/lovable/dialog";
import type { ScopeInput, ScopeMode } from "../../domain/inventory";
import { previewScopeAction, type ScopePreview } from "../../services/asset-inventory-actions";
import { FormError } from "./parts";

// Chart colours for places and categories (not status colours: DS-04).
export const CHART = [
  "var(--color-t1-blue-600)",
  "var(--color-t1-blue-300)",
  "var(--color-t1-purple-500)",
  "var(--color-t1-blue-800)",
  "var(--color-t1-purple-300)",
  "var(--color-t1-blue-100)",
];
export const SHOWN = 5;
export const share = (n: number, total: number) => `${total ? Math.round((n / total) * 1000) / 10 : 0}%`;

/** The biggest `n` rows, the rest summed into one "Others" row. */
export function topRows(rows: { id: string; name: string; count: number }[], n: number) {
  if (rows.length <= n) return rows;
  const rest = rows.slice(n).reduce((sum, r) => sum + r.count, 0);
  return [...rows.slice(0, n), { id: "others", name: "Others", count: rest }];
}

/** Top categories as bars with count and share; "View All" opens the rest. */
export function CategoryBreakdown({ rows, total }: { rows: { id: string; name: string; count: number }[]; total: number }) {
  const [all, setAll] = useState(false);
  const shown = all ? rows : rows.slice(0, SHOWN);
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Breakdown by Category</h3>
        {rows.length > SHOWN && (
          <button
            type="button"
            onClick={() => setAll((v) => !v)}
            className="text-sm font-medium text-primary hover:underline"
          >
            {all ? "Show less" : "View All"}
          </button>
        )}
      </div>
      <ul className="space-y-2.5">
        {shown.map((r, i) => (
          <li
            key={r.id}
            className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.5rem_3rem] items-center gap-2 text-sm"
          >
            <span className="truncate">{r.name}</span>
            <span
              aria-hidden="true"
              className="h-2 overflow-hidden rounded-full bg-muted"
            >
              <span
                className="block h-full rounded-full"
                style={{ width: share(r.count, total), backgroundColor: CHART[i % CHART.length] }}
              />
            </span>
            <span className="text-right font-semibold tabular-nums">{r.count.toLocaleString()}</span>
            <span className="text-right tabular-nums text-muted-foreground">{share(r.count, total)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AssetsDialog({ open, onOpenChange, mode, scope, total }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: ScopeMode;
  scope: ScopeInput;
  total: number;
}) {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{ key: string; data?: ScopePreview["assets"]; error?: string } | null>(null);
  const key = JSON.stringify([mode, scope, page]);
  const current = result?.key === key ? result : null;
  const data = current?.data ?? null;
  const error = current?.error ?? null;

  useEffect(() => {
    if (!open) return;
    let live = true;
    void previewScopeAction(mode, scope, page, 20).then((res) => {
      if (live) setResult(res.ok ? { key, data: res.data.assets } : { key, error: res.message });
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key covers mode, scope and page
  }, [open, key]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setPage(1);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle>Expected Assets ({total.toLocaleString()})</DialogTitle>
          <DialogDescription>Assets that match the scope right now.</DialogDescription>
        </DialogHeader>
        <FormError message={error} />
        {!data && !error && <p className="text-sm text-muted-foreground">Loading…</p>}
        {data && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3 font-semibold">Asset</th>
                  <th className="py-2 pr-3 font-semibold">Tag</th>
                  <th className="py-2 pr-3 font-semibold">Category</th>
                  <th className="py-2 font-semibold">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.data.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2 pr-3">{a.name}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{a.assetTag}</td>
                    <td className="py-2 pr-3">{a.category?.name ?? "—"}</td>
                    <td className="py-2">{a.location?.name ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && data.totalPages > 1 && (
          <DialogFooter className="items-center gap-2 sm:justify-between sm:space-x-0">
            <span className="text-xs text-muted-foreground">Page {data.page} of {data.totalPages}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

