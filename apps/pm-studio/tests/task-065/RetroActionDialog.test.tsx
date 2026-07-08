import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RetroActionDialog } from "@/components/ceremony/RetroActionDialog";
import type { Person } from "@/types";

const persons: Person[] = [
  { id: "p1", name: "Alice", role: "Dev", capacityPtPerSprint: 10 },
];

describe("RetroActionDialog (TASK-065)", () => {
  it("prefills the title with the action text", () => {
    render(
      <RetroActionDialog
        action="CI reparieren"
        projectName="Projekt A"
        persons={persons}
        onOpenChange={() => {}}
        onCreate={() => {}}
      />,
    );
    expect(screen.getByTestId("retro-action-title")).toHaveValue("CI reparieren");
  });

  it("creates a task with the (edited) title and closes", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <RetroActionDialog
        action="CI reparieren"
        projectName="Projekt A"
        persons={persons}
        onOpenChange={onOpenChange}
        onCreate={onCreate}
      />,
    );

    const title = screen.getByTestId("retro-action-title");
    await user.clear(title);
    await user.type(title, "CI-Pipeline reparieren");
    await user.click(screen.getByTestId("retro-action-create"));

    expect(onCreate).toHaveBeenCalledWith({
      title: "CI-Pipeline reparieren",
      assigneeId: undefined,
      dueDate: undefined,
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("disables create when the title is blank", async () => {
    const user = userEvent.setup();
    render(
      <RetroActionDialog
        action="CI reparieren"
        projectName="Projekt A"
        persons={persons}
        onOpenChange={() => {}}
        onCreate={() => {}}
      />,
    );
    await user.clear(screen.getByTestId("retro-action-title"));
    expect(screen.getByTestId("retro-action-create")).toBeDisabled();
  });
});
