import { describe, expect, it } from "vitest";

import { buildBoardRows, summarizeBoardRows } from "@/lib/board-rows";
import { DEFAULT_BOARD_COLUMNS } from "@/lib/board";
import type { BoardColumnDef, BoardTask } from "@/types";

function task(overrides: Partial<BoardTask> & { id: string }): BoardTask {
  return {
    title: "Task",
    column: "todo",
    order: 0,
    projectId: "p-1",
    projectName: "Projekt Eins",
    priority: "mittel",
    ...overrides,
  };
}

const rows = (tasks: BoardTask[]) => buildBoardRows(tasks, [], []);

describe("summarizeBoardRows (TASK-063)", () => {
  it("counts rows and sums planned points (missing estimate = 0)", () => {
    const summary = summarizeBoardRows(
      rows([
        task({ id: "t1", estimate_pt: 3 }),
        task({ id: "t2", estimate_pt: 5 }),
        task({ id: "t3" }), // no estimate → contributes 0
      ]),
    );

    expect(summary.count).toBe(3);
    expect(summary.plannedPt).toBe(8);
  });

  it("counts only terminal-phase rows as done PT (consistent with the board)", () => {
    const summary = summarizeBoardRows(
      rows([
        task({ id: "t1", column: "todo", estimate_pt: 3 }),
        task({ id: "t2", column: "done", estimate_pt: 5 }), // terminal
        task({ id: "t3", column: "in_progress", estimate_pt: 2 }),
      ]),
    );

    expect(summary.plannedPt).toBe(10);
    expect(summary.donePt).toBe(5);
  });

  it("returns an all-zero summary for an empty list", () => {
    expect(summarizeBoardRows([])).toEqual({ count: 0, plannedPt: 0, donePt: 0 });
  });

  it("respects custom terminal phases when deciding what counts as done", () => {
    // Mark "review" terminal instead of "done" – done PT follows the phase flag.
    const columns: BoardColumnDef[] = DEFAULT_BOARD_COLUMNS.map((column) => ({
      ...column,
      isTerminal: column.id === "review",
    }));

    const summary = summarizeBoardRows(
      buildBoardRows(
        [
          task({ id: "t1", column: "review", estimate_pt: 4 }),
          task({ id: "t2", column: "done", estimate_pt: 6 }),
        ],
        [],
        [],
        [],
        columns,
      ),
      columns,
    );

    expect(summary.plannedPt).toBe(10);
    expect(summary.donePt).toBe(4);
  });
});
