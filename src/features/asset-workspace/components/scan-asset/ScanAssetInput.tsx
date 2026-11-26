import { useState } from "react";
import { Button } from "@/components/ui/lovable/button";
import { Input } from "@/components/ui/lovable/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/lovable/tabs";
import { InfoIcon, SearchIcon } from "@/components/ui/icons";
import type { LookupType } from "../../services/asset-lookup-contract";
import { ScanAssetCamera } from "./ScanAssetCamera";

export interface ScanEntry {
  tab: "camera" | "manual";
  type: LookupType;
  code: string;
}

export function ScanAssetInput({ entry, onIdentify }: { entry: ScanEntry; onIdentify: (code: string, type: LookupType) => void }) {
  const [tab, setTab] = useState(entry.tab);
  const [code, setCode] = useState(entry.code);
  const [helpOpen, setHelpOpen] = useState(false);
  const tagOnly = entry.type === "asset_tag";

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(value) => setTab(value as ScanEntry["tab"])}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="camera">Scan QR Code</TabsTrigger>
          <TabsTrigger value="manual">Enter Code Manually</TabsTrigger>
        </TabsList>
        <TabsContent value="camera">
          {tab === "camera" && <ScanAssetCamera onDecoded={(value) => onIdentify(value, "auto")} />}
        </TabsContent>
        <TabsContent value="manual">
          <p className="py-4 text-center text-xs text-muted-foreground">Enter the identifier printed on the asset or paste its Asset Profile QR reference.</p>
        </TabsContent>
      </Tabs>
      {tab === "camera" && <p className="text-center text-xs text-muted-foreground">or</p>}
      <form
        className="space-y-2"
        onSubmit={(event) => { event.preventDefault(); onIdentify(code, entry.type); }}
      >
        <label htmlFor="scan-asset-code" className="text-xs font-medium text-foreground">
          {tagOnly ? "Asset Tag" : "Asset identifier"}
        </label>
        <div className="flex items-center gap-2">
          <Input
            id="scan-asset-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder={tagOnly ? "Enter Asset Tag" : "Enter Asset Tag, serial number or QR reference"}
            maxLength={tagOnly ? 250 : 2048}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-describedby="scan-identifier-help"
          />
          <Button type="submit" size="icon" disabled={!code.trim()} aria-label="Identify asset">
            <SearchIcon className="size-4" />
          </Button>
        </div>
        <p id="scan-identifier-help" className="text-xs text-muted-foreground">e.g. AST-000001 or SN-001</p>
      </form>
      <div className="text-xs text-muted-foreground">
        <Button
          variant="link"
          size="sm"
          className="h-auto gap-1 whitespace-normal p-0 text-left font-normal"
          aria-expanded={helpOpen}
          aria-controls="scan-supported-identifiers"
          onClick={() => setHelpOpen((open) => !open)}
        >
          <InfoIcon className="h-4 w-4" />
          What identifiers can I scan?
        </Button>
        <p id="scan-supported-identifiers" hidden={!helpOpen} className="mt-2 leading-relaxed">Scan an Asset Profile QR code or a Code128 Asset Tag. You can also type an Asset Tag, serial number or legacy barcode. Identification uses your current organization and permissions.</p>
      </div>
    </div>
  );
}
