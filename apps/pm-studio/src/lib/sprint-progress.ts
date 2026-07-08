import { DEFAULT_TERMINAL_COLUMN_IDS } from "@/lib/board";
import type { BoardColumn, BoardTask, PlannedSprint, UserStory } from "@/types";

/**
 * A story counts as "done" only when it has at least one linked board task and
 * *all* of them sit in a terminal phase (≙ "done", TASK-032b/TASK-038). A story
 * without tasks is never done – an empty work package cannot be finished. The
 * link is BoardTask.storyId → UserStory.id (TASK-008). `terminalColumns`
 * defaults to the standard terminal id (`done`) so existing callers/tests stay
 * valid; the board passes the live terminal ids (see `terminalColumnIds`).
 *
 * This is the single source of truth for story done-state; sprint progress,
 * burndown, velocity and the backlog roll-up all consume it.
 */
export function isStoryDone(
  storyId: string,
  boardTasks: BoardTask[],
  terminalColumns: Set<BoardColumn> = DEFAULT_TERMINAL_COLUMN_IDS,
): boolean {
  const tasks = boardTasks.filter((task) => task.storyId === storyId);
  return tasks.length > 0 && tasks.every((task) => terminalColumns.has(task.column));
}

export type SprintProgress = {
  /** Completed person-days (sum of estimate_pt of done stories). */
  donePt: number;
  /** Planned person-days (sum of estimate_pt of all assigned stories). */
  plannedPt: number;
  /** Number of done stories. */
  doneCount: number;
  /** Number of assigned (known) stories. */
  total: number;
};

/**
 * Done vs. planned person-days for a sprint, derived from its assigned stories
 * and the board. Pure and cross-store: it reads sprint membership, the backlog
 * (for estimates) and the board (for done state) without mutating anything.
 *
 * Each story is counted at most once, even if `storyIds` contains duplicates.
 */
export function sprintProgress(
  sprint: Pick<PlannedSprint, "storyIds">,
  stories: UserStory[],
  boardTasks: BoardTask[],
  terminalColumns: Set<BoardColumn> = DEFAULT_TERMINAL_COLUMN_IDS,
): SprintProgress {
  const byId = new Map(stories.map((story) => [story.id, story]));

  let donePt = 0;
  let plannedPt = 0;
  let doneCount = 0;
  let total = 0;

  for (const id of new Set(sprint.storyIds)) {
    const story = byId.get(id);
    if (!story) continue;

    total += 1;
    plannedPt += story.estimate_pt;
    if (isStoryDone(id, boardTasks, terminalColumns)) {
      doneCount += 1;
      donePt += story.estimate_pt;
    }
  }

  return { donePt, plannedPt, doneCount, total };
}
