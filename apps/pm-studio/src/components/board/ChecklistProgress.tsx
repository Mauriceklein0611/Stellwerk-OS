import { ListChecks } from "lucide-react";

import { STATUS_STYLES } from "@/components/agents/StatusBadge";
import { checklistComplete, checklistProgress } from "@/lib/checklist";
import { cn } from "@/lib/utils";
import type { ChecklistItem } from "@/types";

type ChecklistProgressBadgeProps = {
  items?: ChecklistItem[];
  className?: string;
};

/**
 * Compact "n/m" checklist progress chip (TASK-035). Renders nothing when the
 * task has no checklist. Neutral by default; a fully checked list turns success
 * green – the color comes from the same status tokens as everything else (no
 * ad-hoc colors). Classification is pure logic in `src/lib/checklist.ts`.
 */
export function ChecklistProgressBadge({
  items,
  className,
}: ChecklistProgressBadgeProps) {
  const { done, total } = checklistProgress(items);
  if (total === 0) return null;

  const complete = checklistComplete(items);

  return (
    <span
      data-testid="checklist-progress"
      data-complete={complete}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        complete
          ? cn(STATUS_STYLES.success.bg, STATUS_STYLES.success.text)
          : "bg-secondary text-muted-foreground",
        className,
      )}
    >
      <ListChecks className="size-3" aria-hidden />
      {done}/{total}
    </span>
  );
}
