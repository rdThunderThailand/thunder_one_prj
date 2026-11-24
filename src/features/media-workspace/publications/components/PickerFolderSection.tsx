import type { ContentFolder } from "@/types/domain";
import { flattenFolders, type PickerFolder } from "../picker-folder";
import { PickerFilterChoice, PickerFilterSection } from "./PickerPanels";

/** The "Category" rows of the Change Playlist / Layout pickers: Folders (ADR 0046) with counts. */
export function PickerFolderSection({
  folders,
  counts,
  value,
  onChange,
}: {
  folders: ContentFolder[];
  counts: Record<string, number>;
  value: PickerFolder;
  onChange: (next: PickerFolder) => void;
}) {
  const choice = (key: string, label: string, depth = 0) => (
    <PickerFilterChoice
      key={key}
      checked={value === key}
      label={`${label} (${counts[key] ?? 0})`}
      marker={depth ? <span style={{ width: depth * 10 }} /> : undefined}
      onClick={() => onChange(key)}
    />
  );

  return (
    <PickerFilterSection label="Category">
      <div role="radiogroup" aria-label="Category">
        {choice("all", "All")}
        {flattenFolders(folders).map(({ folder, depth }) => choice(folder.id, folder.name, depth))}
        {choice("uncategorized", "Uncategorized")}
      </div>
    </PickerFilterSection>
  );
}
