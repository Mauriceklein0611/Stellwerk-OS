import { describe, expect, it } from "vitest";

import { releaseProgress, releaseSprints } from "@/lib/release";
import type { BoardTask, PlannedSprint, UserStory } from "@/types";

/**
 * TASK-041: release progress aggregation. Verifies the figures are summed from
 * the release's sprints and that "done" follows the TASK-038 semantics
 * (`isStoryDone`: ≥1 task and *all* terminal) – no separate done logic here.
 */

function story(id: string, pt: number): UserStory {
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

function sprint(patch: Partial<PlannedSprint>): PlannedSprint {
  return {
    id: "s",
    projectId: "p1",
    name: "Sprint",
    goal: "",
    status: "planned",
    storyIds: [],
    order: 0,
    ...patch,
  };
}

describe("releaseSprints", () => {
  it("returns only the release's sprints, sorted by order", () => {
    const sprints = [
      sprint({ id: "b", releaseId: "r1", order: 2 }),
      sprint({ id: "a", releaseId: "r1", order: 0 }),
      sprint({ id: "x", releaseId: "r2", order: 1 }),
      sprint({ id: "m", releaseId: undefined, order: 0 }),
    ];
    expect(releaseSprints("r1", sprints).map((s) => s.id)).toEqual(["a", "b"]);
  });

  it("returns [] when no sprint belongs to the release", () => {
    expect(releaseSprints("r1", [sprint({ releaseId: "r2" })])).toEqual([]);
  });
});

describe("releaseProgress", () => {
  const stories = [story("st1", 3), story("st2", 5), story("st3", 2)];

  it("sums planned/done PT and counts across the release's sprints", () => {
    const sprints = [
      sprint({ id: "s1", releaseId: "r1", order: 0, storyIds: ["st1"] }),
      sprint({ id: "s2", releaseId: "r1", order: 1, storyIds: ["st2"] }),
      // foreign release – must be ignored
      sprint({ id: "s3", releaseId: "r2", order: 0, storyIds: ["st3"] }),
    ];
    // st1 done (all tasks terminal), st2 open (one task non-terminal).
    const tasks = [
      task("t1", "st1", "done"),
      task("t2", "st2", "done"),
      task("t3", "st2", "doing"),
      task("t4", "st3", "done"),
    ];

    expect(releaseProgress("r1", sprints, stories, tasks)).toEqual({
      donePt: 3, // only st1
      plannedPt: 8, // st1 + st2
      doneCount: 1,
      total: 2,
      sprintCount: 2,
    });
  });

  it("treats a story with zero tasks as open (TASK-038: empty ≠ done)", () => {
    const sprints = [
      sprint({ id: "s1", releaseId: "r1", order: 0, storyIds: ["st1"] }),
    ];
    expect(releaseProgress("r1", sprints, stories, [])).toEqual({
      donePt: 0,
      plannedPt: 3,
      doneCount: 0,
      total: 1,
      sprintCount: 1,
    });
  });

  it("counts a story done only when all its tasks are terminal", () => {
    const sprints = [
      sprint({ id: "s1", releaseId: "r1", order: 0, storyIds: ["st1"] }),
    ];
    const partial = [task("t1", "st1", "done"), task("t2", "st1", "doing")];
    const all = [task("t1", "st1", "done"), task("t2", "st1", "done")];

    expect(releaseProgress("r1", sprints, stories, partial).doneCount).toBe(0);
    expect(releaseProgress("r1", sprints, stories, all).doneCount).toBe(1);
  });

  it("honours custom terminal columns", () => {
    const sprints = [
      sprint({ id: "s1", releaseId: "r1", order: 0, storyIds: ["st1"] }),
    ];
    const tasks = [task("t1", "st1", "shipped")];
    // Default terminal id is "done" → st1 stays open.
    expect(releaseProgress("r1", sprints, stories, tasks).doneCount).toBe(0);
    // With "shipped" as terminal → st1 is done.
    expect(
      releaseProgress("r1", sprints, stories, tasks, new Set(["shipped"]))
        .doneCount,
    ).toBe(1);
  });

  it("returns all-zero for a release without sprints", () => {
    expect(releaseProgress("r1", [], stories, [])).toEqual({
      donePt: 0,
      plannedPt: 0,
      doneCount: 0,
      total: 0,
      sprintCount: 0,
    });
  });
});
