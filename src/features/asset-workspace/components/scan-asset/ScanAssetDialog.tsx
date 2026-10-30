"use client";

import { useState, type RefObject } from "react";
import Image from "next/image";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/lovable/dialog";
import { Button } from "@/components/ui/lovable/button";
import { SearchIcon } from "@/components/ui/icons";
import { useAssetLookup } from "../../hooks/use-asset-lookup";
import { ScanAssetInput, type ScanEntry } from "./ScanAssetInput";
import { ScanAssetResult } from "./ScanAssetResult";

export function ScanAssetDialog({ onClose, triggerRef }: { onClose: () => void; triggerRef: RefObject<HTMLButtonElement | null> }) {
  const lookup = useAssetLookup();
  const [entry, setEntry] = useState<ScanEntry>({ tab: "camera", type: "auto", code: "" });

  function close() {
    lookup.reset();
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
      <DialogContent
        className="max-h-dvh gap-4 overflow-y-auto rounded-card bg-card sm:max-w-md"
        onInteractOutside={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => { event.preventDefault(); triggerRef.current?.focus(); }}
      >
        <Image
          src="/brand/thunderone-logo-horizontal-color.svg"
          width={172}
          height={48}
          alt="ThunderOne"
          className="h-6 w-auto"
        />
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle>Scan Asset</DialogTitle>
          <DialogDescription>Scan a QR code or enter an asset identifier to find the asset.</DialogDescription>
        </DialogHeader>
        {lookup.state.phase === "input" ? (
          <ScanAssetInput entry={entry} onIdentify={(code, type) => void lookup.identify(code, type)} />
        ) : lookup.state.phase === "identifying" ? (
          <div role="status" aria-live="polite" className="space-y-4 py-6 text-center">
            <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-info-muted text-info">
              <SearchIcon className="size-8 motion-safe:animate-pulse" />
            </span>
            <h3 className="text-base font-semibold text-foreground">Identifying asset…</h3>
            <p className="text-xs text-muted-foreground">Checking this identifier within your authorized organization scope.</p>
            <Button variant="outline" size="sm" onClick={() => {
              setEntry({ tab: "manual", type: "auto", code: lookup.state.phase === "identifying" ? lookup.state.code : "" });
              lookup.reset();
            }}>Cancel lookup</Button>
          </div>
        ) : (
          <ScanAssetResult
            result={lookup.state.result}
            code={lookup.state.code}
            onClose={close}
            onRetry={(nextEntry) => { setEntry(nextEntry); lookup.reset(); }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
