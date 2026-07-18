import { describe, expect, it } from "vitest";

import { releaseScope } from "@/lib/release";
import type { BoardTask, UserStory } from "@/types";

/**
 * TASK-062: release content scope. `releaseScope` aggregates the stories
 * assigned to a release via `UserStory.releaseId` and derives "done" purely
 * through `isStoryDone` (TASK-038: ≥1 task and *all* terminal) – no second logic.
 */

function story(id: string, pt: number, releaseId?: string): UserStory {
  return {
    id,
    epicId: "E-1",
    projectId: "p1",
    title: id,
    acceptance_criteria: [],
    estimate_pt: pt,
    priority: "mittel",
    rank: 0,
    provenance: "agent",
    releaseId,
  };
}

function task(id: string, storyId: string, column: string): BoardTask {
  return {
    id,
    title: id,
    column,
    order: 0,
    projectId: "p1",
    projectName: "P1",
    storyId,
    priority: "mittel",
  };
}

describe("releaseScope (TASK-062)", () => {
  it("counts only the stories assigned to the release", () => {
    const stories = [
      story("st1", 3, "r1"),
      story("st2", 5, "r1"),
      story("st3", 2, "r2"),
      story("st4", 8), // unassigned
    ];
    const scope = releaseScope("r1", stories, []);
    expect(scope.storyCount).toBe(2);
    expect(scope.plannedPt).toBe(8);
  });

  it("counts a story as done only when all its tasks are terminal (TASK-038)", () => {
    const stories = [story("st1", 3, "r1"), story("st2", 5, "r1")];
    const tasks = [
      task("t1", "st1", "done"), // st1 fully done
      task("t2", "st2", "done"),
      task("t3", "st2", "todo"), // st2 not done (one open task)
    ];
    const scope = releaseScope("r1", stories, tasks);
    expect(scope.plannedPt).toBe(8);
    expect(scope.donePt).toBe(3);
    expect(scope.doneCount).toBe(1);
  });

  it("never counts a story without tasks as done", () => {
    const scope = releaseScope("r1", [story("st1", 3, "r1")], []);
    expect(scope.donePt).toBe(0);
    expect(scope.doneCount).toBe(0);
  });

  it("returns an empty scope when no story is assigned", () => {
    const scope = releaseScope("r1", [story("st1", 3, "r2")], []);
    expect(scope).toEqual({
      storyCount: 0,
      plannedPt: 0,
      donePt: 0,
      doneCount: 0,
    });
  });

  it("respects custom terminal columns", () => {
    const stories = [story("st1", 4, "r1")];
    const tasks = [task("t1", "st1", "released")];
    // Default terminal set (done) → not done; custom set including "released" → done.
    expect(releaseScope("r1", stories, tasks).donePt).toBe(0);
    expect(
      releaseScope("r1", stories, tasks, new Set(["released"])).donePt,
    ).toBe(4);
  });
});
