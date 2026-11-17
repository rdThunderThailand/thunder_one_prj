"use client";

// Scan Asset (EMP-04, UC-011, AC-027, AC-028), after the PO scan flow: 1 scan or type, 2 identifying, 3A found /
// 3B not found. Found shows the asset with View Asset; no Register or admin profile link (persona map §2).
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  CheckCircleIcon,
  MyAssetsIcon,
  ScanIcon,
  SearchIcon,
  ShieldIcon,
  SpinnerIcon,
  TagIcon,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { ScanAssetInput, type ScanEntry } from "../../components/scan-asset/ScanAssetInput";
import {
  lookupFailure,
  lookupQuerySchema,
  type LookupData,
  type LookupFailure,
  type LookupType,
} from "../../services/asset-lookup-contract";
import { MyScanFailure, MyScanFound } from "./MyScanResult";
import { scanMyAssetAction } from "./my-scan-actions";

type Phase =
  | { name: "input" }
  | { name: "identifying"; code: string }
  | { name: "found"; data: LookupData }
  | { name: "failed"; code: string; type: LookupType; failure: LookupFailure };

const TIPS = [
  { icon: ScanIcon, title: "Scan the label", body: "Point the camera at the QR code or barcode on the asset." },
  { icon: TagIcon, title: "No label? Type it", body: "Enter the Asset Tag or serial number, e.g. AST-000001." },
  { icon: ShieldIcon, title: "Only your assets", body: "Assets assigned to you open here. Others show as not found." },
];

function Identifying({ code }: { code: string }) {
  const steps = [
    { label: "Checking identifier format", done: true },
    { label: "Searching your assets", done: false },
  ];
  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto max-w-sm space-y-5 py-4 text-center"
    >
      <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-info-muted text-info">
        <SearchIcon className="size-8 motion-safe:animate-pulse" />
      </span>
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-foreground">Identifying asset…</h2>
        <p className="text-sm wrap-anywhere text-muted-foreground">Checking “{code}”.</p>
      </div>
      <ProgressBar
        value={50}
        animated
        aria-label="Identifying asset"
      />
      <ul className="space-y-3 text-left text-sm">
        {steps.map((s) => (
          <li
            key={s.label}
            className="flex items-center gap-3"
          >
            {s.done
              ? <CheckCircleIcon className="size-5 text-success" />
              : <SpinnerIcon className="size-5 text-primary motion-safe:animate-spin" />}
            <span className={s.done ? "text-foreground" : "text-muted-foreground"}>{s.label}</span>
          </li>
        ))}
        <li className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="size-5 shrink-0 rounded-full border-2 border-border"
          />
          <span className="text-muted-foreground">Showing the result</span>
        </li>
      </ul>
    </div>
  );
}

export function MyScanView() {
  const [entry, setEntry] = useState<ScanEntry>({ tab: "camera", type: "auto", code: "" });
  const [phase, setPhase] = useState<Phase>({ name: "input" });

  async function identify(code: string, type: LookupType) {
    // Same check the server action runs; a bad format answers at once without a round trip.
    if (!lookupQuerySchema.safeParse({ code, type }).success) {
      setPhase({ name: "failed", code, type, failure: lookupFailure(400) });
      return;
    }
    setPhase({ name: "identifying", code: code.trim() });
    const result = await scanMyAssetAction(code, type);
    setPhase(result.kind === "found"
      ? { name: "found", data: result.data }
      : { name: "failed", code: code.trim(), type, failure: result });
  }

  function restart(next: ScanEntry) {
    setEntry(next);
    setPhase({ name: "input" });
  }

  function retry() {
    if (phase.name !== "failed") return;
    const ambiguous = phase.failure.kind === "ambiguous";
    restart({ tab: "manual", type: ambiguous ? "asset_tag" : "auto", code: ambiguous ? "" : phase.code });
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Scan Asset"
        subtitle="Scan a QR code or enter an identifier to open one of your assets."
      />
      <div className="grid max-w-4xl items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Card className="p-4 sm:p-6">
          {phase.name === "input" ? (
            <ScanAssetInput
              key={`${entry.tab}:${entry.type}:${entry.code}`}
              entry={entry}
              onIdentify={(code, type) => void identify(code, type)}
            />
          ) : phase.name === "identifying" ? (
            <Identifying code={phase.code} />
          ) : phase.name === "found" ? (
            <MyScanFound
              data={phase.data}
              onScanAnother={() => restart({ tab: "camera", type: "auto", code: "" })}
            />
          ) : (
            <MyScanFailure
              failure={phase.failure}
              code={phase.code}
              type={phase.type}
              onRetry={retry}
            />
          )}
        </Card>
        <aside
          aria-labelledby="scan-tips"
          className="space-y-4"
        >
          <Card className="space-y-4 p-4 sm:p-5">
            <h2
              id="scan-tips"
              className="text-sm font-semibold text-foreground"
            >
              How scanning works
            </h2>
            <ul className="space-y-4">
              {TIPS.map(({ icon: Icon, title, body }) => (
                <li
                  key={title}
                  className="flex gap-3"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-accent text-primary">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-medium text-foreground">{title}</p>
                    <p className="text-xs text-muted-foreground">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Button
              asChild
              variant="outline"
              className="w-full"
            >
              <Link href="/asset-workspace/my-assets">
                <MyAssetsIcon className="size-4" />
                View My Assets
              </Link>
            </Button>
          </Card>
        </aside>
      </div>
    </div>
  );
}
