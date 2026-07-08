import { describe, expect, it } from "vitest";

import { isStoryDone, sprintProgress } from "@/lib/sprint-progress";
import type { BoardTask, UserStory } from "@/types";

function story(id: string, estimate_pt: number): UserStory {
  return { id, epicId: "E-1", projectId: "p1", title: id, acceptance_criteria: [], estimate_pt, priority: "mittel", rank: 0, provenance: "agent" };
}

function task(
  id: string,
  column: BoardTask["column"],
  storyId?: string,
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
  };
}

describe("isStoryDone", () => {
  it("is true when a linked board task is in the done column", () => {
    expect(isStoryDone("US-1", [task("T-1", "done", "US-1")])).toBe(true);
  });

  it("is false when the linked task is not done", () => {
    expect(isStoryDone("US-1", [task("T-1", "in_progress", "US-1")])).toBe(false);
  });

  it("is false when no task references the story", () => {
    expect(isStoryDone("US-1", [task("T-1", "done", "US-2")])).toBe(false);
    expect(isStoryDone("US-1", [])).toBe(false);
  });
});

describe("sprintProgress", () => {
  const stories = [story("US-1", 3), story("US-2", 5), story("US-3", 2)];

  it("sums done vs. planned person-days and counts", () => {
    const progress = sprintProgress(
      { storyIds: ["US-1", "US-2", "US-3"] },
      stories,
      [task("T-1", "done", "US-1"), task("T-3", "done", "US-3")],
    );
    expect(progress).toEqual({ donePt: 5, plannedPt: 10, doneCount: 2, total: 3 });
  });

  it("ignores unknown story ids and stays at zero when nothing is done", () => {
    const progress = sprintProgress(
      { storyIds: ["US-1", "US-404"] },
      stories,
      [],
    );
    expect(progress).toEqual({ donePt: 0, plannedPt: 3, doneCount: 0, total: 1 });
  });

  it("counts each story at most once despite duplicate ids", () => {
    const progress = sprintProgress(
      { storyIds: ["US-1", "US-1"] },
      stories,
      [task("T-1", "done", "US-1")],
    );
    expect(progress).toEqual({ donePt: 3, plannedPt: 3, doneCount: 1, total: 1 });
  });

  it("returns an empty progress for a sprint without stories", () => {
    expect(sprintProgress({ storyIds: [] }, stories, [])).toEqual({
      donePt: 0,
      plannedPt: 0,
      doneCount: 0,
      total: 0,
    });
  });
});
