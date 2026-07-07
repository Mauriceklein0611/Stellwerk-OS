import { describe, expect, it } from "vitest";

import {
  filterMyWork,
  isTaskOpen,
  isTaskOverdue,
  myWorkCounts,
  resolveMyWorkPersonId,
  tasksForPerson,
} from "@/lib/my-work";
import type { BoardTask, Person } from "@/types";

/**
 * TASK-042: My Work selectors. Pure functions over one person's board tasks.
 * "Done" follows the configurable terminal phases (default `done`) and
 * "overdue" reuses src/lib/due.ts – no second logic is asserted here.
 */

const TODAY = "2026-06-17";

function task(patch: Partial<BoardTask> & { id: string }): BoardTask {
  return {
    title: patch.id,
    column: "todo",
    order: 0,
    projectId: "p1",
    projectName: "P1",
    priority: "mittel",
    ...patch,
  };
}

function person(id: string, name = id): Person {
  return { id, name, role: "Dev", capacityPtPerSprint: 10 };
}

describe("tasksForPerson", () => {
  const tasks = [
    task({ id: "a", assigneeId: "p1" }),
    task({ id: "b", assigneeId: "p2" }),
    task({ id: "c" }), // unassigned
    task({ id: "d", assigneeId: "p1" }),
  ];

  it("returns only the person's tasks", () => {
    expect(tasksForPerson(tasks, "p1").map((t) => t.id)).toEqual(["a", "d"]);
  });

  it("returns [] for an empty person id", () => {
    expect(tasksForPerson(tasks, "")).toEqual([]);
  });
});

describe("isTaskOpen / isTaskOverdue", () => {
  it("treats a terminal-phase task as not open and never overdue", () => {
    const done = task({ id: "x", column: "done", dueDate: "2000-01-01" });
    expect(isTaskOpen(done)).toBe(false);
    expect(isTaskOverdue(done, TODAY)).toBe(false);
  });

  it("flags a past-due open task as overdue", () => {
    const t = task({ id: "y", column: "todo", dueDate: "2020-01-01" });
    expect(isTaskOpen(t)).toBe(true);
    expect(isTaskOverdue(t, TODAY)).toBe(true);
  });

  it("does not flag a future-due task", () => {
    const t = task({ id: "z", dueDate: "2999-12-31" });
    expect(isTaskOverdue(t, TODAY)).toBe(false);
  });

  it("honours custom terminal columns", () => {
    const t = task({ id: "s", column: "shipped", dueDate: "2000-01-01" });
    // Default terminal id is "done" → still open & overdue.
    expect(isTaskOpen(t)).toBe(true);
    expect(isTaskOverdue(t, TODAY)).toBe(true);
    // With "shipped" terminal → done, not overdue.
    const terminal = new Set(["shipped"]);
    expect(isTaskOpen(t, terminal)).toBe(false);
    expect(isTaskOverdue(t, TODAY, terminal)).toBe(false);
  });
});

describe("myWorkCounts", () => {
  const personTasks = [
    task({ id: "a", column: "todo", dueDate: "2020-01-01" }), // open + overdue
    task({ id: "b", column: "in_progress" }), // open
    task({ id: "c", column: "done", dueDate: "2020-01-01" }), // closed
  ];

  it("counts assigned/open/overdue", () => {
    expect(myWorkCounts(personTasks, TODAY)).toEqual({
      assigned: 3,
      open: 2,
      overdue: 1,
    });
  });

  it("yields 0 overdue without a today reference", () => {
    expect(myWorkCounts(personTasks, "").overdue).toBe(0);
  });
});

describe("filterMyWork", () => {
  const personTasks = [
    task({ id: "a", column: "todo", dueDate: "2020-01-01" }), // open + overdue
    task({ id: "b", column: "in_progress" }), // open
    task({ id: "c", column: "done" }), // closed
  ];

  it("assigned returns all of the person's tasks", () => {
    expect(filterMyWork(personTasks, "assigned", TODAY).map((t) => t.id)).toEqual(
      ["a", "b", "c"],
    );
  });

  it("open drops terminal-phase tasks", () => {
    expect(filterMyWork(personTasks, "open", TODAY).map((t) => t.id)).toEqual([
      "a",
      "b",
    ]);
  });

  it("overdue keeps only past-due open tasks", () => {
    expect(filterMyWork(personTasks, "overdue", TODAY).map((t) => t.id)).toEqual(
      ["a"],
    );
  });

  it("overdue is empty without a today reference", () => {
    expect(filterMyWork(personTasks, "overdue", "")).toEqual([]);
  });
});

describe("resolveMyWorkPersonId", () => {
  const persons = [person("p1"), person("p2")];

  it("keeps a valid preferred id (the future logged-in user)", () => {
    expect(resolveMyWorkPersonId("p2", persons)).toBe("p2");
  });

  it("falls back to the first person for an unknown/empty id", () => {
    expect(resolveMyWorkPersonId(undefined, persons)).toBe("p1");
    expect(resolveMyWorkPersonId("ghost", persons)).toBe("p1");
  });

  it("returns undefined when there are no people", () => {
    expect(resolveMyWorkPersonId("p1", [])).toBeUndefined();
  });
});
