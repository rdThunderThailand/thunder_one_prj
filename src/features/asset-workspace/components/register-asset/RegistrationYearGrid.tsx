import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/lovable/button";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";

const PAGE_SIZE = 12;
const MIN_YEAR = 1;
const MAX_YEAR = 9999;
const LAST_PAGE = MAX_YEAR - PAGE_SIZE + 1;
const pageFor = (year: number) => Math.min(LAST_PAGE, Math.floor((year - MIN_YEAR) / PAGE_SIZE) * PAGE_SIZE + MIN_YEAR);

export function RegistrationYearGrid({ year, onChoose, onBack }: {
  year: number; onChoose: (year: number) => void; onBack: () => void;
}) {
  const [page, setPage] = useState(() => pageFor(year));
  const [focused, setFocused] = useState(year);
  const gridRef = useRef<HTMLDivElement>(null);
  const years = Array.from({ length: PAGE_SIZE }, (_, index) => page + index);

  useLayoutEffect(() => {
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-calendar-year="${focused}"]`)?.focus();
  }, [focused, page]);

  function changePage(direction: number) {
    const next = Math.max(MIN_YEAR, Math.min(LAST_PAGE, page + direction * PAGE_SIZE));
    setPage(next);
    setFocused(next);
  }

  function handleKey(event: KeyboardEvent<HTMLButtonElement>, current: number) {
    const column = (current - page) % 3;
    const moves: Record<string, number> = {
      ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3,
      Home: -column, End: 2 - column, PageUp: -PAGE_SIZE, PageDown: PAGE_SIZE,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    const next = Math.max(MIN_YEAR, Math.min(MAX_YEAR, current + moves[event.key]));
    if (next < page || next >= page + PAGE_SIZE) setPage(pageFor(next));
    setFocused(next);
  }

  return (
    <div className="space-y-3" aria-label="Choose a calendar year">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="icon-sm" aria-label="Previous 12 years" disabled={page === MIN_YEAR} onClick={() => changePage(-1)}>
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <p className="text-sm font-semibold" aria-live="polite">{page}–{page + PAGE_SIZE - 1}</p>
        <Button variant="ghost" size="icon-sm" aria-label="Next 12 years" disabled={page === LAST_PAGE} onClick={() => changePage(1)}>
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
      <div ref={gridRef} className="grid grid-cols-3 gap-2">
        {years.map((item) => (
          <Button
            key={item} data-calendar-year={item} variant={item === year ? "primary" : "ghost"} size="sm"
            className="h-10 font-normal" aria-label={`Choose ${item}`} aria-pressed={item === year}
            tabIndex={item === focused ? 0 : -1} onFocus={() => setFocused(item)}
            onKeyDown={(event) => handleKey(event, item)} onClick={() => onChoose(item)}
          >
            {item}
          </Button>
        ))}
      </div>
      <div className="border-t border-border pt-2">
        <Button variant="ghost" size="sm" className="w-full" onClick={onBack}>Back to calendar</Button>
      </div>
    </div>
  );
}
