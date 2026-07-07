import type { BoardColumn, BoardTask, Person } from "@/types";
import { DEFAULT_TERMINAL_COLUMN_IDS } from "@/lib/board";
import { isOverdue } from "@/lib/due";

/**
 * Pure selectors for the My Work view (TASK-042): one person's work, bundled
 * across projects/stories/sprints. Kept free of React/Zustand so they are
 * trivially unit-testable. "Done" is derived from the configurable terminal
 * phases (TASK-032b) and "overdue" reuses `isOverdue` (TASK-034) – no second
 * due-date or done logic lives here.
 */

/**
 * Scope of the My Work list:
 * - `assigned` – every task assigned to the person (any phase)
 * - `open`     – assigned and *not* in a terminal phase (still to do)
 * - `overdue`  – open and past its due date (via {@link isOverdue})
 */
export type MyWorkScope = "assigned" | "open" | "overdue";

/** Is the task still open (not in a terminal phase)? */
export function isTaskOpen(
  task: BoardTask,
  terminalColumns: Set<BoardColumn> = DEFAULT_TERMINAL_COLUMN_IDS,
): boolean {
  return !terminalColumns.has(task.column);
}

/**
 * Is the task overdue? Delegates to {@link isOverdue} so the rule stays single-
 * sourced (due date in the past AND the task not in a terminal phase).
 */
export function isTaskOverdue(
  task: BoardTask,
  today: string,
  terminalColumns: Set<BoardColumn> = DEFAULT_TERMINAL_COLUMN_IDS,
): boolean {
  return isOverdue(task.dueDate, today, terminalColumns.has(task.column));
}

/** All board tasks assigned to a person (TASK-020 `assigneeId`). */
export function tasksForPerson(
  tasks: BoardTask[],
  personId: string,
): BoardTask[] {
  if (!personId) return [];
  return tasks.filter((task) => task.assigneeId === personId);
}

/** Counts per scope for the summary chips. */
export type MyWorkCounts = { assigned: number; open: number; overdue: number };

/**
 * Summary counts for a person's tasks. `overdue` needs a `today` reference; an
 * empty `today` (before the hydration gate) yields 0 overdue, never a crash.
 */
export function myWorkCounts(
  personTasks: BoardTask[],
  today: string,
  terminalColumns: Set<BoardColumn> = DEFAULT_TERMINAL_COLUMN_IDS,
): MyWorkCounts {
  let open = 0;
  let overdue = 0;
  for (const task of personTasks) {
    if (isTaskOpen(task, terminalColumns)) open += 1;
    if (today && isTaskOverdue(task, today, terminalColumns)) overdue += 1;
  }
  return { assigned: personTasks.length, open, overdue };
}

/** Apply the scope filter to a person's tasks. */
export function filterMyWork(
  personTasks: BoardTask[],
  scope: MyWorkScope,
  today: string,
  terminalColumns: Set<BoardColumn> = DEFAULT_TERMINAL_COLUMN_IDS,
): BoardTask[] {
  if (scope === "open")
    return personTasks.filter((task) => isTaskOpen(task, terminalColumns));
  if (scope === "overdue")
    return personTasks.filter((task) =>
      today ? isTaskOverdue(task, today, terminalColumns) : false,
    );
  return personTasks;
}

/**
 * Resolve whose work to show (TASK-042). Today the id comes from an explicit
 * selection in the UI; with a later login the logged-in user *is* a `Person`
 * and its id would be passed here as `preferredId`, so the page never changes.
 * Falls back to the first person, so the view is never empty when people exist.
 */
export function resolveMyWorkPersonId(
  preferredId: string | undefined,
  persons: Person[],
): string | undefined {
  if (preferredId && persons.some((person) => person.id === preferredId))
    return preferredId;
  return persons[0]?.id;
}
