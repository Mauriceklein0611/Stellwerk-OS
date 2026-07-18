import { DndContext } from "@dnd-kit/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BoardSwimlanes } from "@/components/board/BoardSwimlanes";
import { DEFAULT_BOARD_COLUMNS } from "@/lib/board";
import { UNGROUPED_LANE, buildSwimlanes } from "@/lib/swimlanes";
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

const refs = {
  persons: [{ id: "u-1", name: "Alice" }],
  sprints: [],
  tags: [],
};

function renderSwimlanes(tasks: BoardTask[]) {
  const lanes = buildSwimlanes(tasks, "assignee", refs);
  return render(
    <DndContext>
      <BoardSwimlanes
        lanes={lanes}
        columns={DEFAULT_BOARD_COLUMNS}
        onTaskClick={() => {}}
        today="2026-06-16"
      />
    </DndContext>,
  );
}

describe("BoardSwimlanes (TASK-036)", () => {
  it("renders one lane per group with a label and namespaced columns", () => {
    renderSwimlanes([
      task("1", { assigneeId: "u-1" }),
      task("2"), // ungrouped
    ]);

    expect(
      screen.getByRole("heading", { name: "Alice", level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Nicht zugewiesen", level: 2 }),
    ).toBeInTheDocument();

    // Columns are namespaced per lane so the repeated phase stays unique.
    expect(screen.getByTestId("board-column-u-1-todo")).toBeInTheDocument();
    expect(
      screen.getByTestId(`board-column-${UNGROUPED_LANE}-todo`),
    ).toBeInTheDocument();
  });

  it("counts only the lane's tasks per lane", () => {
    renderSwimlanes([
      task("1", { assigneeId: "u-1" }),
      task("2", { assigneeId: "u-1" }),
      task("3"),
    ]);

    expect(screen.getByTestId("swimlane-u-1-count").textContent).toBe("2");
    expect(
      screen.getByTestId(`swimlane-${UNGROUPED_LANE}-count`).textContent,
    ).toBe("1");
  });

  it("shows an empty hint when there are no lanes", () => {
    render(
      <DndContext>
        <BoardSwimlanes
          lanes={[]}
          columns={DEFAULT_BOARD_COLUMNS}
          onTaskClick={() => {}}
          today="2026-06-16"
        />
      </DndContext>,
    );

    expect(screen.getByText("Keine Tasks zum Gruppieren.")).toBeInTheDocument();
  });
});
