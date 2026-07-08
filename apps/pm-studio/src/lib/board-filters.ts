import type { BoardColumn, BoardTask, PlannedSprint, UserStory } from "@/types";
import { DEFAULT_TERMINAL_COLUMN_IDS } from "@/lib/board";
import { isOverdue } from "@/lib/due";
import { isStoryDone } from "@/lib/sprint-progress";
import { taskHasTag } from "@/lib/tags";

/** Sentinel: this filter imposes no constraint. */
export const ALL = "all";
/** Sentinel: the task/story has no assignee. */
export const UNASSIGNED = "unassigned";
/** Sentinel: the task's story belongs to no sprint. */
export const NO_SPRINT = "no-sprint";
/** Sentinel: keep only overdue tasks (due date past, task not done). */
export const OVERDUE = "overdue";
/** Done-state sentinels for the sprint view. */
export const DONE = "done";
export const OPEN = "open";

/* ------------------------------------------------------------------ *
 * Board filters
 * ------------------------------------------------------------------ */

export type BoardFilter = {
  projectId: string;
  sprintId: string;
  assigneeId: string;
  priority: string;
  column: string;
  /**
   * Single tag membership filter (TASK-031). The FilterBar is single-select, so
   * the constraint is "task carries this tag" – ALL means no constraint. A
   * single value needs no AND/OR semantics; multi-tag is intentionally out of
   * scope here (documented in tests/task-031/testkonzept.md).
   */
  tagId: string;
  /**
   * Due-date filter (TASK-034). ALL = no constraint, OVERDUE = only tasks whose
   * due date is in the past and that are not done. Evaluated against the
   * client-side `today` passed to `filterBoardTasks`.
   */
  due: string;
};

export const emptyBoardFilter: BoardFilter = {
  projectId: ALL,
  sprintId: ALL,
  assigneeId: ALL,
  priority: ALL,
  column: ALL,
  tagId: ALL,
  due: ALL,
};

export function isBoardFilterActive(filter: BoardFilter): boolean {
  return (Object.values(filter) as string[]).some((value) => value !== ALL);
}

/** Map each story id to the sprint it belongs to (a story is in ≤ 1 sprint). */
function sprintByStory(
  sprints: Pick<PlannedSprint, "id" | "storyIds">[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const sprint of sprints)
    for (const storyId of sprint.storyIds) map.set(storyId, sprint.id);
  return map;
}

/**
 * Filter board tasks by project, sprint (incl. "no sprint"), assignee (incl.
 * "unassigned"), priority and column. All active criteria are combined with AND.
 */
export function filterBoardTasks(
  tasks: BoardTask[],
  filter: BoardFilter,
  sprints: Pick<PlannedSprint, "id" | "storyIds">[],
  today?: string,
  terminalColumns: Set<BoardColumn> = DEFAULT_TERMINAL_COLUMN_IDS,
): BoardTask[] {
  const sprintOf = sprintByStory(sprints);

  return tasks.filter((task) => {
    if (filter.projectId !== ALL && task.projectId !== filter.projectId)
      return false;
    if (filter.priority !== ALL && task.priority !== filter.priority)
      return false;
    if (filter.column !== ALL && task.column !== filter.column) return false;
    if (filter.tagId !== ALL && !taskHasTag(task, filter.tagId)) return false;
    // Overdue needs a "today" reference; without one the constraint is skipped
    // (the board only filters past the hydration gate, so today is always set).
    if (
      filter.due === OVERDUE &&
      today &&
      !isOverdue(task.dueDate, today, terminalColumns.has(task.column))
    )
      return false;

    if (filter.assigneeId === UNASSIGNED) {
      if (task.assigneeId) return false;
    } else if (
      filter.assigneeId !== ALL &&
      task.assigneeId !== filter.assigneeId
    ) {
      return false;
    }

    if (filter.sprintId !== ALL) {
      const sprintId = task.storyId ? sprintOf.get(task.storyId) : undefined;
      if (filter.sprintId === NO_SPRINT) {
        if (sprintId) return false;
      } else if (sprintId !== filter.sprintId) {
        return false;
      }
    }

    return true;
  });
}

/* ------------------------------------------------------------------ *
 * Sprint-view filters
 * ------------------------------------------------------------------ */

export type SprintViewFilter = {
  assigneeId: string;
  /** ALL | SprintStatus. */
  sprintStatus: string;
  /** ALL | DONE | OPEN. */
  done: string;
};

export const emptySprintViewFilter: SprintViewFilter = {
  assigneeId: ALL,
  sprintStatus: ALL,
  done: ALL,
};

export function isSprintViewFilterActive(filter: SprintViewFilter): boolean {
  return (Object.values(filter) as string[]).some((value) => value !== ALL);
}

/** Does a sprint's status pass the status filter? */
export function sprintStatusMatches(
  status: string,
  filter: SprintViewFilter,
): boolean {
  return filter.sprintStatus === ALL || status === filter.sprintStatus;
}

/**
 * Does a story pass the person + done constraints of the sprint view? The
 * assignee and done state are derived from the story's board task.
 */
export function storyMatchesFilter(
  story: UserStory,
  filter: SprintViewFilter,
  boardTasks: BoardTask[],
  terminalColumns: Set<BoardColumn> = DEFAULT_TERMINAL_COLUMN_IDS,
): boolean {
  if (filter.assigneeId !== ALL) {
    const assignee = boardTasks.find(
      (task) => task.storyId === story.id,
    )?.assigneeId;
    if (filter.assigneeId === UNASSIGNED) {
      if (assignee) return false;
    } else if (assignee !== filter.assigneeId) {
      return false;
    }
  }

  if (filter.done !== ALL) {
    const done = isStoryDone(story.id, boardTasks, terminalColumns);
    if (filter.done === DONE && !done) return false;
    if (filter.done === OPEN && done) return false;
  }

  return true;
}
