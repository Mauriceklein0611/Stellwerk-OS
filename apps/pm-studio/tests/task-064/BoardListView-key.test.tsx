import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BoardListView } from "@/components/board/BoardListView";
import { DEFAULT_BOARD_COLUMNS } from "@/lib/board";
import { buildBoardRows } from "@/lib/board-rows";
import type { BoardTask } from "@/types";

/**
 * TASK-064: the list view's first column shows the readable item key (falling
 * back to the short id until the key is backfilled).
 */

function task(id: string): BoardTask {
  return {
    id,
    title: `Task ${id}`,
    column: "todo",
    order: 0,
    projectId: "p1",
    projectName: "Apollo",
    priority: "mittel",
  };
}

function setup(keys: Record<string, string>) {
  const rows = buildBoardRows([task("t1")], [], [], [], DEFAULT_BOARD_COLUMNS, keys);
  render(
    <BoardListView
      rows={rows}
      columns={DEFAULT_BOARD_COLUMNS}
      onRowClick={vi.fn()}
      onUpdateTask={vi.fn()}
      onAssignSprint={vi.fn()}
      persons={[]}
      sprints={[]}
      today="2026-07-06"
    />,
  );
}

describe("BoardListView key column (TASK-064)", () => {
  it("shows the readable key when present", () => {
    setup({ t1: "APO-7" });
    expect(screen.getByText("APO-7")).toBeInTheDocument();
    expect(screen.getByText("Key")).toBeInTheDocument();
  });

  it("falls back to the short id when no key exists yet", () => {
    setup({});
    // shortId = first 8 chars of the task id (no storyId).
    expect(screen.getByText("t1")).toBeInTheDocument();
  });
});
