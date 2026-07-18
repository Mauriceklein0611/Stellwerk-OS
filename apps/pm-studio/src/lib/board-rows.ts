import {
  DEFAULT_BOARD_COLUMNS,
  columnLabel,
  columnStatus,
  isTerminalColumn,
  sumEstimatePt,
} from "@/lib/board";
import { tagsForIds } from "@/lib/tags";
import type {
  BoardColumn,
  BoardColumnDef,
  BoardTask,
  ChecklistItem,
  Person,
  PlannedSprint,
  Priority,
  StatusType,
  Tag,
} from "@/types";

/** A flattened, display-ready board task for the Scrum list view (TASK-023). */
export type BoardRow = {
  id: string;
  /** Short, human ID (story id if linked, else a truncated task id). */
  shortId: string;
  /** Readable item key (TASK-064, e.g. `PMS-42`); undefined until backfilled. */
  itemKey?: string;
  title: string;
  column: BoardColumn;
  columnLabel: string;
  columnStatus: StatusType;
  priority: Priority;
  estimatePt?: number;
  assigneeName?: string;
  sprintName?: string;
  projectName: string;
  /** Optional due date (ISO `YYYY-MM-DD`, TASK-034); undefined = no due date. */
  dueDate?: string;
  /** Optional checklist items (TASK-035); undefined = none. Progress via checklistProgress. */
  checklist?: ChecklistItem[];
  /** Resolved tags for the row (TASK-031), in tag-store order. */
  tags: Tag[];
  /** The underlying task – row click opens the same TaskDialog as the board. */
  task: BoardTask;
};

/**
 * Build display rows for the list view: resolves the assignee name (people),
 * the sprint name (story → sprint membership) and the column label/status from
 * the configurable phases (TASK-032). Pure and unit-testable; `columns` defaults
 * to the standard phases so existing callers/tests stay valid.
 */
export function buildBoardRows(
  tasks: BoardTask[],
  persons: Person[],
  sprints: Pick<PlannedSprint, "name" | "storyIds">[],
  tags: Tag[] = [],
  columns: BoardColumnDef[] = DEFAULT_BOARD_COLUMNS,
  keys: Record<string, string> = {},
): BoardRow[] {
  const personById = new Map(persons.map((person) => [person.id, person.name]));
  const sprintByStory = new Map<string, string>();
  for (const sprint of sprints)
    for (const storyId of sprint.storyIds)
      sprintByStory.set(storyId, sprint.name);

  return tasks.map((task) => ({
    id: task.id,
    shortId: task.storyId ?? task.id.slice(0, 8),
    itemKey: keys[task.id],
    title: task.title,
    column: task.column,
    columnLabel: columnLabel(task.column, columns),
    columnStatus: columnStatus(task.column, columns),
    priority: task.priority,
    estimatePt: task.estimate_pt,
    assigneeName: task.assigneeId ? personById.get(task.assigneeId) : undefined,
    sprintName: task.storyId ? sprintByStory.get(task.storyId) : undefined,
    projectName: task.projectName,
    dueDate: task.dueDate,
    checklist: task.checklist,
    tags: tagsForIds(task.tagIds, tags),
    task,
  }));
}

/** Aggregate of a board-row list for the Octane-style list footer (TASK-063). */
export type BoardRowSummary = {
  /** Number of tasks in scope. */
  count: number;
  /** Σ planned points = sum of every task's `estimate_pt` (missing = 0). */
  plannedPt: number;
  /**
   * Σ done points = Σ `estimate_pt` over tasks in a terminal phase. "Done" is
   * derived exclusively from `isTerminalColumn` (TASK-032/038), so the footer
   * never introduces a second done-logic.
   */
  donePt: number;
};

/**
 * Aggregate board rows into a count plus planned/done point sums – used for the
 * list-view footer and the per-group subtotals (TASK-063). Pure & testable;
 * reuses `sumEstimatePt` and the terminal-phase check, and `columns` defaults to
 * the standard phases so callers without custom phases stay simple.
 */
export function summarizeBoardRows(
  rows: BoardRow[],
  columns: BoardColumnDef[] = DEFAULT_BOARD_COLUMNS,
): BoardRowSummary {
  const doneTasks = rows
    .filter((row) => isTerminalColumn(row.column, columns))
    .map((row) => row.task);
  return {
    count: rows.length,
    plannedPt: sumEstimatePt(rows.map((row) => row.task)),
    donePt: sumEstimatePt(doneTasks),
  };
}
