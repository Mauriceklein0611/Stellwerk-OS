import { beforeEach, describe, expect, it } from "vitest";

import { DEFAULT_BOARD_COLUMNS } from "@/lib/board";
import { useBoardColumnsStore } from "@/store/useBoardColumnsStore";
import { useBoardStore } from "@/store/useBoardStore";
import type { BoardTask } from "@/types";

const ids = () => useBoardColumnsStore.getState().columns.map((c) => c.id);
const orders = () => useBoardColumnsStore.getState().columns.map((c) => c.order);

const baseTask: Omit<BoardTask, "id" | "order" | "column"> = {
  title: "Task",
  projectId: "p-1",
  projectName: "Projekt",
  priority: "mittel",
};

describe("useBoardColumnsStore (TASK-032)", () => {
  beforeEach(() => {
    useBoardColumnsStore.setState({ columns: DEFAULT_BOARD_COLUMNS });
    useBoardStore.setState({ tasks: [] });
  });

  it("starts from the default phases", () => {
    expect(ids()).toEqual(["backlog", "todo", "in_progress", "review", "testing", "done"]);
  });

  it("addColumn appends a phase and ignores empty labels", () => {
    const { addColumn } = useBoardColumnsStore.getState();
    addColumn({ label: "  QA  ", status: "info" });
    addColumn({ label: "   " });

    const columns = useBoardColumnsStore.getState().columns;
    const added = columns[columns.length - 1];
    expect(columns).toHaveLength(DEFAULT_BOARD_COLUMNS.length + 1);
    expect(added.label).toBe("QA");
    expect(added.status).toBe("info");
    expect(added.isTerminal).toBe(false);
    expect(added.order).toBe(columns.length - 1);
  });

  it("renames, recolors and sets/clears the WIP limit", () => {
    const { renameColumn, setColumnStatus, setColumnWip } = useBoardColumnsStore.getState();
    renameColumn("todo", "Aufgaben");
    setColumnStatus("todo", "warning");
    setColumnWip("todo", 3);

    let todo = useBoardColumnsStore.getState().columns.find((c) => c.id === "todo")!;
    expect(todo).toMatchObject({ label: "Aufgaben", status: "warning", wipLimit: 3 });

    setColumnWip("todo", undefined);
    todo = useBoardColumnsStore.getState().columns.find((c) => c.id === "todo")!;
    expect(todo.wipLimit).toBeUndefined();
  });

  it("reorders phases and re-sequences order", () => {
    const { reorderColumns } = useBoardColumnsStore.getState();
    reorderColumns(["done", "todo", "backlog", "in_progress", "review", "testing"]);

    expect(ids()).toEqual(["done", "todo", "backlog", "in_progress", "review", "testing"]);
    expect(orders()).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("keeps phases missing from a reorder sequence at the end", () => {
    const { reorderColumns } = useBoardColumnsStore.getState();
    reorderColumns(["todo", "backlog"]);
    expect(ids().slice(0, 2)).toEqual(["todo", "backlog"]);
    expect(ids()).toHaveLength(DEFAULT_BOARD_COLUMNS.length);
  });

  it("setColumnTerminal refuses to turn off the last terminal phase", () => {
    const { setColumnTerminal } = useBoardColumnsStore.getState();
    setColumnTerminal("done", false);
    const done = useBoardColumnsStore.getState().columns.find((c) => c.id === "done")!;
    expect(done.isTerminal).toBe(true);
  });

  it("setColumnTerminal allows turning off once another terminal exists", () => {
    const { setColumnTerminal } = useBoardColumnsStore.getState();
    setColumnTerminal("testing", true);
    setColumnTerminal("done", false);

    const byId = new Map(useBoardColumnsStore.getState().columns.map((c) => [c.id, c]));
    expect(byId.get("testing")!.isTerminal).toBe(true);
    expect(byId.get("done")!.isTerminal).toBe(false);
  });

  it("removeColumn moves the phase's tasks to the fallback and re-sequences", () => {
    useBoardStore.getState().addTask({ id: "t1", column: "review", ...baseTask });
    useBoardStore.getState().addTask({ id: "t2", column: "todo", ...baseTask });

    useBoardColumnsStore.getState().removeColumn("review", "todo");

    expect(ids()).not.toContain("review");
    expect(orders()).toEqual([0, 1, 2, 3, 4]);
    const moved = useBoardStore.getState().tasks.find((t) => t.id === "t1")!;
    expect(moved.column).toBe("todo");
  });

  it("removeColumn refuses to delete the last terminal phase (tasks untouched)", () => {
    useBoardStore.getState().addTask({ id: "d1", column: "done", ...baseTask });
    useBoardColumnsStore.getState().removeColumn("done", "todo");

    expect(ids()).toContain("done");
    expect(useBoardStore.getState().tasks.find((t) => t.id === "d1")!.column).toBe("done");
  });

  it("removeColumn is a no-op when the fallback equals the target", () => {
    useBoardColumnsStore.getState().removeColumn("todo", "todo");
    expect(ids()).toContain("todo");
  });
});
