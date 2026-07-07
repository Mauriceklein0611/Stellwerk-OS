import { beforeEach, describe, expect, it } from "vitest";

import { DEFAULT_BOARD_COLUMNS } from "@/lib/board";
import { useBoardColumnsStore } from "@/store/useBoardColumnsStore";

/**
 * The "+ Spalte" tile (TASK-051) calls `addColumn({ label })` with no status or
 * terminal flag. Assert that exact contract: a new phase lands at the very end
 * (right of the last column) and is non-terminal, so done-semantics are not
 * affected. The broader addColumn behaviour is covered in tests/task-032.
 */
describe("AddColumnTile → addColumn defaults (TASK-051)", () => {
  beforeEach(() => {
    useBoardColumnsStore.setState({ columns: DEFAULT_BOARD_COLUMNS });
  });

  it("appends a non-terminal phase at the end with label only", () => {
    useBoardColumnsStore.getState().addColumn({ label: "  Review 2  " });

    const columns = useBoardColumnsStore.getState().columns;
    const added = columns[columns.length - 1];
    expect(columns).toHaveLength(DEFAULT_BOARD_COLUMNS.length + 1);
    expect(added.label).toBe("Review 2");
    expect(added.isTerminal).toBe(false);
    expect(added.order).toBe(columns.length - 1);
  });

  it("ignores an empty/whitespace label (tile guards too, store is the backstop)", () => {
    useBoardColumnsStore.getState().addColumn({ label: "   " });

    expect(useBoardColumnsStore.getState().columns).toHaveLength(
      DEFAULT_BOARD_COLUMNS.length,
    );
  });
});
