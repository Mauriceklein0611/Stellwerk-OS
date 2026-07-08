"use client";

import { useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/agents/StatusBadge";
import { ChecklistProgressBadge } from "@/components/board/ChecklistProgress";
import { DueBadge } from "@/components/board/DueBadge";
import { TagChips } from "@/components/tags/TagChips";
import { severityBadge } from "@/lib/severity";
import { initials } from "@/lib/people";
import { tagsForIds } from "@/lib/tags";
import { cn } from "@/lib/utils";
import { useItemKeyStore } from "@/store/useItemKeyStore";
import { usePeopleStore } from "@/store/usePeopleStore";
import { useTagStore } from "@/store/useTagStore";
import type { BoardTask } from "@/types";

type TaskCardProps = {
  task: BoardTask;
  onClick: () => void;
  /** Client-side "today" (ISO) for the due-date indicator (TASK-034). */
  today: string;
  /** Whether the card's phase is terminal (≙ done) – drives the due indicator (TASK-032b). */
  isTerminal: boolean;
  /** Swimlane this card sits in (TASK-036); `undefined` in the flat board view. */
  laneId?: string;
};

/** One draggable/sortable card on the Kanban board (TASK-008). */
export function TaskCard({ task, onClick, today, isTerminal, laneId }: TaskCardProps) {
  // Drag payload (TASK-036): the drop handler reads column + lane from `data`
  // instead of parsing ids, so swimlanes reuse the same card unchanged.
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: task.id,
      data: { type: "task", taskId: task.id, columnId: task.column, laneId },
    });

  const priority = severityBadge(task.priority);
  const assignee = usePeopleStore((state) =>
    task.assigneeId
      ? state.persons.find((person) => person.id === task.assigneeId)
      : undefined,
  );
  // Select the stable store array, then derive – returning a fresh array from
  // the selector itself would loop (getSnapshot must be cached).
  const allTags = useTagStore((state) => state.tags);
  const tags = useMemo(() => tagsForIds(task.tagIds, allTags), [task.tagIds, allTags]);
  // Readable item key (TASK-064); a primitive selector, so no getSnapshot loop.
  const itemKey = useItemKeyStore((state) => state.keys[task.id]);

  return (
    <div
      ref={setNodeRef}
      data-testid={`board-task-${task.id}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "flex cursor-grab flex-col gap-2.5 rounded-lg border border-border bg-surface p-3 text-left shadow-sm transition-colors hover:border-foreground/30 active:cursor-grabbing",
        isDragging && "opacity-50",
      )}
    >
      <div className="flex flex-col gap-1">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
          {task.title}
        </p>
        <p className="flex items-center gap-1.5 truncate text-xs text-muted">
          {itemKey && (
            <>
              <span className="font-mono text-foreground/70">{itemKey}</span>
              <span aria-hidden>·</span>
            </>
          )}
          <span className="truncate">{task.projectName}</span>
        </p>
      </div>

      <TagChips tags={tags} />

      <div className="flex items-center justify-between gap-2">
        <StatusBadge status={priority.status} label={priority.label} />
        <div className="flex items-center gap-1.5">
          <ChecklistProgressBadge items={task.checklist} />
          <DueBadge dueDate={task.dueDate} today={today} done={isTerminal} />
          {typeof task.estimate_pt === "number" && (
            <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 font-mono text-xs text-muted-foreground">
              {task.estimate_pt} PT
            </span>
          )}
        </div>
      </div>

      {assignee ? (
        <Badge variant="outline" className="gap-1.5 self-start">
          <span
            aria-hidden
            className="flex size-4 items-center justify-center rounded-full bg-secondary text-[0.6rem] font-medium text-foreground/80"
          >
            {initials(assignee.name)}
          </span>
          <span className="max-w-40 truncate">{assignee.name}</span>
        </Badge>
      ) : (
        <Badge variant="outline" className="self-start text-muted">
          Nicht zugewiesen
        </Badge>
      )}
    </div>
  );
}
