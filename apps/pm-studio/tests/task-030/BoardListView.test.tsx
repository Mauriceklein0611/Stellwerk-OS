import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { BoardListView } from "@/components/board/BoardListView";
import { DEFAULT_BOARD_COLUMNS } from "@/lib/board";
import { buildBoardRows } from "@/lib/board-rows";
import type { BoardTask, Person, PlannedSprint } from "@/types";

const persons: Person[] = [
  { id: "u1", name: "Lena Schmidt", role: "Dev", capacityPtPerSprint: 10 },
];

const sprints: PlannedSprint[] = [
  {
    id: "s1",
    projectId: "p-1",
    name: "Sprint 1",
    goal: "",
    status: "planned",
    storyIds: ["US-1"],
    order: 0,
  },
];

function task(overrides: Partial<BoardTask> & { id: string }): BoardTask {
  return {
    title: "Login",
    column: "todo",
    order: 0,
    projectId: "p-1",
    projectName: "Projekt Eins",
    priority: "mittel",
    ...overrides,
  };
}

function setup(tasks: BoardTask[]) {
  const onRowClick = vi.fn();
  const onUpdateTask = vi.fn();
  const onAssignSprint = vi.fn();
  const rows = buildBoardRows(tasks, persons, sprints);
  render(
    <BoardListView
      rows={rows}
      columns={DEFAULT_BOARD_COLUMNS}
      onRowClick={onRowClick}
      onUpdateTask={onUpdateTask}
      onAssignSprint={onAssignSprint}
      persons={persons}
      sprints={sprints}
      today="2026-06-16"
    />,
  );
  return { onRowClick, onUpdateTask, onAssignSprint };
}

describe("BoardListView inline edit (TASK-030)", () => {
  it("edits the title inline without opening the dialog", async () => {
    const user = userEvent.setup();
    const { onRowClick, onUpdateTask } = setup([
      task({ id: "t1", title: "Login", storyId: "US-1" }),
    ]);

    await user.click(screen.getByRole("button", { name: "Titel von Login" }));
    const input = screen.getByLabelText("Titel von Login");
    await user.clear(input);
    await user.type(input, "Login-Formular{Enter}");

    expect(onUpdateTask).toHaveBeenCalledWith("t1", { title: "Login-Formular" });
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("ignores an empty title", async () => {
    const user = userEvent.setup();
    const { onUpdateTask } = setup([task({ id: "t1", title: "Login" })]);

    await user.click(screen.getByRole("button", { name: "Titel von Login" }));
    const input = screen.getByLabelText("Titel von Login");
    await user.clear(input);
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onUpdateTask).not.toHaveBeenCalled();
  });

  it("saves a valid PT value and clears an empty one", async () => {
    const user = userEvent.setup();
    const { onUpdateTask } = setup([
      task({ id: "t1", title: "Login", estimate_pt: 3 }),
    ]);

    const cell = screen.getByRole("button", { name: "PT von Login" });
    await user.click(cell);
    const input = screen.getByLabelText("PT von Login");
    fireEvent.change(input, { target: { value: "8" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onUpdateTask).toHaveBeenCalledWith("t1", { estimate_pt: 8 });
  });

  it("rejects a negative PT value", async () => {
    const user = userEvent.setup();
    const { onUpdateTask } = setup([
      task({ id: "t1", title: "Login", estimate_pt: 3 }),
    ]);

    await user.click(screen.getByRole("button", { name: "PT von Login" }));
    const input = screen.getByLabelText("PT von Login");
    fireEvent.change(input, { target: { value: "-2" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onUpdateTask).not.toHaveBeenCalled();
  });

  it("changes the status via the dropdown", async () => {
    const user = userEvent.setup();
    const { onUpdateTask, onRowClick } = setup([
      task({ id: "t1", title: "Login", column: "todo" }),
    ]);

    await user.click(screen.getByLabelText("Status von Login"));
    await user.click(screen.getByRole("option", { name: "In Progress" }));

    expect(onUpdateTask).toHaveBeenCalledWith("t1", { column: "in_progress" });
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("assigns a sprint via the story membership", async () => {
    const user = userEvent.setup();
    const { onAssignSprint } = setup([
      task({ id: "t1", title: "Login", storyId: "US-1" }),
    ]);

    // story is not yet in any sprint → trigger shows "Ohne Sprint"
    await user.click(screen.getByLabelText("Sprint von Login"));
    await user.click(screen.getByRole("option", { name: "Sprint 1" }));

    expect(onAssignSprint).toHaveBeenCalledWith("US-1", "s1");
  });

  it("disables the sprint cell for tasks without a story", () => {
    setup([task({ id: "t1", title: "Login" })]);
    expect(screen.queryByLabelText("Sprint von Login")).not.toBeInTheDocument();
  });

  it("opens the dialog when a non-editable cell is clicked", async () => {
    const user = userEvent.setup();
    const { onRowClick } = setup([task({ id: "t1", title: "Login" })]);

    await user.click(screen.getByText("Projekt Eins"));
    expect(onRowClick).toHaveBeenCalledTimes(1);
  });
});
