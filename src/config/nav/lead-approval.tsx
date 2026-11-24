// Lead Approval's sidebar nav — a single page (the approval list itself),
// no sub-nav. Deliberately minimal: this App is a temporary Ops tool, not a
// full department workspace like People/Customer.
import { CheckCircleIcon } from "@/components/ui/icons";
import type { NavConfig } from "./types";

export const leadApprovalNav: NavConfig = {
  overviewItem: {
    label: "รออนุมัติ",
    href: "/lead-approval",
    icon: <CheckCircleIcon className="h-4 w-4 shrink-0" />,
  },
  sections: [],
  standaloneLinks: [],
  standaloneIcons: [],
};
