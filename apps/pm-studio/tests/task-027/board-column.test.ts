import { describe, expect, it } from "vitest";

import {
  DEFAULT_BOARD_COLUMNS,
  columnStatus,
  findColumn,
  isWipExceeded,
  sumEstimatePt,
} from "@/lib/board";
import type { BoardColumnDef, BoardTask } from "@/types";

function task(estimate_pt?: number): Pick<BoardTask, "estimate_pt"> {
  return { estimate_pt };
}

function column(overrides: Partial<BoardColumnDef> = {}): BoardColumnDef {
  return {
    id: "x",
    label: "X",
    status: "idle",
    order: 0,
    isTerminal: false,
    ...overrides,
  };
}

describe("sumEstimatePt (TASK-027)", () => {
  it("sums all estimate points", () => {
    expect(sumEstimatePt([task(2), task(3), task(5)])).toBe(10);
  });

  it("treats missing estimates as zero", () => {
    expect(sumEstimatePt([task(2), task(), task(undefined)])).toBe(2);
  });

  it("returns zero for an empty column", () => {
    expect(sumEstimatePt([])).toBe(0);
  });
});

describe("isWipExceeded (TASK-027/TASK-032)", () => {
  it("is false for columns without a configured limit", () => {
    expect(isWipExceeded(column(), 999)).toBe(false);
  });

  it("is false at or below the configured limit", () => {
    const col = column({ wipLimit: 4 });
    expect(isWipExceeded(col, 4)).toBe(false);
    expect(isWipExceeded(col, 3)).toBe(false);
  });

  it("is true above the configured limit", () => {
    expect(isWipExceeded(column({ wipLimit: 4 }), 5)).toBe(true);
  });
});

describe("DEFAULT_BOARD_COLUMNS (TASK-027/TASK-032)", () => {
  it("provides a status accent for every default board column", () => {
    for (const col of DEFAULT_BOARD_COLUMNS) {
      expect(columnStatus(col.id)).toBeTruthy();
    }
  });

  it("has exactly one terminal phase by default (done)", () => {
    const terminal = DEFAULT_BOARD_COLUMNS.filter((col) => col.isTerminal);
    expect(terminal.map((col) => col.id)).toEqual(["done"]);
  });

  it("finds a column by id and falls back to the defaults", () => {
    expect(findColumn("done")?.label).toBe("Done");
    expect(findColumn("nope")).toBeUndefined();
  });
});
