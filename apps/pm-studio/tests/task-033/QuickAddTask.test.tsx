import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { QuickAddTask } from "@/components/board/QuickAddTask";

describe("QuickAddTask (TASK-033)", () => {
  it("opens an input from the trigger and adds the trimmed title on Enter", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<QuickAddTask columnId="todo" columnLabel="To Do" onAdd={onAdd} />);

    await user.click(screen.getByTestId("quick-add-trigger-todo"));
    const input = screen.getByTestId("quick-add-input-todo");
    await user.type(input, "  Neuer Task  {Enter}");

    expect(onAdd).toHaveBeenCalledWith("Neuer Task");
  });

  it("ignores an empty/whitespace title", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<QuickAddTask columnId="todo" columnLabel="To Do" onAdd={onAdd} />);

    await user.click(screen.getByTestId("quick-add-trigger-todo"));
    const input = screen.getByTestId("quick-add-input-todo");
    await user.type(input, "   {Enter}");

    expect(onAdd).not.toHaveBeenCalled();
  });

  it("stays open and clears for the next entry after Enter", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<QuickAddTask columnId="todo" columnLabel="To Do" onAdd={onAdd} />);

    await user.click(screen.getByTestId("quick-add-trigger-todo"));
    const input = screen.getByTestId("quick-add-input-todo");
    await user.type(input, "Erster{Enter}");
    await user.type(input, "Zweiter{Enter}");

    expect(onAdd).toHaveBeenNthCalledWith(1, "Erster");
    expect(onAdd).toHaveBeenNthCalledWith(2, "Zweiter");
    // field cleared between entries
    expect(screen.getByTestId("quick-add-input-todo")).toHaveValue("");
  });

  it("closes without adding on Escape", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<QuickAddTask columnId="todo" columnLabel="To Do" onAdd={onAdd} />);

    await user.click(screen.getByTestId("quick-add-trigger-todo"));
    await user.type(screen.getByTestId("quick-add-input-todo"), "Verworfen{Escape}");

    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getByTestId("quick-add-trigger-todo")).toBeInTheDocument();
  });

  it("closes on blur", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<QuickAddTask columnId="todo" columnLabel="To Do" onAdd={onAdd} />);

    await user.click(screen.getByTestId("quick-add-trigger-todo"));
    const input = screen.getByTestId("quick-add-input-todo");
    fireEvent.blur(input);

    expect(screen.getByTestId("quick-add-trigger-todo")).toBeInTheDocument();
  });

  it("renders the hint instead of the trigger when disabled", () => {
    render(
      <QuickAddTask
        columnId="todo"
        columnLabel="To Do"
        onAdd={() => {}}
        disabled
        disabledHint="Projekt wählen"
      />,
    );

    expect(screen.getByTestId("quick-add-disabled-todo")).toHaveTextContent(
      "Projekt wählen",
    );
    expect(screen.queryByTestId("quick-add-trigger-todo")).not.toBeInTheDocument();
  });
});
