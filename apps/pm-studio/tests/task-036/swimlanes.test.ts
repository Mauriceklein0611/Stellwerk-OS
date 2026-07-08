import { describe, expect, it } from "vitest";

import {
  UNGROUPED_LANE,
  buildSwimlanes,
  laneReassignment,
  type SwimlaneRefs,
} from "@/lib/swimlanes";
import type { BoardTask } from "@/types";

const base: Omit<BoardTask, "id" | "column"> = {
  title: "Task",
  order: 0,
  projectId: "p-1",
  projectName: "Projekt",
  priority: "mittel",
};

function task(id: string, patch: Partial<BoardTask> = {}): BoardTask {
  return { ...base, id, column: "todo", ...patch };
}

const refs: SwimlaneRefs = {
  persons: [
    { id: "u-1", name: "Alice" },
    { id: "u-2", name: "Bob" },
  ],
  sprints: [
    { id: "s-1", name: "Sprint 1", storyIds: ["story-a"] },
    { id: "s-2", name: "Sprint 2", storyIds: ["story-b"] },
  ],
  tags: [
    { id: "t-1", name: "Frontend" },
    { id: "t-2", name: "Backend" },
  ],
};

describe("buildSwimlanes", () => {
  it("returns a single lane with all tasks for mode 'none'", () => {
    const tasks = [task("1"), task("2")];
    const lanes = buildSwimlanes(tasks, "none", refs);

    expect(lanes).toHaveLength(1);
    expect(lanes[0].id).toBe(UNGROUPED_LANE);
    expect(lanes[0].tasks).toHaveLength(2);
  });

  it("groups by assignee in ref order with an 'unassigned' lane last", () => {
    const tasks = [
      task("1", { assigneeId: "u-2" }),
      task("2", { assigneeId: "u-1" }),
      task("3"), // no assignee → ungrouped
    ];
    const lanes = buildSwimlanes(tasks, "assignee", refs);

    expect(lanes.map((lane) => lane.id)).toEqual(["u-1", "u-2", UNGROUPED_LANE]);
    expect(lanes[0].label).toBe("Alice");
    expect(lanes[2].label).toBe("Nicht zugewiesen");
    expect(lanes[2].tasks.map((t) => t.id)).toEqual(["3"]);
  });

  it("omits lanes for entities without tasks (no empty lanes)", () => {
    const tasks = [task("1", { assigneeId: "u-2" })];
    const lanes = buildSwimlanes(tasks, "assignee", refs);

    expect(lanes.map((lane) => lane.id)).toEqual(["u-2"]);
  });

  it("groups by sprint via the task's storyId; tasks without a story are ungrouped", () => {
    const tasks = [
      task("1", { storyId: "story-b" }), // → s-2
      task("2", { storyId: "story-a" }), // → s-1
      task("3", { storyId: "story-x" }), // story not in any sprint → ungrouped
      task("4"), // no storyId → ungrouped
    ];
    const lanes = buildSwimlanes(tasks, "sprint", refs);

    expect(lanes.map((lane) => lane.id)).toEqual(["s-1", "s-2", UNGROUPED_LANE]);
    expect(lanes[0].tasks.map((t) => t.id)).toEqual(["2"]);
    expect(lanes[2].label).toBe("Ohne Sprint");
    expect(lanes[2].tasks.map((t) => t.id)).toEqual(["3", "4"]);
  });

  it("groups by the primary (first) tag so each task lands in one lane", () => {
    const tasks = [
      task("1", { tagIds: ["t-2", "t-1"] }), // primary = t-2
      task("2", { tagIds: ["t-1"] }),
      task("3", { tagIds: [] }), // empty → ungrouped
      task("4"), // undefined → ungrouped
    ];
    const lanes = buildSwimlanes(tasks, "tag", refs);

    expect(lanes.map((lane) => lane.id)).toEqual(["t-1", "t-2", UNGROUPED_LANE]);
    expect(lanes[0].tasks.map((t) => t.id)).toEqual(["2"]);
    expect(lanes[1].tasks.map((t) => t.id)).toEqual(["1"]);
    expect(lanes[2].label).toBe("Ohne Tag");
    expect(lanes[2].tasks.map((t) => t.id)).toEqual(["3", "4"]);
  });
});

describe("laneReassignment", () => {
  it("maps assignee lanes to an assigneeId (ungrouped → undefined)", () => {
    expect(laneReassignment("assignee", "u-1")).toEqual({
      kind: "assignee",
      assigneeId: "u-1",
    });
    expect(laneReassignment("assignee", UNGROUPED_LANE)).toEqual({
      kind: "assignee",
      assigneeId: undefined,
    });
  });

  it("maps sprint lanes to a sprintId (ungrouped → null)", () => {
    expect(laneReassignment("sprint", "s-1")).toEqual({
      kind: "sprint",
      sprintId: "s-1",
    });
    expect(laneReassignment("sprint", UNGROUPED_LANE)).toEqual({
      kind: "sprint",
      sprintId: null,
    });
  });

  it("does not reassign for tag or none (column-only drag)", () => {
    expect(laneReassignment("tag", "t-1")).toEqual({ kind: "none" });
    expect(laneReassignment("none", UNGROUPED_LANE)).toEqual({ kind: "none" });
  });
});
