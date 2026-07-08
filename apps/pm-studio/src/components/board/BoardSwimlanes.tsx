"use client";

import { KanbanColumn } from "@/components/board/KanbanColumn";
import { sumEstimatePt } from "@/lib/board";
import type { Swimlane } from "@/lib/swimlanes";
import type { BoardColumnDef, BoardTask } from "@/types";

type BoardSwimlanesProps = {
  lanes: Swimlane[];
  /** Board phases (columns) repeated within every lane (TASK-032). */
  columns: BoardColumnDef[];
  onTaskClick: (task: BoardTask) => void;
  /** Client-side "today" (ISO) for the cards' due-date indicator (TASK-034). */
  today: string;
};

/**
 * Board grouped into horizontal swimlanes (TASK-036): each lane repeats the
 * configured phases, filtered to the lane's tasks. Drag & drop stays functional
 * through the lane-aware payload on `KanbanColumn`/`TaskCard`; cross-lane drops
 * reassign the group dimension (see board/page.tsx handleDragEnd). Dumb layout –
 * the grouping itself lives in `src/lib/swimlanes.ts`.
 */
export function BoardSwimlanes({
  lanes,
  columns,
  onTaskClick,
  today,
}: BoardSwimlanesProps) {
  if (lanes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
        Keine Tasks zum Gruppieren.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {lanes.map((lane) => {
        const laneTotalPt = sumEstimatePt(lane.tasks);
        return (
          <section
            key={lane.id}
            data-testid={`swimlane-${lane.id}`}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">{lane.label}</h2>
              <span
                data-testid={`swimlane-${lane.id}-count`}
                className="shrink-0 rounded-full bg-secondary px-2 py-0.5 font-mono text-xs text-muted-foreground"
              >
                {lane.tasks.length}
              </span>
              {laneTotalPt > 0 && (
                <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 font-mono text-xs text-muted-foreground">
                  {laneTotalPt} PT
                </span>
              )}
            </div>

            <div className="flex items-start gap-4 overflow-x-auto pb-2">
              {columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  laneId={lane.id}
                  tasks={lane.tasks
                    .filter((task) => task.column === column.id)
                    .sort((a, b) => a.order - b.order)}
                  onTaskClick={onTaskClick}
                  today={today}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
