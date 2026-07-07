import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { ColumnManager } from "@/components/board/ColumnManager";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DEFAULT_BOARD_COLUMNS } from "@/lib/board";
import { useBoardColumnsStore } from "@/store/useBoardColumnsStore";
import { useBoardStore } from "@/store/useBoardStore";
import { useConfirmStore } from "@/store/useConfirmStore";
import { useToastStore } from "@/store/useToastStore";
import type { BoardTask } from "@/types";

const baseTask: Omit<BoardTask, "id" | "order" | "column"> = {
  title: "Task",
  projectId: "p-1",
  projectName: "Projekt",
  priority: "mittel",
};

function renderManager() {
  return render(
    <>
      <ColumnManager open onOpenChange={() => {}} />
      <ConfirmDialog />
    </>,
  );
}

const ids = () => useBoardColumnsStore.getState().columns.map((c) => c.id);

describe("ColumnManager (TASK-032)", () => {
  beforeEach(() => {
    useBoardColumnsStore.setState({ columns: DEFAULT_BOARD_COLUMNS });
    useBoardStore.setState({ tasks: [] });
    useConfirmStore.setState({ request: null });
    useToastStore.setState({ toasts: [] });
  });

  it("adds a new phase", async () => {
    const user = userEvent.setup();
    renderManager();

    await user.type(screen.getByLabelText("Neue Phase"), "QA");
    await user.click(screen.getByRole("button", { name: "Hinzufügen" }));

    const columns = useBoardColumnsStore.getState().columns;
    expect(columns[columns.length - 1].label).toBe("QA");
  });

  it("renames a phase in place", async () => {
    const user = userEvent.setup();
    renderManager();

    await user.type(screen.getByLabelText("Name von To Do"), " jetzt");

    expect(
      useBoardColumnsStore.getState().columns.find((c) => c.id === "todo")!.label,
    ).toBe("To Do jetzt");
  });

  it("moves a phase up via the reorder button", async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(screen.getByRole("button", { name: "To Do nach oben" }));

    expect(ids().slice(0, 2)).toEqual(["todo", "backlog"]);
  });

  it("deletes a phase and relocates its tasks to the fallback", async () => {
    useBoardStore.getState().addTask({ id: "t1", column: "review", ...baseTask });
    const user = userEvent.setup();
    renderManager();

    // Deleting now runs the shared safe-delete flow (TASK-040): the trigger
    // opens a confirm dialog, the actual removal happens on confirm.
    await user.click(screen.getByRole("button", { name: "Review löschen" }));
    const confirmButtons = screen.getAllByRole("button", { name: "Löschen" });
    await user.click(confirmButtons[confirmButtons.length - 1]);

    expect(ids()).not.toContain("review");
    // Tasks move to the first remaining phase (backlog).
    expect(useBoardStore.getState().tasks.find((t) => t.id === "t1")!.column).toBe(
      "backlog",
    );
  });

  it("disables deleting the only terminal phase", () => {
    renderManager();
    expect(screen.getByRole("button", { name: "Done löschen" })).toBeDisabled();
  });
});
