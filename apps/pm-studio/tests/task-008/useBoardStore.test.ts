import { beforeEach, describe, expect, it } from "vitest";

import { useBoardStore } from "@/store/useBoardStore";
import type { BoardTask } from "@/types";

const base: Omit<BoardTask, "id" | "order" | "column"> = {
  title: "Task",
  projectId: "p-1",
  projectName: "Projekt",
  priority: "mittel",
};

describe("useBoardStore", () => {
  beforeEach(() => {
    useBoardStore.setState({ tasks: [] });
  });

  it("addTask appends to the end of its column", () => {
    const { addTask } = useBoardStore.getState();
    addTask({ id: "1", column: "backlog", ...base });
    addTask({ id: "2", column: "backlog", ...base });

    expect(useBoardStore.getState().tasks.map((t) => [t.id, t.order])).toEqual([
      ["1", 0],
      ["2", 1],
    ]);
  });

  it("moveTask reorders within a column and moves across columns", () => {
    const { addTask, moveTask } = useBoardStore.getState();
    addTask({ id: "1", column: "backlog", ...base });
    addTask({ id: "2", column: "backlog", ...base });
    addTask({ id: "3", column: "todo", ...base });

    // Move "2" in front of "1" within Backlog.
    moveTask("2", "backlog", "1");
    const backlog = useBoardStore
      .getState()
      .tasks.filter((t) => t.column === "backlog")
      .sort((a, b) => a.order - b.order);
    expect(backlog.map((t) => t.id)).toEqual(["2", "1"]);

    // Move "1" to the end of To Do.
    moveTask("1", "todo");
    const tasks = useBoardStore.getState().tasks;
    const todo = tasks.filter((t) => t.column === "todo").sort((a, b) => a.order - b.order);
    expect(todo.map((t) => t.id)).toEqual(["3", "1"]);
    expect(tasks.find((t) => t.id === "1")?.column).toBe("todo");
  });

  it("updateTask patches fields and reassigns order on column change", () => {
    const { addTask, updateTask } = useBoardStore.getState();
    addTask({ id: "1", column: "backlog", ...base });
    addTask({ id: "2", column: "done", ...base });

    updateTask("1", { title: "Renamed", column: "done" });

    const task = useBoardStore.getState().tasks.find((t) => t.id === "1");
    expect(task?.title).toBe("Renamed");
    expect(task?.column).toBe("done");
    expect(task?.order).toBe(1);
  });

  it("hasStoryTask detects tasks created from a backlog story", () => {
    const { addTask, hasStoryTask } = useBoardStore.getState();
    expect(hasStoryTask("US-1")).toBe(false);

    addTask({ id: "1", column: "backlog", storyId: "US-1", ...base });
    expect(hasStoryTask("US-1")).toBe(true);
  });
});
