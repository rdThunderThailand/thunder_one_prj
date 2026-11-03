import { useId, useState, type ReactNode, type RefObject } from "react";
import { ChevronDownIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";

export function RegistrationWorkspace({ scrollRef, children, photos, preview }: {
  scrollRef: RefObject<HTMLDivElement | null>;
  children: ReactNode; photos?: ReactNode; preview: ReactNode;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewId = useId();
  return (
    <div ref={scrollRef} data-registration-scroll className="grid min-h-0 flex-1 items-start gap-3 overflow-y-auto overscroll-contain pb-3 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-stretch xl:overflow-hidden xl:pb-0 2xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div data-registration-form-scroll className="min-w-0 space-y-3 xl:min-h-0 xl:overflow-y-auto xl:overscroll-contain xl:pb-3 xl:pr-1">
        {children}
      </div>
      <div data-registration-preview-rail className="min-w-0 space-y-3 xl:min-h-0 xl:overflow-y-auto xl:overscroll-contain xl:pb-3 xl:pr-1">
        {photos}
        <Button
          variant="outline" size="sm" className="w-full justify-between xl:hidden"
          aria-expanded={previewOpen} aria-controls={previewId}
          onClick={() => setPreviewOpen((open) => !open)}
        >
          {previewOpen ? "Hide preview" : "Show preview"}
          <ChevronDownIcon className={`h-4 w-4 ${previewOpen ? "rotate-180" : ""}`} />
        </Button>
        <div id={previewId} className={previewOpen ? "block" : "hidden xl:block"}>
          {preview}
        </div>
      </div>
    </div>
  );
}
