import { DEFAULT_BOARD_COLUMNS, sumEstimatePt, terminalColumnIds } from "@/lib/board";
import { isStoryDone } from "@/lib/sprint-progress";
import type { BoardColumnDef, BoardTask } from "@/types";

/** Map of column id → left-to-right index for the given phases (TASK-032). */
function columnOrder(columns: BoardColumnDef[]): Map<string, number> {
  return new Map(columns.map((column, index) => [column.id, index]));
}

/**
 * Board tasks linked to a story (BoardTask.storyId → UserStory.id), ordered the
 * way they appear on the board: by column (left → right) and then by position
 * within the column. Pure; the dev-task decomposition of a story (TASK-037)
 * lives entirely as board tasks ("eine Quelle"), so this just selects them.
 * `columns` defaults to the standard phases so existing callers/tests stay valid.
 */
export function tasksForStory(
  storyId: string,
  tasks: BoardTask[],
  columns: BoardColumnDef[] = DEFAULT_BOARD_COLUMNS,
): BoardTask[] {
  const order = columnOrder(columns);
  return tasks
    .filter((task) => task.storyId === storyId)
    .sort((a, b) => {
      const byColumn = (order.get(a.column) ?? 0) - (order.get(b.column) ?? 0);
      return byColumn !== 0 ? byColumn : a.order - b.order;
    });
}

/** Roll-up of a story's dev tasks: counts and person-day sums. */
export type StoryTaskRollup = {
  /** Total number of tasks linked to the story. */
  total: number;
  /** Tasks sitting in the `done` column. */
  doneTasks: number;
  /** Sum of all tasks' estimate_pt (missing values count as 0). */
  totalPt: number;
  /** Sum of done tasks' estimate_pt. */
  donePt: number;
  /**
   * Whether the story counts as done. Reuses `isStoryDone` (TASK-038): a story
   * is done only when it has tasks and *all* of them are terminal, so velocity
   * and sprint progress stay consistent with this roll-up.
   */
  storyDone: boolean;
};

/** Aggregate a story's tasks into counts and PT sums (pure, testable). */
export function storyTaskRollup(
  storyId: string,
  tasks: BoardTask[],
  columns: BoardColumnDef[] = DEFAULT_BOARD_COLUMNS,
): StoryTaskRollup {
  const storyTasks = tasksForStory(storyId, tasks, columns);
  const terminal = terminalColumnIds(columns);
  const doneTasks = storyTasks.filter((task) => terminal.has(task.column));

  return {
    total: storyTasks.length,
    doneTasks: doneTasks.length,
    totalPt: sumEstimatePt(storyTasks),
    donePt: sumEstimatePt(doneTasks),
    storyDone: isStoryDone(storyId, tasks, terminal),
  };
}

/**
 * Decouple a (deleted) story's tasks: drop the `storyId` link so the tasks stay
 * on the board instead of dangling against a story that no longer exists
 * (TASK-037). Returns a new array; tasks of other stories are untouched.
 */
export function detachStoryTasks(tasks: BoardTask[], storyId: string): BoardTask[] {
  return tasks.map((task) => {
    if (task.storyId !== storyId) return task;
    const next = { ...task };
    delete next.storyId;
    return next;
  });
}
