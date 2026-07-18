import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SwimlaneSelect } from "@/components/board/SwimlaneSelect";

describe("SwimlaneSelect (TASK-036)", () => {
  it("renders all four grouping options with the active one checked", () => {
    render(<SwimlaneSelect value="assignee" onChange={() => {}} />);

    expect(screen.getByRole("radio", { name: "Keine" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Sprint" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Tag" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Zuständig" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("calls onChange with the picked mode", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SwimlaneSelect value="none" onChange={onChange} />);

    await user.click(screen.getByRole("radio", { name: "Sprint" }));
    expect(onChange).toHaveBeenCalledWith("sprint");
  });
});
