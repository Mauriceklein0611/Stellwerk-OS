import { describe, expect, it } from "vitest";

import { backlogSummary } from "@/lib/backlog";
import type { BoardTask, UserStory } from "@/types";

/**
 * TASK-057: the aggregate footer helper. `plannedPt` sums every story's points;
 * `donePt` only counts stories that are done, and "done" flows exclusively
 * through `storyTaskRollup`/`isStoryDone` (TASK-038) – no second done-logic.
 */

function story(id: string, estimate_pt: number): UserStory {
  return {
    id,
    epicId: "E-1",
    projectId: "P-1",
    title: id,
    acceptance_criteria: [],
    estimate_pt,
    priority: "mittel",
    rank: 0,
    provenance: "human",
  };
}

function task(storyId: string, column: string): BoardTask {
  return {
    id: `${storyId}-t`,
    title: "t",
    column,
    order: 0,
    projectId: "P-1",
    projectName: "Demo",
    storyId,
    priority: "mittel",
  };
}

describe("backlogSummary", () => {
  const stories = [story("A", 5), story("B", 3), story("C", 2)];

  it("counts stories and sums planned / done points", () => {
    // A is done (all tasks terminal), B is open, C has no tasks → not done.
    const tasks = [task("A", "done"), task("B", "todo")];
    expect(backlogSummary(stories, tasks)).toEqual({
      storyCount: 3,
      plannedPt: 10,
      donePt: 5,
    });
  });

  it("counts no done points when nothing is terminal", () => {
    expect(backlogSummary(stories, [])).toEqual({
      storyCount: 3,
      plannedPt: 10,
      donePt: 0,
    });
  });

  it("is empty for an empty story list", () => {
    expect(backlogSummary([], [])).toEqual({
      storyCount: 0,
      plannedPt: 0,
      donePt: 0,
    });
  });
});
