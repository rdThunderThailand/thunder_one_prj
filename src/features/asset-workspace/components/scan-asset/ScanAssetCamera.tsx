import { Button } from "@/components/ui/lovable/button";
import { CameraIcon, LightningIcon, RefreshIcon } from "@/components/ui/icons";
import { useAssetCamera } from "../../hooks/use-asset-camera";

export function ScanAssetCamera({ onDecoded }: { onDecoded: (code: string) => void }) {
  const { videoRef, status, message, retry, torchAvailable, torchOn, torchPending, toggleTorch } = useAssetCamera(onDecoded);

  return (
    <div className="space-y-2">
      <div className="relative aspect-video overflow-hidden rounded-control border border-border bg-muted">
        <video
          ref={videoRef}
          muted
          playsInline
          aria-label="Asset scanner camera preview"
          className={`size-full object-cover ${status === "ready" ? "" : "invisible"}`}
        />
        {status === "ready" ? (
          <>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative size-32">
                <span className="absolute left-0 top-0 size-6 rounded-tl-control border-l-2 border-t-2 border-primary" />
                <span className="absolute right-0 top-0 size-6 rounded-tr-control border-r-2 border-t-2 border-primary" />
                <span className="absolute bottom-0 left-0 size-6 rounded-bl-control border-b-2 border-l-2 border-primary" />
                <span className="absolute bottom-0 right-0 size-6 rounded-br-control border-b-2 border-r-2 border-primary" />
              </div>
            </div>
            <Button
              variant="outline"
              size="icon-sm"
              className="absolute right-3 top-3"
              aria-label={torchOn ? "Turn flash off" : "Turn flash on"}
              aria-pressed={torchOn}
              disabled={!torchAvailable || torchPending}
              title={torchAvailable ? "Toggle camera flash" : "Flash isn't supported by this camera"}
              onClick={() => void toggleTorch()}
            >
              <LightningIcon className="size-4" />
            </Button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
            <CameraIcon className="size-8 text-muted-foreground" />
            <p role="status" className="max-w-sm text-xs text-muted-foreground">
              {status === "starting" ? "Starting camera…" : message}
            </p>
            {status === "error" && (
              <Button variant="outline" size="sm" onClick={retry}>
                <RefreshIcon className="size-4" />
                Retry camera
              </Button>
            )}
          </div>
        )}
      </div>
      <p className="text-center text-xs text-muted-foreground">Position the QR code or Code128 barcode within the frame.</p>
    </div>
  );
}
