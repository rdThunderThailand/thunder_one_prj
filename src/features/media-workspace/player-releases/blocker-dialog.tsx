"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { CheckCircleIcon, InfoIcon, XCircleIcon } from "@/components/ui/icons";
import { pilotChecks, type FleetDevice, type PilotBlocker } from "./device-state";

/** ADR 0028 §11 item 3: why a device cannot be added, as a checklist of every guard. */
const CHECK_STYLE = {
  pass: { Icon: CheckCircleIcon, tone: "text-success", row: "bg-success-muted", word: "Passed" },
  fail: { Icon: XCircleIcon, tone: "text-error", row: "bg-error-muted", word: "Failed" },
  unknown: { Icon: InfoIcon, tone: "text-muted-foreground", row: "bg-muted", word: "Not known" },
} as const;

export function BlockerDialog({ device, blocker }: { device: FleetDevice; blocker: PilotBlocker }) {
  const checks = pilotChecks(device);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="cursor-pointer text-left text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
          {blocker.reason}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {device.name} cannot be added
          </DialogTitle>
          <DialogDescription>
            Blocked by: {blocker.reason}
          </DialogDescription>
        </DialogHeader>
        <ul className="grid gap-2">
          {checks.map((item) => {
            const { Icon, tone, row, word } = CHECK_STYLE[item.status];
            return (
              <li key={item.label} className={`flex gap-3 rounded-lg p-3 ${row}`}>
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone}`} aria-hidden />
                <div className="text-sm">
                  <p className="font-medium">
                    {item.label}
                    <span className={`ml-2 text-xs font-normal ${tone}`}>
                      {word}
                    </span>
                  </p>
                  <p className="text-muted-foreground">
                    {item.note}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
