import { describe, expect, it } from "vitest";

import { sprintBurndown } from "@/lib/burndown";
import type { BoardTask, PlannedSprint, UserStory } from "@/types";

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

const sprint: Pick<PlannedSprint, "storyIds" | "startDate" | "endDate"> = {
  storyIds: ["US-1", "US-2", "US-3"],
  startDate: "2026-07-01",
  endDate: "2026-07-05",
};

// 3 + 5 + 2 = 10 planned person-days over a 5-day timebox.
const stories = [story("US-1", 3), story("US-2", 5), story("US-3", 2)];

describe("sprintBurndown", () => {
  it("returns one point per day with a linear ideal from plannedPt to 0", () => {
    const result = sprintBurndown(sprint, stories, [], "2026-07-05");

    expect(result).toHaveLength(5);
    expect(result.map((point) => point.day)).toEqual([
      "01.07.",
      "02.07.",
      "03.07.",
      "04.07.",
      "05.07.",
    ]);
    expect(result.map((point) => point.ideal)).toEqual([10, 7.5, 5, 2.5, 0]);
  });

  it("burns the actual line down on the day a story is completed", () => {
    const result = sprintBurndown(
      sprint,
      stories,
      [
        task("T-1", "done", "US-1", "2026-07-02T09:00:00.000Z"), // -3 on day 2
        task("T-2", "done", "US-2", "2026-07-04T18:00:00.000Z"), // -5 on day 4
      ],
      "2026-07-05",
    );

    // remaining = plannedPt minus stories done up to and including that day.
    expect(result.map((point) => point.remaining)).toEqual([10, 7, 7, 2, 2]);
  });

  it("leaves days after today without an actual value (null)", () => {
    const result = sprintBurndown(
      sprint,
      stories,
      [task("T-1", "done", "US-1", "2026-07-02T09:00:00.000Z")],
      "2026-07-03",
    );

    expect(result.map((point) => point.remaining)).toEqual([10, 7, 7, null, null]);
  });

  it("treats a done task without a timestamp as completed at sprint start", () => {
    const result = sprintBurndown(
      sprint,
      stories,
      [task("T-1", "done", "US-1")], // legacy: no doneAt
      "2026-07-05",
    );

    // -3 already gone on day 1.
    expect(result.map((point) => point.remaining)).toEqual([7, 7, 7, 7, 7]);
  });

  it("counts a story once even with several done board tasks (no double count)", () => {
    const result = sprintBurndown(
      { storyIds: ["US-1"], startDate: "2026-07-01", endDate: "2026-07-02" },
      [story("US-1", 3)],
      [
        task("T-1", "done", "US-1", "2026-07-01T08:00:00.000Z"),
        task("T-2", "done", "US-1", "2026-07-02T08:00:00.000Z"),
      ],
      "2026-07-02",
    );

    // Story is done only once *all* tasks are terminal (TASK-038), so it burns
    // on the latest doneAt (07-02); still only 3 PT drop out, never 6.
    expect(result.map((point) => point.remaining)).toEqual([3, 0]);
  });

  it("ignores unknown story ids when summing planned points", () => {
    const result = sprintBurndown(
      { storyIds: ["US-1", "US-404"], startDate: "2026-07-01", endDate: "2026-07-02" },
      [story("US-1", 3)],
      [],
      "2026-07-02",
    );

    expect(result[0]).toEqual({ day: "01.07.", ideal: 3, remaining: 3 });
    expect(result[1]).toEqual({ day: "02.07.", ideal: 0, remaining: 3 });
  });

  it("keeps the single-day timebox at plannedPt (no division by zero)", () => {
    const result = sprintBurndown(
      { storyIds: ["US-1"], startDate: "2026-07-01", endDate: "2026-07-01" },
      [story("US-1", 4)],
      [],
      "2026-07-01",
    );

    expect(result).toEqual([{ day: "01.07.", ideal: 4, remaining: 4 }]);
  });

  it("returns no points without a valid timebox", () => {
    expect(sprintBurndown({ storyIds: ["US-1"] }, stories, [], "2026-07-01")).toEqual(
      [],
    );
    expect(
      sprintBurndown(
        { storyIds: ["US-1"], startDate: "2026-07-05", endDate: "2026-07-01" },
        stories,
        [],
        "2026-07-03",
      ),
    ).toEqual([]);
  });
});
