import { PickerFilterChoice, PickerFilterSection } from "../PickerPanels";

/** One single-choice filter group of Change Target (Type / Location / Status), counts beside each value. */
export function TargetFacet<T extends string>({
  label,
  allLabel,
  value,
  options,
  onChange,
}: {
  label: string;
  allLabel: string;
  value: T | "all";
  options: { key: T; label: string; count: number }[];
  onChange: (next: T | "all") => void;
}) {
  return (
    <PickerFilterSection
      label={label}
      divided
    >
      <div
        role="radiogroup"
        aria-label={label}
      >
        <PickerFilterChoice
          checked={value === "all"}
          label={allLabel}
          onClick={() => onChange("all")}
        />
        {options.map((option) => (
          <PickerFilterChoice
            key={option.key}
            checked={value === option.key}
            label={`${option.label} (${option.count})`}
            onClick={() => onChange(option.key)}
          />
        ))}
      </div>
    </PickerFilterSection>
  );
}
