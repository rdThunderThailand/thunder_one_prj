"use client";

// Scan Asset results (EMP-04, PO scan flow 3A / 3B). Found = the caller's asset with View Asset; everything else says
// why. No Register New Asset and no "another organization" state: employees only see Not Found (scope.md deviation).
import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import {
  AlertCircleIcon,
  ArrowRightIcon,
  BoxIcon,
  CheckCircleIcon,
  InfoIcon,
  RefreshIcon,
  WarningTriangleIcon,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { ConditionValue, StatusValue } from "../../components/asset-profile/ProfileParts";
import type { LookupData, LookupFailure, LookupType } from "../../services/asset-lookup-contract";
import { myAssetHref } from "./my-scan";

const TYPE_LABEL: Record<LookupType, string> = {
  auto: "Auto detect",
  asset_tag: "Asset Tag",
  barcode: "Barcode",
  serial_number: "Serial Number",
  qr_reference: "QR reference",
};

const FAILURE_TITLE: Record<LookupFailure["kind"], string> = {
  not_found: "Asset not found",
  ambiguous: "More than one match",
  invalid: "Check the identifier",
  unauthenticated: "Sign in required",
  forbidden: "Access denied",
  error: "Couldn't identify asset",
};

function Headline({ tone, title, body }: { tone: "success" | "warning" | "error"; title: string; body: string }) {
  const Icon = tone === "success" ? CheckCircleIcon : tone === "warning" ? WarningTriangleIcon : AlertCircleIcon;
  const color = tone === "success" ? "bg-success-muted text-success" : tone === "warning" ? "bg-warning-muted text-warning" : "bg-error-muted text-error";
  return (
    <div
      role="status"
      aria-live="polite"
      className="space-y-2 text-center"
    >
      <span className={`mx-auto flex size-14 items-center justify-center rounded-full ${color}`}>
        <Icon className="size-7" />
      </span>
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <p className="mx-auto max-w-sm text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="min-w-0 flex-1 space-y-2 text-sm">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3"
        >
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="min-w-0 wrap-anywhere font-medium text-foreground">{value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

function Actions({ children }: { children: ReactNode }) {
  return <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{children}</div>;
}

export function MyScanFound({ data, onScanAnother }: { data: LookupData; onScanAnother: () => void }) {
  const { asset } = data;
  return (
    <div className="space-y-5">
      <Headline
        tone="success"
        title="Asset found"
        body="This asset is assigned to you."
      />
      <Card className="flex items-start gap-4 p-4">
        <span
          aria-hidden="true"
          className="hidden size-14 shrink-0 items-center justify-center rounded-control bg-muted text-muted-foreground sm:flex"
        >
          <BoxIcon className="size-7" />
        </span>
        <Facts
          rows={[
            ["Asset Name", asset.name],
            ["Asset Tag", asset.asset_code],
            ["Serial Number", asset.serial_number],
            ["Category", asset.category_name],
            ["Location", asset.location_name],
            ["Status", <StatusValue
              key="status"
              status={asset.status ?? ""}
            />],
            ["Condition", <ConditionValue
              key="condition"
              condition={asset.condition}
            />],
          ]}
        />
      </Card>
      <Actions>
        <Button
          variant="outline"
          onClick={onScanAnother}
        >
          <RefreshIcon className="size-4" />
          Scan another asset
        </Button>
        <Button asChild>
          <Link href={myAssetHref(asset.id)}>
            View Asset
            <ArrowRightIcon className="size-4" />
          </Link>
        </Button>
      </Actions>
    </div>
  );
}

export function MyScanFailure({ failure, code, type, onRetry }: {
  failure: LookupFailure;
  code: string;
  type: LookupType;
  onRetry: () => void;
}) {
  const kind = failure.kind;
  return (
    <div className="space-y-5">
      <Headline
        tone={kind === "not_found" || kind === "ambiguous" ? "warning" : "error"}
        title={FAILURE_TITLE[kind]}
        body={failure.message}
      />
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold text-foreground">Scanned identifier</h3>
        <Facts
          rows={[
            ["Identifier", code],
            ["Type", TYPE_LABEL[type]],
            ["Format", kind === "invalid" ? "Invalid" : "Valid"],
          ]}
        />
      </Card>
      {kind === "not_found" && (
        <p className="flex gap-2 rounded-control bg-info-muted p-3 text-sm text-info">
          <InfoIcon
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0"
          />
          If this asset is with you, ask your asset admin to assign it to you. It will then open here and show in My Assets.
        </p>
      )}
      <Actions>
        {kind === "not_found" && (
          <Button
            asChild
            variant="outline"
          >
            <Link href="/asset-workspace/my-assets">Go to My Assets</Link>
          </Button>
        )}
        {kind === "unauthenticated" ? (
          <Button asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        ) : kind !== "forbidden" && (
          <Button onClick={onRetry}>
            <RefreshIcon className="size-4" />
            {kind === "ambiguous" ? "Enter Asset Tag" : "Try again"}
          </Button>
        )}
      </Actions>
    </div>
  );
}
