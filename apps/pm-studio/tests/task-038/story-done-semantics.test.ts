import { describe, expect, it } from "vitest";

import { sprintBurndown } from "@/lib/burndown";
import { selectVelocity } from "@/lib/dashboard-selectors";
import { isStoryDone, sprintProgress } from "@/lib/sprint-progress";
import { storyTaskRollup } from "@/lib/story-tasks";
import type { BoardTask, ProjectArtifacts, UserStory } from "@/types";

/**
 * TASK-038: a story is "done" only when it has at least one linked task and
 * *all* of them are terminal. The previous rule ("any terminal task") made
 * velocity/burndown/progress too optimistic. These tests pin the 0/1-of-2/2-of-2
 * cases down on the single done source and the metrics that consume it.
 */

function story(id: string, estimate_pt: number): UserStory {
  return { id, epicId: "E-1", projectId: "p1", title: id, acceptance_criteria: [], estimate_pt, priority: "mittel", rank: 0, provenance: "agent" };
}

function task(
  id: string,
  column: BoardTask["column"],
  storyId?: string,
  doneAt?: string,
): BoardTask {
  return {
    id,
    title: id,
    column,
    order: 0,
    projectId: "p-1",
    projectName: "p-1",
    storyId,
    priority: "mittel",
    doneAt,
  };
}

describe("isStoryDone – all-terminal semantics (TASK-038)", () => {
  it("0 tasks → not done (an empty story cannot be finished)", () => {
    expect(isStoryDone("US-1", [])).toBe(false);
    expect(isStoryDone("US-1", [task("T-1", "done", "US-2")])).toBe(false);
  });

  it("1 of 2 terminal → not done", () => {
    const tasks = [task("T-1", "done", "US-1"), task("T-2", "in_progress", "US-1")];
    expect(isStoryDone("US-1", tasks)).toBe(false);
  });

  it("2 of 2 terminal → done", () => {
    const tasks = [task("T-1", "done", "US-1"), task("T-2", "done", "US-1")];
    expect(isStoryDone("US-1", tasks)).toBe(true);
  });

  it("a single terminal task is done (length 1, all terminal)", () => {
    expect(isStoryDone("US-1", [task("T-1", "done", "US-1")])).toBe(true);
  });

  it("ignores tasks of other stories when judging completeness", () => {
    // US-1 fully terminal; an open task of US-2 must not affect US-1.
    const tasks = [task("T-1", "done", "US-1"), task("T-2", "todo", "US-2")];
    expect(isStoryDone("US-1", tasks)).toBe(true);
  });
});

describe("sprintProgress reflects all-terminal semantics", () => {
  const stories = [story("US-1", 3), story("US-2", 5)];

  it("counts a partially terminal story as open", () => {
    const tasks = [
      task("T-1", "done", "US-1"),
      task("T-2", "in_progress", "US-1"), // US-1 not fully terminal
      task("T-3", "done", "US-2"), // US-2 fully terminal
    ];
    const progress = sprintProgress({ storyIds: ["US-1", "US-2"] }, stories, tasks);
    expect(progress).toEqual({ donePt: 5, plannedPt: 8, doneCount: 1, total: 2 });
  });

  it("an assigned story without tasks stays open", () => {
    const progress = sprintProgress({ storyIds: ["US-1"] }, stories, []);
    expect(progress).toEqual({ donePt: 0, plannedPt: 3, doneCount: 0, total: 1 });
  });
});

describe("storyTaskRollup.storyDone reflects all-terminal semantics", () => {
  it("is false while one task is still open, true once all are terminal", () => {
    const partial = [
      task("T-1", "done", "US-1", undefined),
      task("T-2", "todo", "US-1"),
    ];
    expect(storyTaskRollup("US-1", partial)).toMatchObject({
      total: 2,
      doneTasks: 1,
      storyDone: false,
    });

    const complete = [
      task("T-1", "done", "US-1"),
      task("T-2", "done", "US-1"),
    ];
    expect(storyTaskRollup("US-1", complete)).toMatchObject({
      total: 2,
      doneTasks: 2,
      storyDone: true,
    });
  });

  it("an unknown / task-less story is not done", () => {
    expect(storyTaskRollup("US-9", [])).toMatchObject({ total: 0, storyDone: false });
  });
});

describe("sprintBurndown only burns a story once it is fully terminal", () => {
  const sprint = {
    storyIds: ["US-1"],
    startDate: "2026-07-01",
    endDate: "2026-07-03",
  };
  const stories = [story("US-1", 4)];

  it("does not burn while a task is still open", () => {
    const tasks = [
      task("T-1", "done", "US-1", "2026-07-01T08:00:00.000Z"),
      task("T-2", "in_progress", "US-1"),
    ];
    const result = sprintBurndown(sprint, stories, tasks, "2026-07-03");
    // Story never fully done → remaining stays at planned PT every day.
    expect(result.map((point) => point.remaining)).toEqual([4, 4, 4]);
  });

  it("burns on the latest doneAt once every task is terminal", () => {
    const tasks = [
      task("T-1", "done", "US-1", "2026-07-01T08:00:00.000Z"),
      task("T-2", "done", "US-1", "2026-07-03T08:00:00.000Z"),
    ];
    const result = sprintBurndown(sprint, stories, tasks, "2026-07-03");
    // Done date = latest (07-03), so it only drops on the last day.
    expect(result.map((point) => point.remaining)).toEqual([4, 4, 0]);
  });
});

describe("selectVelocity reflects all-terminal semantics", () => {
  const artifacts: Record<string, ProjectArtifacts> = {
    "p-1": {
      draft: {
        summary: "",
        vision: "",
        value_proposition: "",
        target_group: "",
        mvp: { description: "", features: [] },
        phases: [],
        initial_risks: [],
        open_questions: [],
      },
      requirements: {
        functional: [],
        non_functional: [],
        technical: [],
        dependencies: [],
        assumptions: [],
        budget_drivers: [],
        time_risks: [],
        clarifications: [],
      },
      backlog: {
        epics: [
          {
            id: "E-1",
            title: "Epic",
            // Run-artifact snapshot keeps string AKs (BacklogStory).
            stories: [story("US-1", 3), story("US-2", 5)].map((s) => ({
              id: s.id,
              title: s.title,
              acceptance_criteria: [],
              estimate_pt: s.estimate_pt,
              priority: s.priority,
            })),
          },
        ],
        sprint_suggestions: [{ name: "Sprint 1", goal: "g", story_ids: ["US-1", "US-2"] }],
      },
      risks: { risks: [] },
    },
  };

  it("counts a story only when all of its tasks are terminal", () => {
    const tasks = [
      task("T-1", "done", "US-1"), // US-1 fully done → 3 PT
      task("T-2", "done", "US-2"),
      task("T-3", "in_progress", "US-2"), // US-2 partially done → 0
    ];
    expect(
      selectVelocity(artifacts, [story("US-1", 3), story("US-2", 5)], tasks),
    ).toEqual([{ sprint: "Sprint 1", points: 3, planned: 8 }]);
  });
});
