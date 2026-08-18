import { AttentionListCard } from "./AttentionListCard";
import { StatCardsRow } from "./StatCardsRow";

export function MissionControlPage() {
  return (
    <div className="flex flex-col gap-6">
      <StatCardsRow />
      <AttentionListCard />
    </div>
  );
}
