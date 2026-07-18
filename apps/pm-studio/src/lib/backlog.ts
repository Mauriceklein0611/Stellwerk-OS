import { criteriaFromStrings } from "@/lib/acceptance";
import { storyTaskRollup } from "@/lib/story-tasks";
import type {
  Backlog,
  BacklogProvenance,
  BoardColumnDef,
  BoardTask,
  Epic,
  UserStory,
} from "@/types";

/**
 * Pure, cross-store-free helpers for the backlog entities (TASK-056). All
 * selectors are stable, sort deterministically (by `rank`, then `id` as a
 * tie-breaker) and never mutate their inputs – so they are trivially
 * unit-testable and safe to use inside zustand selectors via `useMemo`.
 */

/** Compare two ranked items: by rank ascending, stable via id. */
function byRank<T extends { rank: number; id: string }>(a: T, b: T): number {
  return a.rank - b.rank || a.id.localeCompare(b.id);
}

/** Epics of one project, ordered by rank. */
export function epicsForProject(epics: Epic[], projectId: string): Epic[] {
  return epics.filter((epic) => epic.projectId === projectId).sort(byRank);
}

/** Stories of one project, ordered by (epic rank, story rank) is not resolved
 * here – kept flat & ordered by story rank; group with {@link storiesForEpic}. */
export function storiesForProject(
  stories: UserStory[],
  projectId: string,
): UserStory[] {
  return stories.filter((story) => story.projectId === projectId).sort(byRank);
}

/** Stories of one epic, ordered by rank. */
export function storiesForEpic(
  stories: UserStory[],
  epicId: string,
): UserStory[] {
  return stories.filter((story) => story.epicId === epicId).sort(byRank);
}

/** Aggregate counts/points of an epic's stories (for backlog roll-ups). */
export function epicRollup(
  epicId: string,
  stories: UserStory[],
): { storyCount: number; totalPt: number } {
  const own = stories.filter((story) => story.epicId === epicId);
  return {
    storyCount: own.length,
    totalPt: own.reduce((sum, story) => sum + story.estimate_pt, 0),
  };
}

/** Aggregate of a story list for the Octane-style backlog footer (TASK-057). */
export type BacklogSummary = {
  /** Number of stories in scope. */
  storyCount: number;
  /** Σ planned points = sum of every story's estimate_pt. */
  plannedPt: number;
  /**
   * Σ done points = sum of estimate_pt over the stories that count as done.
   * "Done" flows exclusively through `storyTaskRollup`/`isStoryDone` (TASK-038),
   * so this never introduces a second done-logic.
   */
  donePt: number;
};

/**
 * Aggregate a list of stories into counts and planned/done point sums for the
 * backlog footer. Pure & testable; `columns` defaults to the standard phases so
 * callers without custom phases stay simple (TASK-057).
 */
export function backlogSummary(
  stories: UserStory[],
  tasks: BoardTask[],
  columns?: BoardColumnDef[],
): BacklogSummary {
  let plannedPt = 0;
  let donePt = 0;
  for (const story of stories) {
    plannedPt += story.estimate_pt;
    if (storyTaskRollup(story.id, tasks, columns).storyDone) {
      donePt += story.estimate_pt;
    }
  }
  return { storyCount: stories.length, plannedPt, donePt };
}

/**
 * Move a ranked item to a new position within its sibling list and return the
 * list with contiguous ranks (0..n-1) reassigned. Pure; unknown id → unchanged
 * (but re-ranked). Used by `reorderEpic`/`reorderStory`.
 */
export function moveRanked<T extends { id: string; rank: number }>(
  items: T[],
  id: string,
  targetIndex: number,
): T[] {
  const ordered = [...items].sort(byRank);
  const from = ordered.findIndex((item) => item.id === id);
  if (from !== -1) {
    const [moved] = ordered.splice(from, 1);
    const clamped = Math.max(0, Math.min(targetIndex, ordered.length));
    ordered.splice(clamped, 0, moved);
  }
  return ordered.map((item, index) => ({ ...item, rank: index }));
}

/**
 * Flatten a Scrum-agent {@link Backlog} artifact into store entities (TASK-056).
 * Epics get `projectId` + a rank by appearance; stories get `epicId`, `projectId`,
 * a rank by appearance within their epic and the given provenance. Story ids are
 * preserved 1:1 so board/sprint `storyId` references keep working.
 */
export function flattenBacklog(
  projectId: string,
  backlog: Backlog,
  provenance: BacklogProvenance = "agent",
): { epics: Epic[]; stories: UserStory[] } {
  const epics: Epic[] = [];
  const stories: UserStory[] = [];

  backlog.epics.forEach((epic, epicIndex) => {
    epics.push({
      id: epic.id,
      projectId,
      title: epic.title,
      rank: epicIndex,
    });
    epic.stories.forEach((story, storyIndex) => {
      stories.push({
        id: story.id,
        epicId: epic.id,
        projectId,
        title: story.title,
        // Artifact keeps the AKs as plain strings (run snapshot); the store
        // entity carries checkable criteria (TASK-058).
        acceptance_criteria: criteriaFromStrings(story.acceptance_criteria),
        estimate_pt: story.estimate_pt,
        priority: story.priority,
        rank: storyIndex,
        provenance,
      });
    });
  });

  return { epics, stories };
}
