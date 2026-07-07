import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  EditableSelectCell,
  type SelectCellOption,
} from "@/components/board/cells/EditableSelectCell";

const options: SelectCellOption[] = [
  { value: "todo", label: "To Do" },
  { value: "done", label: "Done" },
];

describe("EditableSelectCell (TASK-030)", () => {
  it("shows the current option on the trigger", () => {
    render(
      <EditableSelectCell
        value="done"
        options={options}
        ariaLabel="Status"
        onChange={() => {}}
      />,
    );
    expect(screen.getByLabelText("Status")).toHaveTextContent("Done");
  });

  it("renders a static placeholder when disabled", () => {
    render(
      <EditableSelectCell
        disabled
        value="x"
        options={options}
        ariaLabel="Sprint"
        placeholder="–"
        onChange={() => {}}
      />,
    );
    expect(screen.queryByLabelText("Sprint")).not.toBeInTheDocument();
    expect(screen.getByText("–")).toBeInTheDocument();
  });

  it("calls onChange with the picked value", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <EditableSelectCell
        value="todo"
        options={options}
        ariaLabel="Status"
        onChange={onChange}
      />,
    );

    await user.click(screen.getByLabelText("Status"));
    await user.click(screen.getByRole("option", { name: "Done" }));

    expect(onChange).toHaveBeenCalledWith("done");
  });

  it("stops click propagation so the row dialog stays closed", async () => {
    const onParentClick = vi.fn();
    const user = userEvent.setup();
    render(
      <div onClick={onParentClick}>
        <EditableSelectCell
          value="todo"
          options={options}
          ariaLabel="Status"
          onChange={() => {}}
        />
      </div>,
    );

    await user.click(screen.getByLabelText("Status"));
    expect(onParentClick).not.toHaveBeenCalled();
  });
});
