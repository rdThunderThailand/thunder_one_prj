import type { ReactNode } from "react";

export default function RegistrationLayout({ children }: { children: ReactNode }) {
  // Fill the shared main's content height and absorb its 24px bottom padding locally.
  return (
    <div className="relative -mb-6 h-[calc(100%+1.5rem)] min-h-0 overflow-hidden">
      {children}
    </div>
  );
}
