import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AddColumnTile } from "@/components/board/AddColumnTile";

describe("AddColumnTile (TASK-051)", () => {
  it("opens an input from the trigger and adds the trimmed label on Enter", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<AddColumnTile onAdd={onAdd} />);

    await user.click(screen.getByTestId("add-column-trigger"));
    const input = screen.getByTestId("add-column-input");
    await user.type(input, "  Review  {Enter}");

    expect(onAdd).toHaveBeenCalledWith("Review");
  });

  it("ignores an empty/whitespace label", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<AddColumnTile onAdd={onAdd} />);

    await user.click(screen.getByTestId("add-column-trigger"));
    await user.type(screen.getByTestId("add-column-input"), "   {Enter}");

    expect(onAdd).not.toHaveBeenCalled();
  });

  it("stays open and clears for the next entry after Enter", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<AddColumnTile onAdd={onAdd} />);

    await user.click(screen.getByTestId("add-column-trigger"));
    const input = screen.getByTestId("add-column-input");
    await user.type(input, "QA{Enter}");
    await user.type(input, "Review{Enter}");

    expect(onAdd).toHaveBeenNthCalledWith(1, "QA");
    expect(onAdd).toHaveBeenNthCalledWith(2, "Review");
    expect(screen.getByTestId("add-column-input")).toHaveValue("");
  });

  it("closes without adding on Escape", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<AddColumnTile onAdd={onAdd} />);

    await user.click(screen.getByTestId("add-column-trigger"));
    await user.type(screen.getByTestId("add-column-input"), "Verworfen{Escape}");

    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getByTestId("add-column-trigger")).toBeInTheDocument();
  });

  it("closes on blur", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<AddColumnTile onAdd={onAdd} />);

    await user.click(screen.getByTestId("add-column-trigger"));
    fireEvent.blur(screen.getByTestId("add-column-input"));

    expect(screen.getByTestId("add-column-trigger")).toBeInTheDocument();
  });
});
