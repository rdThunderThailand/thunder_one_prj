import type { ReactNode } from "react";

export default function ImportLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative -mb-6 h-[calc(100%+1.5rem)] min-h-0 overflow-hidden">
      {children}
    </div>
  );
}
