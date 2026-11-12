import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRightIcon, DownloadIcon, FileTextIcon, InfoIcon, WarrantyIcon } from "@/components/ui/icons";
import type { RetireFlow } from "../../hooks/use-retire-flow";
import type { AssetDetail } from "../../services/asset-profile-contract";
import { LifecycleAssetCard, LifecycleNotice, LifecycleStatus } from "./LifecycleSummary";

const nextActionClass =
  "flex w-full items-center gap-3 rounded-control border border-border bg-card p-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring";

function NextAction({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <>
      <span className="shrink-0 text-accent-foreground">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-foreground">{title}</span>
        <span className="block text-2xs text-muted-foreground">{body}</span>
      </span>
      <ChevronRightIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
    </>
  );
}

export function RetireSummary({ asset, flow, href, onExport }: {
  asset: AssetDetail; flow: RetireFlow; href: string; onExport: (trigger: HTMLButtonElement) => void;
}) {
  const { saved } = flow;
  if (saved) {
    return (
      <aside aria-label="Asset Summary" className="min-w-0 space-y-3">
        <LifecycleAssetCard
          asset={asset}
          photo={flow.photo}
          files={flow.files}
          statusRows={[
            ["Previous Status", <LifecycleStatus key="before" value={saved.before.lifecycleStatus} />],
            ["Current Status", <LifecycleStatus key="after" value={asset.lifecycleStatus} />],
          ]}
        />
        <section className="space-y-2 rounded-card border border-primary/15 bg-accent/60 p-3.5">
          <h3 className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <InfoIcon aria-hidden="true" className="size-4 shrink-0 text-accent-foreground" />
            What can you do next?
          </h3>
          <p className="text-2xs text-muted-foreground">You can take the following actions:</p>
          <Link href={href} className={nextActionClass}>
            <NextAction
              icon={<FileTextIcon aria-hidden="true" className="size-4" />}
              title="View Asset Profile"
              body="See full asset details, history and records."
            />
          </Link>
          <Link href="/asset-workspace/lifecycle-warranty" className={nextActionClass}>
            <NextAction
              icon={<WarrantyIcon aria-hidden="true" className="size-4" />}
              title="Go to Lifecycle & Warranty"
              body="Check warranty and lifecycle information."
            />
          </Link>
          <button type="button" className={nextActionClass} onClick={(event) => onExport(event.currentTarget)}>
            <NextAction
              icon={<DownloadIcon aria-hidden="true" className="size-4" />}
              title="Export Asset Record"
              body="Download asset details as CSV."
            />
          </button>
        </section>
      </aside>
    );
  }
  const outcomes = [
    "The asset will be marked as Retired.",
    ...(asset.custody ? ["The current custodian must return the asset first."] : []),
    "The asset will no longer be available for assignment.",
    "You can dispose the asset after it is retired.",
    "A record will be created in Status History and Audit Log.",
  ];
  const notes = [
    "You cannot retire an asset that is currently assigned.",
    "Return the asset from the current custodian first.",
    "Retire / Dispose are recorded in Audit Log.",
    "Follow company data handling and security policy.",
    ...(flow.step === 1 ? ["This action can only be performed by authorized users."] : []),
  ];
  return (
    <aside aria-label="Asset Summary" className="min-w-0 space-y-3">
      <LifecycleAssetCard asset={asset} photo={flow.photo} files={flow.files} />
      <LifecycleNotice title="What happens next?" lines={outcomes} numbered />
      <LifecycleNotice title="Important Notes" lines={notes} kind="notes" />
    </aside>
  );
}
