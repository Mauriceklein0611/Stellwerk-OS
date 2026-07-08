import { DEFAULT_TERMINAL_COLUMN_IDS } from "@/lib/board";
import { isStoryDone } from "@/lib/sprint-progress";
import type { BoardColumn, BoardTask, PlannedSprint, UserStory } from "@/types";

/**
 * One day of the real sprint burndown: the ideal remaining person-days (linear
 * from `plannedPt` to 0) and the actual remaining load. `remaining` is `null`
 * for days after `today`, so the actual line stops at the present instead of
 * dropping to a misleading value.
 */
export type BurndownDay = {
  /** Compact `DD.MM.` label of the day. */
  day: string;
  ideal: number;
  remaining: number | null;
};

/**
 * Add `days` to an ISO date (`YYYY-MM-DD`) in UTC – timezone-independent and
 * deterministic (mirrors the helper in src/lib/release.ts).
 */
function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Inclusive list of ISO dates from `start` to `end`. */
function isoDays(start: string, end: string): string[] {
  const days: string[] = [];
  // ISO dates compare lexicographically, so string compares are safe here.
  for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1))
    days.push(cursor);
  return days;
}

/** `YYYY-MM-DD` → compact `DD.MM.`. */
function shortDay(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${day}.${month}.`;
}

/**
 * The ISO date a story became done, or `null` if it is not done. Done-state is
 * the single source `isStoryDone` (TASK-038): every linked task must sit in a
 * terminal phase. The story is therefore complete only once its *last* task
 * finishes, so the date is the *latest* `doneAt` among its tasks. A done task
 * without a timestamp (legacy data before TASK-026) yields `""`, which sorts
 * before any real date and so never overrides a real completion date.
 */
function storyDoneDate(
  storyId: string,
  boardTasks: BoardTask[],
  terminalColumns: Set<BoardColumn>,
): string | null {
  if (!isStoryDone(storyId, boardTasks, terminalColumns)) return null;
  const stamps = boardTasks
    .filter((task) => task.storyId === storyId)
    .map((task) => (task.doneAt ? task.doneAt.slice(0, 10) : ""));
  // isStoryDone guarantees ≥1 task, so `stamps` is non-empty; take the latest.
  return stamps.sort().at(-1) ?? null;
}

/** Round to one decimal place (the ideal line is fractional, points are not). */
function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Derive the burndown of a sprint from its timebox, assigned stories and the
 * board. Pure and cross-store: it reads sprint membership, the backlog (for
 * estimates) and the board (for done state + `doneAt`) without mutating.
 *
 * For each day of `[startDate, endDate]`:
 * - `ideal`: linear from `plannedPt` (day 1) down to 0 (last day).
 * - `remaining`: `plannedPt` minus the person-days of every story done on or
 *   before that day. `null` for days after `today`.
 *
 * Each story is counted at most once (duplicate `storyIds` collapse), so there
 * is no double counting even when a story has several board tasks. Returns `[]`
 * when the sprint has no valid timebox.
 */
export function sprintBurndown(
  sprint: Pick<PlannedSprint, "storyIds" | "startDate" | "endDate">,
  stories: UserStory[],
  boardTasks: BoardTask[],
  today: string,
  terminalColumns: Set<BoardColumn> = DEFAULT_TERMINAL_COLUMN_IDS,
): BurndownDay[] {
  const { startDate, endDate } = sprint;
  if (!startDate || !endDate || endDate < startDate) return [];

  const byId = new Map(stories.map((story) => [story.id, story]));
  const assigned: UserStory[] = [];
  for (const id of new Set(sprint.storyIds)) {
    const story = byId.get(id);
    if (story) assigned.push(story);
  }

  const plannedPt = assigned.reduce((sum, story) => sum + story.estimate_pt, 0);

  // Person-days that drop out on a given done date.
  const dones = assigned
    .map((story) => ({
      pt: story.estimate_pt,
      date: storyDoneDate(story.id, boardTasks, terminalColumns),
    }))
    .filter((entry): entry is { pt: number; date: string } => entry.date !== null);

  const days = isoDays(startDate, endDate);
  const last = days.length - 1;

  return days.map((iso, index) => {
    // Single-day timebox: nothing to burn down across, start at plannedPt.
    const ideal = last === 0 ? plannedPt : round1(plannedPt * (1 - index / last));

    let remaining: number | null = null;
    if (iso <= today) {
      const burned = dones
        .filter((entry) => entry.date <= iso)
        .reduce((sum, entry) => sum + entry.pt, 0);
      remaining = plannedPt - burned;
    }

    return { day: shortDay(iso), ideal, remaining };
  });
}
