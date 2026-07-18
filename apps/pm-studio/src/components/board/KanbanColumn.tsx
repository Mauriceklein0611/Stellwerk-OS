"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { TaskCard } from "@/components/board/TaskCard";
import { QuickAddTask } from "@/components/board/QuickAddTask";
import { StatusBadge, STATUS_STYLES } from "@/components/agents/StatusBadge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { isWipExceeded, sumEstimatePt } from "@/lib/board";
import { cn } from "@/lib/utils";
import type { BoardColumn as BoardColumnId, BoardColumnDef, BoardTask } from "@/types";

type KanbanColumnProps = {
  /** The phase this column renders (label, status accent, WIP limit; TASK-032). */
  column: BoardColumnDef;
  tasks: BoardTask[];
  onTaskClick: (task: BoardTask) => void;
  /** Client-side "today" (ISO) for the cards' due-date indicator (TASK-034). */
  today: string;
  /**
   * Quick-add a task at the foot of this column (TASK-033). Receives the trimmed
   * title; the column passes its own id. Omitted/undefined hides the quick-add.
   */
  onQuickAdd?: (column: BoardColumnId, title: string) => void;
  /** When false, quick-add is disabled (e.g. no single project selected). */
  quickAddEnabled?: boolean;
  /** Hint shown when quick-add is disabled. */
  quickAddDisabledHint?: string;
  /**
   * Swimlane this column belongs to (TASK-036). When set, the droppable id and
   * test ids are namespaced per lane (the same phase repeats across lanes), and
   * the drag payload carries the lane so cross-lane drops can reassign the group.
   * Omitted in the flat board view → behaves exactly as before.
   */
  laneId?: string;
};

/** One column of the Kanban board: header with counters + scrollable sortable list (TASK-008, TASK-027, TASK-032). */
export function KanbanColumn({
  column,
  tasks,
  onTaskClick,
  today,
  onQuickAdd,
  quickAddEnabled = true,
  quickAddDisabledHint,
  laneId,
}: KanbanColumnProps) {
  const { id, label, status, wipLimit } = column;
  // Namespace the droppable per lane so the repeated phase stays unique (TASK-036);
  // the flat view (no lane) keeps the bare column id for its existing test ids/dnd.
  const droppableId = laneId ? `${laneId}__${id}` : id;
  const testId = laneId ? `${laneId}-${id}` : id;
  const { setNodeRef } = useDroppable({
    id: droppableId,
    data: { type: "column", columnId: id, laneId },
  });

  const pointSum = sumEstimatePt(tasks);
  const wipExceeded = isWipExceeded(column, tasks.length);

  return (
    <div
      data-testid={`board-column-${testId}`}
      className="flex min-w-[13rem] flex-1 flex-col gap-3 overflow-hidden rounded-xl border border-border bg-surface/40"
    >
      {/* Status-Akzent je Phase – einzige Quelle: BOARD_COLUMN_STATUS → StatusBadge-Tokens. */}
      <div className={cn("h-1 w-full rounded-t-xl", STATUS_STYLES[status].dot)} />

      <div className="flex flex-col gap-2 px-3">
        <div className="flex items-center gap-2">
          <h3 className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
            {label}
          </h3>
          <span
            data-testid={`board-column-${testId}-count`}
            className="shrink-0 rounded-full bg-secondary px-2 py-0.5 font-mono text-xs text-muted-foreground"
          >
            {tasks.length}
          </span>
          {pointSum > 0 && (
            <span
              data-testid={`board-column-${testId}-pt`}
              className="shrink-0 rounded-full bg-secondary px-2 py-0.5 font-mono text-xs text-muted-foreground"
            >
              {pointSum} PT
            </span>
          )}
        </div>

        {wipExceeded && (
          <StatusBadge
            status="warning"
            label={`WIP ${tasks.length}/${wipLimit}`}
            className="self-start"
          />
        )}
      </div>

      <ScrollArea className="max-h-[calc(100vh-22rem)] min-h-24 flex-1 px-3 pb-3">
        <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          <div ref={setNodeRef} className="flex min-h-24 flex-col gap-2">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                today={today}
                isTerminal={column.isTerminal}
                laneId={laneId}
                onClick={() => onTaskClick(task)}
              />
            ))}
            {tasks.length === 0 && (
              <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted">
                Keine Tasks
              </div>
            )}
          </div>
        </SortableContext>

        {onQuickAdd && (
          <div className="mt-2">
            <QuickAddTask
              columnId={id}
              columnLabel={label}
              onAdd={(title) => onQuickAdd(id, title)}
              disabled={!quickAddEnabled}
              disabledHint={quickAddDisabledHint}
            />
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
