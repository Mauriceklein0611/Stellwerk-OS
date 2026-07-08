import { describe, expect, it } from "vitest";

import {
  ALL,
  DONE,
  NO_SPRINT,
  OPEN,
  UNASSIGNED,
  emptyBoardFilter,
  filterBoardTasks,
  isBoardFilterActive,
  isSprintViewFilterActive,
  sprintStatusMatches,
  storyMatchesFilter,
  type BoardFilter,
  type SprintViewFilter,
} from "@/lib/board-filters";
import type { BoardTask, PlannedSprint, UserStory } from "@/types";

function task(overrides: Partial<BoardTask> & { id: string }): BoardTask {
  return {
    title: overrides.id,
    column: "todo",
    order: 0,
    projectId: "p-1",
    projectName: "p-1",
    priority: "mittel",
    ...overrides,
  };
}

function story(id: string): UserStory {
  return { id, epicId: "E-1", projectId: "p1", title: id, acceptance_criteria: [], estimate_pt: 3, priority: "mittel", rank: 0, provenance: "agent" };
}

const sprints: Pick<PlannedSprint, "id" | "storyIds">[] = [
  { id: "sp1", storyIds: ["US-1"] },
  { id: "sp2", storyIds: ["US-2"] },
];

const tasks: BoardTask[] = [
  task({ id: "t1", projectId: "p-1", column: "todo", priority: "hoch", storyId: "US-1", assigneeId: "u1" }),
  task({ id: "t2", projectId: "p-1", column: "done", priority: "mittel", storyId: "US-2" }),
  task({ id: "t3", projectId: "p-2", column: "todo", priority: "niedrig" }),
];

function filter(overrides: Partial<BoardFilter>): BoardFilter {
  return { ...emptyBoardFilter, ...overrides };
}

describe("isBoardFilterActive", () => {
  it("is false for the empty filter and true once a criterion is set", () => {
    expect(isBoardFilterActive(emptyBoardFilter)).toBe(false);
    expect(isBoardFilterActive(filter({ priority: "hoch" }))).toBe(true);
  });
});

describe("filterBoardTasks", () => {
  it("returns everything for the empty filter", () => {
    expect(filterBoardTasks(tasks, emptyBoardFilter, sprints)).toHaveLength(3);
  });

  it("filters by project", () => {
    const result = filterBoardTasks(tasks, filter({ projectId: "p-2" }), sprints);
    expect(result.map((t) => t.id)).toEqual(["t3"]);
  });

  it("filters by sprint and by 'no sprint'", () => {
    expect(
      filterBoardTasks(tasks, filter({ sprintId: "sp1" }), sprints).map((t) => t.id),
    ).toEqual(["t1"]);
    expect(
      filterBoardTasks(tasks, filter({ sprintId: NO_SPRINT }), sprints).map((t) => t.id),
    ).toEqual(["t3"]);
  });

  it("filters by assignee and by 'unassigned'", () => {
    expect(
      filterBoardTasks(tasks, filter({ assigneeId: "u1" }), sprints).map((t) => t.id),
    ).toEqual(["t1"]);
    expect(
      filterBoardTasks(tasks, filter({ assigneeId: UNASSIGNED }), sprints).map((t) => t.id),
    ).toEqual(["t2", "t3"]);
  });

  it("combines filters with AND (sprint + priority)", () => {
    expect(
      filterBoardTasks(tasks, filter({ sprintId: "sp1", priority: "hoch" }), sprints),
    ).toHaveLength(1);
    expect(
      filterBoardTasks(tasks, filter({ sprintId: "sp1", priority: "niedrig" }), sprints),
    ).toHaveLength(0);
  });

  it("filters by column", () => {
    expect(
      filterBoardTasks(tasks, filter({ column: "done" }), sprints).map((t) => t.id),
    ).toEqual(["t2"]);
  });
});

describe("sprint-view filters", () => {
  const stories = [story("US-1"), story("US-2")];
  const boardTasks: BoardTask[] = [
    task({ id: "t1", storyId: "US-1", assigneeId: "u1", column: "done" }),
    task({ id: "t2", storyId: "US-2", column: "todo" }),
  ];

  function viewFilter(overrides: Partial<SprintViewFilter>): SprintViewFilter {
    return { assigneeId: ALL, sprintStatus: ALL, done: ALL, ...overrides };
  }

  it("isSprintViewFilterActive reflects any set criterion", () => {
    expect(isSprintViewFilterActive(viewFilter({}))).toBe(false);
    expect(isSprintViewFilterActive(viewFilter({ done: DONE }))).toBe(true);
  });

  it("sprintStatusMatches respects the status filter", () => {
    expect(sprintStatusMatches("active", viewFilter({}))).toBe(true);
    expect(sprintStatusMatches("active", viewFilter({ sprintStatus: "active" }))).toBe(true);
    expect(sprintStatusMatches("planned", viewFilter({ sprintStatus: "active" }))).toBe(false);
  });

  it("storyMatchesFilter filters by assignee", () => {
    expect(storyMatchesFilter(stories[0], viewFilter({ assigneeId: "u1" }), boardTasks)).toBe(true);
    expect(storyMatchesFilter(stories[1], viewFilter({ assigneeId: "u1" }), boardTasks)).toBe(false);
    expect(storyMatchesFilter(stories[1], viewFilter({ assigneeId: UNASSIGNED }), boardTasks)).toBe(true);
  });

  it("storyMatchesFilter filters by done/open", () => {
    expect(storyMatchesFilter(stories[0], viewFilter({ done: DONE }), boardTasks)).toBe(true);
    expect(storyMatchesFilter(stories[0], viewFilter({ done: OPEN }), boardTasks)).toBe(false);
    expect(storyMatchesFilter(stories[1], viewFilter({ done: OPEN }), boardTasks)).toBe(true);
  });
});
