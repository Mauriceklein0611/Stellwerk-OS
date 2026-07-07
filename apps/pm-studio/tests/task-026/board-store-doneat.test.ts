import { beforeEach, describe, expect, it } from "vitest";

import { useBoardStore } from "@/store/useBoardStore";
import type { BoardTask } from "@/types";

function baseTask(id: string, column: BoardTask["column"]): Omit<BoardTask, "order"> {
  return {
    id,
    title: id,
    column,
    projectId: "p-1",
    projectName: "p-1",
    priority: "mittel",
  };
}

beforeEach(() => {
  useBoardStore.setState({ tasks: [] });
});

describe("useBoardStore doneAt (TASK-026)", () => {
  it("stamps doneAt when a task is added directly to done", () => {
    useBoardStore.getState().addTask(baseTask("T-1", "done"));
    const task = useBoardStore.getState().tasks.find((t) => t.id === "T-1");
    expect(task?.doneAt).toBeTruthy();
  });

  it("does not stamp doneAt for tasks added to other columns", () => {
    useBoardStore.getState().addTask(baseTask("T-1", "todo"));
    expect(useBoardStore.getState().tasks[0].doneAt).toBeUndefined();
  });

  it("sets doneAt on move into done and clears it on move back out", () => {
    const store = useBoardStore.getState();
    store.addTask(baseTask("T-1", "in_progress"));

    store.moveTask("T-1", "done");
    expect(
      useBoardStore.getState().tasks.find((t) => t.id === "T-1")?.doneAt,
    ).toBeTruthy();

    store.moveTask("T-1", "in_progress");
    expect(
      useBoardStore.getState().tasks.find((t) => t.id === "T-1")?.doneAt,
    ).toBeUndefined();
  });

  it("keeps the original doneAt when reordering within done", () => {
    const store = useBoardStore.getState();
    store.addTask(baseTask("T-1", "done"));
    store.addTask(baseTask("T-2", "done"));
    const before = useBoardStore.getState().tasks.find((t) => t.id === "T-1")?.doneAt;

    // Reorder T-1 before T-2 – still inside done.
    store.moveTask("T-1", "done", "T-2");
    const after = useBoardStore.getState().tasks.find((t) => t.id === "T-1")?.doneAt;
    expect(after).toBe(before);
  });

  it("syncs doneAt through updateTask column changes", () => {
    const store = useBoardStore.getState();
    store.addTask(baseTask("T-1", "review"));

    store.updateTask("T-1", { column: "done" });
    expect(
      useBoardStore.getState().tasks.find((t) => t.id === "T-1")?.doneAt,
    ).toBeTruthy();

    store.updateTask("T-1", { column: "testing" });
    expect(
      useBoardStore.getState().tasks.find((t) => t.id === "T-1")?.doneAt,
    ).toBeUndefined();
  });
});
