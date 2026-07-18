import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { DEFAULT_BOARD_COLUMNS } from "@/lib/board";
import { useBoardColumnsStore } from "@/store/useBoardColumnsStore";
import { useBoardStore } from "@/store/useBoardStore";
import type { BoardColumnDef, BoardTask } from "@/types";

const base: Omit<BoardTask, "id" | "order" | "column"> = {
  title: "Task",
  projectId: "p-1",
  projectName: "Projekt",
  priority: "mittel",
};

/** Custom phases: "review" is terminal, the default "done" id is not. */
const customColumns: BoardColumnDef[] = [
  { id: "todo", label: "To Do", status: "idle", order: 0, isTerminal: false },
  { id: "review", label: "Review", status: "success", order: 1, isTerminal: true },
  { id: "done", label: "Done", status: "info", order: 2, isTerminal: false },
];

const taskById = (id: string) =>
  useBoardStore.getState().tasks.find((task) => task.id === id)!;

describe("useBoardStore doneAt follows isTerminal (TASK-032b)", () => {
  beforeEach(() => {
    useBoardStore.setState({ tasks: [] });
    useBoardColumnsStore.setState({ columns: customColumns });
  });

  afterEach(() => {
    useBoardColumnsStore.setState({ columns: DEFAULT_BOARD_COLUMNS });
  });

  it("stamps doneAt when a task enters a terminal phase (not the literal 'done')", () => {
    const { addTask } = useBoardStore.getState();
    addTask({ id: "t1", column: "review", ...base });
    addTask({ id: "t2", column: "done", ...base });

    expect(taskById("t1").doneAt).toBeTruthy(); // review is terminal
    expect(taskById("t2").doneAt).toBeUndefined(); // done is not terminal here
  });

  it("clears doneAt when a task leaves the terminal phase", () => {
    useBoardStore.getState().addTask({ id: "t1", column: "review", ...base });
    expect(taskById("t1").doneAt).toBeTruthy();

    useBoardStore.getState().moveTask("t1", "todo");
    expect(taskById("t1").doneAt).toBeUndefined();
  });

  it("keeps the original timestamp when reordering within the terminal phase", () => {
    useBoardStore.getState().addTask({ id: "t1", column: "review", ...base });
    useBoardStore.getState().addTask({ id: "t2", column: "review", ...base });
    const stamp = taskById("t1").doneAt;

    useBoardStore.getState().moveTask("t1", "review", "t2");
    expect(taskById("t1").doneAt).toBe(stamp);
  });
});
