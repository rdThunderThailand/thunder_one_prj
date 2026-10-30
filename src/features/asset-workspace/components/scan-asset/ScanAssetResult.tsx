import { Button } from "@/components/ui/lovable/button";
import { AlertCircleIcon, BoxIcon, CheckCircleIcon, RefreshIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { ASSET_STATUSES, type AssetStatus } from "../../domain/asset-status";
import type { LookupResult } from "../../services/asset-lookup-contract";
import { StatusBadge } from "../StatusBadges";
import type { ScanEntry } from "./ScanAssetInput";

interface ScanAssetResultProps {
  result: LookupResult;
  code: string;
  onClose: () => void;
  onRetry: (entry: ScanEntry) => void;
}

function UnavailableNextStep({ children, reason }: { children: string; reason: string }) {
  return (
    <Button
      aria-disabled="true"
      aria-description={reason}
      title={reason}
      size="sm"
      className="cursor-not-allowed opacity-50"
    >
      {children}
    </Button>
  );
}

export function ScanAssetResult({ result, code, onClose, onRetry }: ScanAssetResultProps) {
  const found = result.kind === "found";
  const notFound = result.kind === "not_found";
  const warning = notFound || result.kind === "ambiguous";
  const Icon = found ? CheckCircleIcon : warning ? WarningTriangleIcon : AlertCircleIcon;
  const title = found ? "Asset found" : notFound ? "Asset not found" : result.kind === "ambiguous" ? "More than one match" : result.kind === "invalid" ? "Check the identifier" : result.kind === "forbidden" ? "Access denied" : result.kind === "unauthenticated" ? "Sign in required" : "Couldn't identify asset";

  return (
    <div className="space-y-4">
      <div role="status" aria-live="polite" className="space-y-2 text-center">
        <span className={`mx-auto flex size-12 items-center justify-center rounded-full ${found ? "bg-success-muted text-success" : warning ? "bg-warning-muted text-warning" : "bg-error-muted text-error"}`}>
          <Icon className="size-6" />
        </span>
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {found ? "This asset is registered in your organization." : result.message}
        </p>
      </div>
      {found ? (
        <div className="flex items-start gap-4 rounded-card border border-border bg-card p-4">
          <span
            aria-hidden="true"
            className="flex size-12 shrink-0 items-center justify-center rounded-control bg-muted text-muted-foreground"
          >
            <BoxIcon className="size-6" />
          </span>
          <dl className="min-w-0 flex-1 space-y-2 text-xs">
            {[
              ["Asset Name", result.data.asset.name],
              ["Asset Tag", result.data.asset.asset_code],
              ["Serial Number", result.data.asset.serial_number],
              ["Category", result.data.asset.category_name],
              ["Location", result.data.asset.location_name],
            ].map(([label, value]) => (
              <div key={label} className="grid grid-cols-2 gap-3">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="min-w-0 break-words font-medium text-foreground">{value || "—"}</dd>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="min-w-0 break-words">
                {ASSET_STATUSES.includes(result.data.asset.status as AssetStatus) ? (
                  <StatusBadge status={result.data.asset.status as AssetStatus} />
                ) : (
                  <span className="text-muted-foreground">{result.data.asset.status || "—"}</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      ) : (
        <dl className="space-y-2 rounded-control border border-border bg-muted/50 p-3 text-xs">
          <dt className="font-medium text-foreground">Scanned identifier</dt>
          <dd className="break-words text-muted-foreground">{code}</dd>
        </dl>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        {result.kind === "unauthenticated" ? (
          <Button asChild size="sm">
            <a href="/login">Sign in</a>
          </Button>
        ) : result.kind !== "forbidden" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRetry({ tab: found ? "camera" : "manual", code: found ? "" : code, type: result.kind === "ambiguous" ? "asset_tag" : "auto" })}
          >
            <RefreshIcon className="size-4" />
            {found ? "Scan another asset" : result.kind === "ambiguous" ? "Enter Asset Tag" : "Try again"}
          </Button>
        )}
        {found && <UnavailableNextStep reason="Asset Profile is not available in this increment.">View Asset Profile</UnavailableNextStep>}
        {notFound && <UnavailableNextStep reason="Registration and creator authorization are not available in this increment.">Register New Asset</UnavailableNextStep>}
      </div>
    </div>
  );
}
