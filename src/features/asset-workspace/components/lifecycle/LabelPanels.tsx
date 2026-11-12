"use client";

import type { ComponentProps, ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/lovable/button";
import { Checkbox } from "@/components/ui/lovable/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/lovable/dialog";
import { Input } from "@/components/ui/lovable/input";
import { FileTextIcon, SearchIcon, SettingsIcon } from "@/components/ui/icons";
import { LABEL_COPIES_MAX, labelCopies } from "../../domain/asset-lifecycle-actions";
import { LABEL_FORMATS, type LabelFormat } from "../../domain/asset-labels";
import { locationTrail } from "../../domain/asset-profile";
import type { AssetLabelsFlow } from "../../hooks/use-asset-labels";
import type { AssetDetail } from "../../services/asset-profile-contract";
import { AssetLabelPreview, type LabelPreviewStatus } from "../asset-labels/AssetLabelPreview";
import { LifecycleAssetCard, LifecycleCondition, LifecycleNotice, LifecycleStatus } from "./LifecycleSummary";

const FORMAT_SHORT: Record<LabelFormat, string> = { qr: "QR Code", barcode: "Barcode", both: "QR + Barcode" };
const GUIDELINES = [
  "Use a 50 × 30 mm label sticker.",
  "Place the label on a visible and flat surface.",
  "Ensure the QR code is not damaged.",
  "You can reprint the label at any time.",
];

function CardHeader({ icon: Icon, title, body, action }: {
  icon: typeof FileTextIcon; title: string; body: string; action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-2">
      <div className="space-y-0.5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Icon aria-hidden="true" className="size-4 shrink-0 text-accent-foreground" />
          {title}
        </h2>
        <p className="pl-6 text-xs text-muted-foreground">{body}</p>
      </div>
      {action}
    </header>
  );
}

/** Frame 34 "Label Preview": the real 50 × 30 mm artwork plus an actual-size view. */
export function LabelPreviewCard({ flow, onStatus, children }: {
  flow: AssetLabelsFlow; onStatus: (status: LabelPreviewStatus) => void; children?: ReactNode;
}) {
  const label = flow.labels[0];
  return (
    <Card className="space-y-4 p-4">
      <CardHeader
        icon={FileTextIcon}
        title="Label Preview"
        body="This is how the label will look."
        action={label && (
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <SearchIcon aria-hidden="true" className="size-4" />
                Preview Actual Size
              </Button>
            </DialogTrigger>
            <DialogContent className="w-auto max-w-[calc(100vw-2rem)] rounded-card">
              <DialogHeader>
                <DialogTitle>Actual Size</DialogTitle>
                <DialogDescription>50 × 30 mm at your screen&apos;s 100% zoom.</DialogDescription>
              </DialogHeader>
              <div className="mx-auto w-[calc(50mm+1rem+2px)]">
                <AssetLabelPreview label={label} format={flow.format} fields={flow.fields} onStatus={() => {}} />
              </div>
            </DialogContent>
          </Dialog>
        )}
      />
      {label && (
        <div className="mx-auto w-full max-w-sm">
          <AssetLabelPreview label={label} format={flow.format} fields={flow.fields} onStatus={onStatus} />
        </div>
      )}
      {children}
    </Card>
  );
}

export function LabelSettingsCard({ flow, copies, onCopies, disabled }: {
  flow: AssetLabelsFlow; copies: number; onCopies: (copies: number) => void; disabled: boolean;
}) {
  const locked = "flex min-h-6 items-center gap-2 text-foreground";
  return (
    <Card className="space-y-4 p-4">
      <CardHeader icon={SettingsIcon} title="Label Settings" body="Adjust the label format and content." />
      <div className="grid gap-4 text-xs sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <fieldset disabled={disabled} className="space-y-2">
          <legend className="mb-2 font-medium text-foreground">Label Type</legend>
          <div className="grid grid-cols-3 gap-1 rounded-control bg-muted p-1">
            {LABEL_FORMATS.map((format) => (
              <label
                key={format}
                className={
                  "flex min-h-8 cursor-pointer items-center justify-center rounded-control px-2 text-center font-medium transition-colors focus-within:ring-2 focus-within:ring-ring "
                  + (flow.format === format ? "bg-card text-foreground shadow-control" : "text-muted-foreground hover:text-foreground")
                }
              >
                <input
                  type="radio"
                  name="label-page-format"
                  value={format}
                  checked={flow.format === format}
                  onChange={() => flow.setFormat(format)}
                  className="sr-only"
                />
                {FORMAT_SHORT[format]}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="space-y-2">
          <p className="font-medium text-foreground">Label Size</p>
          <p className="flex min-h-10 items-center text-foreground">50 × 30 mm</p>
        </div>
        <div className="space-y-2">
          <label htmlFor="label-copies" className="block font-medium text-foreground">Copies</label>
          <Input
            id="label-copies"
            type="number"
            inputMode="numeric"
            min={1}
            max={LABEL_COPIES_MAX}
            step={1}
            value={copies}
            disabled={disabled}
            aria-describedby="label-copies-hint"
            onChange={(event) => onCopies(labelCopies(event.target.value))}
          />
          <p id="label-copies-hint" className="text-2xs text-muted-foreground">1–{LABEL_COPIES_MAX} per asset</p>
        </div>
      </div>
      <fieldset disabled={disabled} className="space-y-2 text-xs">
        <legend className="mb-2 font-medium text-foreground">Content to Include</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className={locked}>
            <Checkbox checked={flow.format !== "barcode"} disabled aria-describedby="label-qr-hint" />
            QR Code (Asset Record)
            <span id="label-qr-hint" className="text-muted-foreground">set by Label Type</span>
          </label>
          <label className={locked}>
            <Checkbox checked disabled />
            Asset Tag
          </label>
          <label className={locked}>
            <Checkbox checked disabled />
            Asset Name
          </label>
          <label className="flex min-h-6 cursor-pointer items-center gap-2 text-foreground">
            <Checkbox checked={flow.fields.serialNumber} onCheckedChange={(checked) => flow.setField("serialNumber", checked === true)} />
            Serial Number
          </label>
        </div>
      </fieldset>
    </Card>
  );
}

export function LabelSummary({ asset, photo, files }: {
  asset: AssetDetail; photo: string | null; files: ComponentProps<typeof LifecycleAssetCard>["files"];
}) {
  return (
    <aside aria-label="Asset Summary" className="min-w-0 space-y-3">
      <LifecycleAssetCard
        asset={asset}
        photo={photo}
        files={files}
        recent={null}
        statusRows={[
          ["Location", locationTrail(asset.locationPath, asset.location) || "—"],
          ["Current Status", <LifecycleStatus key="status" value={asset.lifecycleStatus} />],
          ["Current Condition", <LifecycleCondition key="condition" value={asset.condition} />],
        ]}
      />
      <LifecycleNotice title="Label Guidelines" lines={GUIDELINES} />
    </aside>
  );
}
