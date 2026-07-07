import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EditableTextCell } from "@/components/board/cells/EditableTextCell";

describe("EditableTextCell (TASK-030)", () => {
  it("shows the value and the empty label", () => {
    const { rerender } = render(
      <EditableTextCell value="Login" ariaLabel="Titel" onCommit={() => {}} />,
    );
    expect(screen.getByRole("button", { name: "Titel" })).toHaveTextContent(
      "Login",
    );

    rerender(
      <EditableTextCell
        value={undefined}
        ariaLabel="Titel"
        emptyLabel="leer"
        onCommit={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Titel" })).toHaveTextContent(
      "leer",
    );
  });

  it("commits the trimmed draft on Enter", async () => {
    const onCommit = vi.fn();
    const user = userEvent.setup();
    render(<EditableTextCell value="Login" ariaLabel="Titel" onCommit={onCommit} />);

    await user.click(screen.getByRole("button", { name: "Titel" }));
    const input = screen.getByLabelText("Titel");
    await user.clear(input);
    await user.type(input, "Neuer Titel{Enter}");

    expect(onCommit).toHaveBeenCalledWith("Neuer Titel");
  });

  it("commits on blur", async () => {
    const onCommit = vi.fn();
    const user = userEvent.setup();
    render(<EditableTextCell value="Login" ariaLabel="Titel" onCommit={onCommit} />);

    await user.click(screen.getByRole("button", { name: "Titel" }));
    const input = screen.getByLabelText("Titel");
    await user.clear(input);
    await user.type(input, "Geblurrt");
    fireEvent.blur(input);

    expect(onCommit).toHaveBeenCalledWith("Geblurrt");
  });

  it("cancels on Escape without committing", async () => {
    const onCommit = vi.fn();
    const user = userEvent.setup();
    render(<EditableTextCell value="Login" ariaLabel="Titel" onCommit={onCommit} />);

    await user.click(screen.getByRole("button", { name: "Titel" }));
    const input = screen.getByLabelText("Titel");
    await user.clear(input);
    await user.type(input, "Verworfen{Escape}");

    expect(onCommit).not.toHaveBeenCalled();
    // back to display mode showing the original value
    expect(screen.getByRole("button", { name: "Titel" })).toHaveTextContent(
      "Login",
    );
  });

  it("stops click propagation so the row dialog stays closed", async () => {
    const onParentClick = vi.fn();
    const user = userEvent.setup();
    render(
      <div onClick={onParentClick}>
        <EditableTextCell value="Login" ariaLabel="Titel" onCommit={() => {}} />
      </div>,
    );

    await user.click(screen.getByRole("button", { name: "Titel" }));
    expect(onParentClick).not.toHaveBeenCalled();
  });
});
