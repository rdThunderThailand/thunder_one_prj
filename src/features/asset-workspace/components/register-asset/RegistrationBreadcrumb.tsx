import Link from "next/link";
import { ChevronRightIcon } from "@/components/ui/icons";

const REGISTER_ASSET = "Register Asset";

/** Home > Assets > Register Asset, with `current` as the last item when deeper than the method choice. */
export function RegistrationBreadcrumb({ current }: { current?: string }) {
  const links = [
    { label: "Home", href: "/" },
    { label: "Assets", href: "/asset-workspace/assets" },
    ...(current ? [{ label: REGISTER_ASSET, href: "/asset-workspace/assets/register" }] : []),
  ];
  return (
    <nav aria-label="Breadcrumb" className="text-2xs text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1">
        {links.map(({ label, href }) => (
          <li key={href} className="flex items-center gap-1">
            <Link
              href={href}
              className="inline-flex min-h-8 items-center rounded-control underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
            >
              {label}
            </Link>
            <ChevronRightIcon className="h-3 w-3" />
          </li>
        ))}
        <li aria-current="page" className="font-semibold text-foreground">
          {current ?? REGISTER_ASSET}
        </li>
      </ol>
    </nav>
  );
}
