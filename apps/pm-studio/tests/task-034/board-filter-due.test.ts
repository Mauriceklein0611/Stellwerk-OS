import { describe, expect, it } from "vitest";

import {
  ALL,
  OVERDUE,
  emptyBoardFilter,
  filterBoardTasks,
  isBoardFilterActive,
  type BoardFilter,
} from "@/lib/board-filters";
import type { BoardTask, PlannedSprint } from "@/types";

const TODAY = "2026-06-16";

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

const sprints: Pick<PlannedSprint, "id" | "storyIds">[] = [];

const tasks: BoardTask[] = [
  task({ id: "past-open", dueDate: "2026-06-10" }),
  task({ id: "today-open", dueDate: TODAY }),
  task({ id: "future-open", dueDate: "2026-06-20" }),
  task({ id: "past-done", dueDate: "2026-06-10", column: "done" }),
  task({ id: "no-due" }),
];

function filter(overrides: Partial<BoardFilter>): BoardFilter {
  return { ...emptyBoardFilter, ...overrides };
}

describe("filterBoardTasks – overdue filter (TASK-034)", () => {
  it("keeps only overdue (past + open) tasks when OVERDUE is set", () => {
    const result = filterBoardTasks(
      tasks,
      filter({ due: OVERDUE }),
      sprints,
      TODAY,
    ).map((t) => t.id);
    expect(result).toEqual(["past-open"]);
  });

  it("does not constrain when due is ALL", () => {
    expect(
      filterBoardTasks(tasks, filter({ due: ALL }), sprints, TODAY),
    ).toHaveLength(tasks.length);
  });

  it("skips the constraint when no today reference is given", () => {
    expect(
      filterBoardTasks(tasks, filter({ due: OVERDUE }), sprints),
    ).toHaveLength(tasks.length);
  });

  it("counts the due filter as active", () => {
    expect(isBoardFilterActive(filter({ due: OVERDUE }))).toBe(true);
    expect(isBoardFilterActive(emptyBoardFilter)).toBe(false);
  });
});
