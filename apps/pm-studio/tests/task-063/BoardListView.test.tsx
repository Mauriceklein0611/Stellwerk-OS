import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { BoardListView } from "@/components/board/BoardListView";
import { DEFAULT_BOARD_COLUMNS } from "@/lib/board";
import { buildBoardRows } from "@/lib/board-rows";
import { buildSwimlanes } from "@/lib/swimlanes";
import type { BoardTask, Person } from "@/types";

const persons: Person[] = [
  { id: "u1", name: "Lena Schmidt", role: "Dev", capacityPtPerSprint: 10 },
];

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

const tasks: BoardTask[] = [
  task({ id: "t1", title: "Login", assigneeId: "u1", column: "todo", estimate_pt: 3 }),
  task({ id: "t2", title: "Logout", assigneeId: "u1", column: "done", estimate_pt: 5 }),
  task({ id: "t3", title: "Waise", column: "todo", estimate_pt: 2 }),
];

function setup(groupBy: "none" | "assignee") {
  const onRowClick = vi.fn();
  const onUpdateTask = vi.fn();
  const onAssignSprint = vi.fn();
  const rows = buildBoardRows(tasks, persons, []);
  const lanes = buildSwimlanes(tasks, groupBy, {
    persons,
    sprints: [],
    tags: [],
  });
  render(
    <BoardListView
      rows={rows}
      columns={DEFAULT_BOARD_COLUMNS}
      lanes={lanes}
      groupBy={groupBy}
      onRowClick={onRowClick}
      onUpdateTask={onUpdateTask}
      onAssignSprint={onAssignSprint}
      persons={persons}
      sprints={[]}
      today="2026-07-06"
    />,
  );
  return { onRowClick, onUpdateTask, onAssignSprint };
}

describe("BoardListView grouping & footer (TASK-063)", () => {
  it("shows a global footer with count and planned/done PT", () => {
    setup("none");
    const footer = screen.getByTestId("board-list-footer");
    expect(within(footer).getByText("3")).toBeInTheDocument();
    expect(within(footer).getByText("Tasks")).toBeInTheDocument();
    // Σ planned 3+5+2 = 10, Σ done (terminal "done" only) = 5.
    expect(within(footer).getByText("10 PT")).toBeInTheDocument();
    expect(within(footer).getByText("5 PT")).toBeInTheDocument();
  });

  it("renders no group headers in flat mode", () => {
    setup("none");
    expect(screen.queryByTestId("board-group-u1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("board-group-__ungrouped__")).not.toBeInTheDocument();
  });

  it("renders one section per swimlane with a subtotal in the header", () => {
    setup("assignee");

    const assigned = screen.getByTestId("board-group-u1");
    expect(within(assigned).getByText("Lena Schmidt")).toBeInTheDocument();
    // Lane u1: 2 tasks, planned 8, done 5.
    expect(within(assigned).getByText("2")).toBeInTheDocument();
    expect(within(assigned).getByText("8 PT")).toBeInTheDocument();
    expect(within(assigned).getByText("5 PT")).toBeInTheDocument();

    const ungrouped = screen.getByTestId("board-group-__ungrouped__");
    expect(within(ungrouped).getByText("Nicht zugewiesen")).toBeInTheDocument();
    // Lane ungrouped: 1 task, planned 2, done 0.
    expect(within(ungrouped).getByText("1")).toBeInTheDocument();
  });

  it("places the 'ohne Zuordnung' lane last", () => {
    setup("assignee");
    const groups = screen.getAllByTestId(/^board-group-/);
    expect(groups[0]).toHaveAttribute("data-testid", "board-group-u1");
    expect(groups[groups.length - 1]).toHaveAttribute(
      "data-testid",
      "board-group-__ungrouped__",
    );
  });

  it("keeps every task row visible in grouped mode", () => {
    setup("assignee");
    expect(screen.getByTestId("board-row-t1")).toBeInTheDocument();
    expect(screen.getByTestId("board-row-t2")).toBeInTheDocument();
    expect(screen.getByTestId("board-row-t3")).toBeInTheDocument();
  });

  it("keeps inline edit working inside a group", async () => {
    const user = userEvent.setup();
    const { onUpdateTask, onRowClick } = setup("assignee");

    await user.click(screen.getByRole("button", { name: "Titel von Login" }));
    const input = screen.getByLabelText("Titel von Login");
    await user.clear(input);
    await user.type(input, "Anmeldung{Enter}");

    expect(onUpdateTask).toHaveBeenCalledWith("t1", { title: "Anmeldung" });
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("keeps the row click (TaskDialog) working inside a group", async () => {
    const user = userEvent.setup();
    const { onRowClick } = setup("assignee");

    // Click a non-editable cell (project name) → opens the dialog, not inline edit.
    await user.click(
      within(screen.getByTestId("board-row-t3")).getByText("Projekt Eins"),
    );
    expect(onRowClick).toHaveBeenCalledTimes(1);
  });
});
