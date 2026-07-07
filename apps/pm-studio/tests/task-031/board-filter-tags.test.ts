import { describe, expect, it } from "vitest";

import {
  ALL,
  emptyBoardFilter,
  filterBoardTasks,
  isBoardFilterActive,
  type BoardFilter,
} from "@/lib/board-filters";
import type { BoardTask, PlannedSprint } from "@/types";

const base: Omit<BoardTask, "id" | "tagIds"> = {
  title: "Task",
  column: "todo",
  order: 0,
  projectId: "p-1",
  projectName: "Projekt",
  priority: "mittel",
};

const tasks: BoardTask[] = [
  { id: "t1", tagIds: ["tag-fe"], ...base },
  { id: "t2", tagIds: ["tag-bug", "tag-fe"], ...base },
  { id: "t3", ...base }, // no tags
];

const sprints: Pick<PlannedSprint, "id" | "storyIds">[] = [];

function filter(overrides: Partial<BoardFilter>): BoardFilter {
  return { ...emptyBoardFilter, ...overrides };
}

describe("board tag filter (TASK-031)", () => {
  it("treats ALL as no constraint", () => {
    expect(filterBoardTasks(tasks, emptyBoardFilter, sprints)).toHaveLength(3);
    expect(emptyBoardFilter.tagId).toBe(ALL);
  });

  it("keeps only tasks carrying the selected tag", () => {
    expect(
      filterBoardTasks(tasks, filter({ tagId: "tag-fe" }), sprints).map((t) => t.id),
    ).toEqual(["t1", "t2"]);

    expect(
      filterBoardTasks(tasks, filter({ tagId: "tag-bug" }), sprints).map((t) => t.id),
    ).toEqual(["t2"]);
  });

  it("counts the tag filter as active", () => {
    expect(isBoardFilterActive(filter({ tagId: "tag-fe" }))).toBe(true);
  });
});
