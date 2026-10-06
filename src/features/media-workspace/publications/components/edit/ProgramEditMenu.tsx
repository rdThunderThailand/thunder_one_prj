import Link from "next/link";
import { MoreIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/lovable/dropdown-menu";

type Props = {
  isDraft: boolean;
  isEnded: boolean;
  detailHref: string;
  onDuplicate: () => void;
  onDelete: () => void;
  onEnd: () => void;
};

/** The editor's ⋮ menu: Duplicate / View Published Version for published Programs, Delete for Drafts, End when live. */
export function ProgramEditMenu({ isDraft, isEnded, detailHref, onDuplicate, onDelete, onEnd }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          aria-label="More actions"
        >
          <MoreIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {!isDraft && <DropdownMenuItem onSelect={onDuplicate}>Duplicate Program</DropdownMenuItem>}
        {!isDraft && (
          <DropdownMenuItem asChild>
            <Link href={detailHref}>View Published Version</Link>
          </DropdownMenuItem>
        )}
        {isDraft && (
          <DropdownMenuItem
            className="text-danger focus:text-danger"
            onSelect={onDelete}
          >
            Delete Program
          </DropdownMenuItem>
        )}
        {!isDraft && !isEnded && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-danger focus:text-danger"
              onSelect={onEnd}
            >
              End program
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
