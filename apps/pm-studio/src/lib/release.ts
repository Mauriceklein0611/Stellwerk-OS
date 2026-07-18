import { DEFAULT_TERMINAL_COLUMN_IDS } from "@/lib/board";
import { isStoryDone, sprintProgress } from "@/lib/sprint-progress";
import type {
  BoardColumn,
  BoardTask,
  PlannedSprint,
  Release,
  UserStory,
} from "@/types";

/**
 * One inclusive date window (`YYYY-MM-DD`) of a generated sprint.
 */
export type SprintWindow = { start: string; end: string };

/**
 * Add `days` to an ISO date (`YYYY-MM-DD`), returning a new ISO date.
 * Computed in UTC so it is timezone-independent and deterministic.
 */
function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Split an inclusive `[startDate, endDate]` range into back-to-back timeboxes
 * of `lengthWeeks` weeks. The last window is clamped to `endDate`, so a partial
 * trailing window is allowed. Returns `[]` when the range is empty/inverted.
 *
 * Pure and deterministic – the basis for {@link generateSprints} and unit tests.
 */
export function sprintWindows(
  startDate: string,
  endDate: string,
  lengthWeeks: number,
): SprintWindow[] {
  if (endDate < startDate) return [];

  const span = lengthWeeks * 7; // days per full window
  const windows: SprintWindow[] = [];
  let cursor = startDate;

  // ISO dates compare lexicographically, so string compares are safe here.
  while (cursor <= endDate) {
    const lastDay = addDays(cursor, span - 1);
    const end = lastDay > endDate ? endDate : lastDay; // clamp final window
    windows.push({ start: cursor, end });
    cursor = addDays(end, 1);
  }

  return windows;
}

/**
 * Generate the dated sprints of a release: one `PlannedSprint` per timebox,
 * named "Sprint 1…n", `status: "planned"`, tagged with `releaseId`, and given
 * a sequential `order`. Deterministic except for the random ids (which the
 * unit tests ignore).
 */
export function generateSprints(release: Release): PlannedSprint[] {
  return sprintWindows(
    release.startDate,
    release.endDate,
    release.sprintLengthWeeks,
  ).map((window, index) => ({
    id: crypto.randomUUID(),
    projectId: release.projectId,
    releaseId: release.id,
    name: `Sprint ${index + 1}`,
    goal: "",
    status: "planned",
    storyIds: [],
    order: index,
    startDate: window.start,
    endDate: window.end,
  }));
}

/**
 * The sprints belonging to a release, sorted by `order` (the generated order is
 * stable; see {@link generateSprints}). Pure – the basis for the release
 * timeline and {@link releaseProgress}.
 */
export function releaseSprints(
  releaseId: string,
  sprints: PlannedSprint[],
): PlannedSprint[] {
  return sprints
    .filter((sprint) => sprint.releaseId === releaseId)
    .sort((a, b) => a.order - b.order);
}

/**
 * Aggregated delivery progress of a release (TASK-041): completed vs. planned
 * person-days and story counts, summed over the release's sprints.
 *
 * The done-state is **not** decided here – each sprint is measured through
 * {@link sprintProgress}, which in turn relies on `isStoryDone` (TASK-038). A
 * story lives in at most one sprint, so summing the per-sprint figures never
 * double-counts. Pure and cross-store (reads sprint membership, the backlog and
 * the board without mutating anything).
 */
export type ReleaseProgress = {
  /** Completed person-days (done stories across the release's sprints). */
  donePt: number;
  /** Planned person-days (all assigned stories across the release's sprints). */
  plannedPt: number;
  /** Number of done stories. */
  doneCount: number;
  /** Number of assigned stories (the release's scope). */
  total: number;
  /** Number of sprints belonging to the release. */
  sprintCount: number;
};

export function releaseProgress(
  releaseId: string,
  sprints: PlannedSprint[],
  stories: UserStory[],
  boardTasks: BoardTask[],
  terminalColumns: Set<BoardColumn> = DEFAULT_TERMINAL_COLUMN_IDS,
): ReleaseProgress {
  let donePt = 0;
  let plannedPt = 0;
  let doneCount = 0;
  let total = 0;
  let sprintCount = 0;

  for (const sprint of sprints) {
    if (sprint.releaseId !== releaseId) continue;
    sprintCount += 1;
    const progress = sprintProgress(sprint, stories, boardTasks, terminalColumns);
    donePt += progress.donePt;
    plannedPt += progress.plannedPt;
    doneCount += progress.doneCount;
    total += progress.total;
  }

  return { donePt, plannedPt, doneCount, total, sprintCount };
}

/**
 * The content scope of a release (TASK-062): the stories explicitly assigned to
 * it via `UserStory.releaseId` (Jira fixVersion / Octane release), independent
 * of the sprint-based {@link releaseProgress}. Answers "what is in the release?".
 */
export type ReleaseScope = {
  /** Number of stories assigned to the release. */
  storyCount: number;
  /** Σ planned points = sum of every assigned story's estimate_pt. */
  plannedPt: number;
  /** Σ done points = sum of estimate_pt over the assigned stories that are done. */
  donePt: number;
  /** Number of done stories. */
  doneCount: number;
};

/**
 * Aggregate the stories assigned to a release into counts and planned/done
 * point sums. Done-state flows exclusively through `isStoryDone` (TASK-038), so
 * this never introduces a second done-logic. Pure & testable; `terminalColumns`
 * defaults to the standard terminal phase so simple callers stay simple.
 */
export function releaseScope(
  releaseId: string,
  stories: UserStory[],
  boardTasks: BoardTask[],
  terminalColumns: Set<BoardColumn> = DEFAULT_TERMINAL_COLUMN_IDS,
): ReleaseScope {
  let plannedPt = 0;
  let donePt = 0;
  let doneCount = 0;
  let storyCount = 0;

  for (const story of stories) {
    if (story.releaseId !== releaseId) continue;
    storyCount += 1;
    plannedPt += story.estimate_pt;
    if (isStoryDone(story.id, boardTasks, terminalColumns)) {
      donePt += story.estimate_pt;
      doneCount += 1;
    }
  }

  return { storyCount, plannedPt, donePt, doneCount };
}
