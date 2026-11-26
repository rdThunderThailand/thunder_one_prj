"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { InUseLink } from "./in-use-links";

/** ADR 0130 §3: Core's `message` until `load` returns blockers, then `lead` and one link per blocker.
 *  `load` runs once, on mount: a caller clears its error before a retry, which remounts this. */
export function InUseRefusal({
  message,
  lead,
  load,
  className,
}: {
  message: string;
  lead: string;
  load: () => Promise<InUseLink[]>;
  className?: string;
}) {
  const [links, setLinks] = useState<InUseLink[]>([]);

  useEffect(() => {
    let alive = true;
    void load()
      .then((loaded) => {
        if (alive) setLinks(loaded);
      })
      .catch(() => {
        // `message` already names the blockers, so a failed read keeps it.
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (links.length === 0) {
    return (
      <p role="alert" className={className}>
        {message}
      </p>
    );
  }

  return (
    <div role="alert" className={className}>
      <p>{lead}</p>
      <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-primary underline"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
