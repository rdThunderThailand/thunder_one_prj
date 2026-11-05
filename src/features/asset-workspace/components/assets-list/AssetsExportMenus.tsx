"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/lovable/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/lovable/dropdown-menu";
import { ChevronDownIcon, ClockIcon, DownloadIcon, FileTextIcon, MoreIcon, PrintIcon, SpinnerIcon } from "@/components/ui/icons";
import { useAssetsListTemplate } from "../../hooks/use-assets-list-template";
import { AssetsTemplateDownloadDialog } from "./AssetsTemplateDownloadDialog";
import { useAssetImportHistory } from "../../hooks/use-asset-import-history";
import { ImportHistoryDialog } from "../import-history/ImportHistoryDialog";

type ExportMenuProps = { disabled: boolean; onExport: (trigger: HTMLButtonElement | null) => void };
const UNAVAILABLE_ITEM = "data-[disabled]:opacity-100 data-[disabled]:text-muted-foreground";
const OTHER_ACTIONS = [
  { title: "Print / Download Labels", description: "Generate QR, barcode or Asset Tag labels", icon: PrintIcon },
];

export function AssetsMoreActionsMenu({ context, disabled, onExport }: ExportMenuProps & { context: string }) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const openingDialogRef = useRef(false);
  const template = useAssetsListTemplate(context);
  const history = useAssetImportHistory(context);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button ref={triggerRef} variant="outline" size="sm">
          More Actions
          <ChevronDownIcon className="size-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72" onCloseAutoFocus={(event) => {
        if (openingDialogRef.current) event.preventDefault();
        openingDialogRef.current = false;
      }}>
        <DropdownMenuItem disabled={disabled} className="items-start" onSelect={() => {
          openingDialogRef.current = true;
          onExport(triggerRef.current);
        }}>
          <DownloadIcon className="mt-0.5" />
          <span className="flex flex-col">
            <span className="text-xs font-medium">Export Assets</span>
            <span className="text-2xs text-muted-foreground">Export current filtered assets to CSV</span>
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={template.pending}
          aria-busy={template.pending}
          className="items-start"
          onSelect={() => {
            openingDialogRef.current = true;
            void template.download(triggerRef.current);
          }}
        >
          {template.pending ? (
            <SpinnerIcon className="mt-0.5 animate-spin motion-reduce:animate-none" />
          ) : (
            <FileTextIcon className="mt-0.5" />
          )}
          <span className="flex flex-col">
            <span className="text-xs font-medium">{template.pending ? "Preparing template…" : "Download Import Template"}</span>
            <span className="text-2xs text-muted-foreground">Get the Excel template for bulk registration</span>
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem className="items-start" onSelect={() => {
          openingDialogRef.current = true;
          history.show(triggerRef.current);
        }}>
          <ClockIcon className="mt-0.5" />
          <span className="flex flex-col">
            <span className="text-xs font-medium">Import History</span>
            <span className="text-2xs text-muted-foreground">View all bulk import transactions</span>
          </span>
        </DropdownMenuItem>
        <p className="border-t border-border px-2 py-1.5 text-2xs text-muted-foreground">Other actions are not available yet</p>
        {OTHER_ACTIONS.map(({ title, description, icon: Icon }) => (
          <DropdownMenuItem key={title} disabled className={`items-start ${UNAVAILABLE_ITEM}`}>
            <Icon className="mt-0.5" />
            <span className="flex flex-col">
              <span className="text-xs font-medium">{title}</span>
              <span className="text-2xs text-muted-foreground">{description}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
      <AssetsTemplateDownloadDialog flow={template} />
      <ImportHistoryDialog flow={history} />
    </DropdownMenu>
  );
}

export function AssetsSelectedExportMenu({ disabled, onExport }: ExportMenuProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const openingDialogRef = useRef(false);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button ref={triggerRef} variant="outline" size="icon-sm" aria-label="More selected asset actions">
          <MoreIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onCloseAutoFocus={(event) => {
        if (openingDialogRef.current) event.preventDefault();
        openingDialogRef.current = false;
      }}>
        <DropdownMenuItem disabled={disabled} onSelect={() => {
          openingDialogRef.current = true;
          onExport(triggerRef.current);
        }}>
          <DownloadIcon />
          Export Selected
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
