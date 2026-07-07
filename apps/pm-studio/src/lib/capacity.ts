import type {
  BoardTask,
  Person,
  PlannedSprint,
  StatusType,
  UserStory,
} from "@/types";

/**
 * Load status for an assigned-vs-capacity ratio (single source for the colors):
 * - `success` im Rahmen (≤ 90 %)
 * - `warning` nahe der Grenze (> 90 %, ≤ 100 %)
 * - `danger` überlastet (> 100 %, oder Last ohne Kapazität)
 * - `idle` keine Last
 */
export function loadStatus(assignedPt: number, capacityPt: number): StatusType {
  if (assignedPt <= 0) return "idle";
  if (capacityPt <= 0) return "danger";
  const ratio = assignedPt / capacityPt;
  if (ratio > 1) return "danger";
  if (ratio > 0.9) return "warning";
  return "success";
}

export type PersonLoad = {
  personId: string;
  name: string;
  /** Sum of assigned person-days in the sprint. */
  assignedPt: number;
  /** The person's capacity per sprint. */
  capacityPt: number;
  status: StatusType;
};

/**
 * Per-person workload for one sprint: the person-days of the sprint's stories
 * whose board task is assigned to that person, compared to their capacity.
 *
 * Pure and cross-store (sprint membership + backlog estimates + board
 * assignment + people). A story contributes once, via its single board task;
 * only persons with assigned work in the sprint are returned (sorted by name).
 */
export function sprintWorkload(
  sprint: Pick<PlannedSprint, "storyIds">,
  stories: UserStory[],
  boardTasks: BoardTask[],
  persons: Person[],
): PersonLoad[] {
  const storyById = new Map(stories.map((story) => [story.id, story]));
  const taskByStory = new Map<string, BoardTask>();
  for (const task of boardTasks)
    if (task.storyId) taskByStory.set(task.storyId, task);

  const assignedByPerson = new Map<string, number>();
  for (const id of new Set(sprint.storyIds)) {
    const story = storyById.get(id);
    const task = taskByStory.get(id);
    if (!story || !task?.assigneeId) continue;
    assignedByPerson.set(
      task.assigneeId,
      (assignedByPerson.get(task.assigneeId) ?? 0) + story.estimate_pt,
    );
  }

  const personById = new Map(persons.map((person) => [person.id, person]));

  return [...assignedByPerson.entries()]
    .map(([personId, assignedPt]) => {
      const person = personById.get(personId);
      const capacityPt = person?.capacityPtPerSprint ?? 0;
      return {
        personId,
        name: person?.name ?? "Unbekannt",
        assignedPt,
        capacityPt,
        status: loadStatus(assignedPt, capacityPt),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export type SprintCommitment = {
  /** Planned person-days of the sprint (sum of its stories' estimates). */
  plannedPt: number;
  /** Combined capacity of the given people per sprint. */
  capacityPt: number;
  /** True when the plan exceeds the available capacity. */
  overcommitted: boolean;
};

/**
 * Commitment check for a sprint (TASK-059): compares the planned person-days
 * against the combined capacity of the given people (the "team"). Pure – the
 * caller decides which persons make up the team; today the whole roster is
 * passed. A sprint without any capacity (no people) never warns, so an empty
 * roster does not flag every sprint as overplanned.
 */
export function sprintCommitment(
  plannedPt: number,
  persons: Pick<Person, "capacityPtPerSprint">[],
): SprintCommitment {
  const capacityPt = persons.reduce(
    (sum, person) => sum + person.capacityPtPerSprint,
    0,
  );
  return {
    plannedPt,
    capacityPt,
    overcommitted: capacityPt > 0 && plannedPt > capacityPt,
  };
}
