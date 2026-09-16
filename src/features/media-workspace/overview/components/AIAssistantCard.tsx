import { Card } from "@/components/ui/Card";
import { SparklesIcon } from "@/components/ui/icons";

export function AIAssistantCard() {
  return (
    <Card className="relative overflow-hidden bg-linear-to-br from-indigo-600 to-blue-600 p-4 text-white">
      <div className="mb-2 flex items-center gap-2">
        <SparklesIcon className="h-4 w-4" />
        <h2 className="text-sm font-semibold">AI Media Assistant</h2>
        <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-medium">
          Beta
        </span>
      </div>
      <p className="mb-4 text-xs text-indigo-100">
        ให้ AI ช่วยแนะนำเนื้อหาและตารางเผยแพร่สื่อของคุณ
      </p>
      <button className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium hover:bg-white/25">
        Ask AI Assistant →
      </button>
    </Card>
  );
}
