import { useId, useState, type ReactNode, type RefObject } from "react";
import { ChevronDownIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { cn } from "@/lib/utils";

export function RegistrationWorkspace({ scrollRef, children, photos, preview, basicInformation = false, header }: {
  scrollRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
  photos?: ReactNode;
  preview: ReactNode;
  basicInformation?: boolean;
  header?: ReactNode;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewId = useId();
  const previewRail = (
    <>
      {photos}
      <Button
        variant="outline"
        size="sm"
        className={cn("w-full justify-between", basicInformation ? "max-sm:h-10 @min-4xl/registration:hidden" : "xl:hidden")}
        aria-expanded={previewOpen}
        aria-controls={previewId}
        onClick={() => setPreviewOpen((open) => !open)}
      >
        {previewOpen ? "Hide preview" : "Show preview"}
        <ChevronDownIcon
          aria-hidden="true"
          className={cn("h-4 w-4", previewOpen && "rotate-180")}
        />
      </Button>
      <div
        id={previewId}
        className={cn(previewOpen ? "block" : "hidden", basicInformation ? "@min-4xl/registration:block" : "xl:block")}
      >
        {preview}
      </div>
    </>
  );

  if (basicInformation) {
    return (
      <div
        ref={scrollRef}
        data-registration-scroll
        className="@container/registration min-h-0 min-w-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pb-3"
      >
        {header}
        <div className="grid items-start gap-3 @min-4xl/registration:grid-cols-[minmax(0,7fr)_minmax(0,4fr)]">
          <div data-registration-form-scroll className="min-w-0 space-y-3">
            {children}
          </div>
          <div data-registration-preview-rail className="min-w-0 space-y-3">
            {previewRail}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} data-registration-scroll className="grid min-h-0 flex-1 items-start gap-3 overflow-y-auto overscroll-contain pb-3 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-stretch xl:overflow-hidden xl:pb-0 2xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div data-registration-form-scroll className="min-w-0 space-y-3 xl:min-h-0 xl:overflow-y-auto xl:overscroll-contain xl:pb-3 xl:pr-1">
        {children}
      </div>
      <div data-registration-preview-rail className="min-w-0 space-y-3 xl:min-h-0 xl:overflow-y-auto xl:overscroll-contain xl:pb-3 xl:pr-1">
        {previewRail}
      </div>
    </div>
  );
}
