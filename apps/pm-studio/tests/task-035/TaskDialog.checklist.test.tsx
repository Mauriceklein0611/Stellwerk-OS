import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TaskDialog } from "@/components/board/TaskDialog";
import { usePeopleStore } from "@/store/usePeopleStore";
import { useTagStore } from "@/store/useTagStore";
import type { BoardTask, ChecklistItem } from "@/types";

const baseTask: BoardTask = {
  id: "t1",
  title: "Task",
  column: "todo",
  order: 0,
  projectId: "p-1",
  projectName: "Projekt",
  priority: "mittel",
};

function lastPatch(onSave: ReturnType<typeof vi.fn>) {
  return onSave.mock.calls.at(-1)?.[1] as { checklist?: ChecklistItem[] };
}

describe("TaskDialog checklist editor (TASK-035)", () => {
  beforeEach(() => {
    usePeopleStore.setState({ persons: [] });
    useTagStore.setState({ tags: [] });
  });

  it("adds an item and persists it through the save patch", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <TaskDialog task={{ ...baseTask }} onOpenChange={() => {}} onSave={onSave} onDelete={() => {}} />,
    );

    await user.type(screen.getByTestId("checklist-new-input"), "Tests schreiben");
    await user.click(screen.getByRole("button", { name: "Hinzufügen" }));
    await user.click(screen.getByRole("button", { name: "Speichern" }));

    expect(lastPatch(onSave).checklist).toEqual([
      expect.objectContaining({ text: "Tests schreiben", done: false }),
    ]);
  });

  it("toggles, renames and removes existing items", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const task: BoardTask = {
      ...baseTask,
      checklist: [
        { id: "c1", text: "Eins", done: false },
        { id: "c2", text: "Zwei", done: false },
      ],
    };
    render(<TaskDialog task={task} onOpenChange={() => {}} onSave={onSave} onDelete={() => {}} />);

    // toggle the first item done
    await user.click(
      screen.getByRole("checkbox", { name: "„Eins“ als erledigt markieren" }),
    );
    // remove the second item
    const removeButtons = screen.getAllByRole("button", { name: "Punkt entfernen" });
    await user.click(removeButtons[1]);

    await user.click(screen.getByRole("button", { name: "Speichern" }));

    expect(lastPatch(onSave).checklist).toEqual([
      { id: "c1", text: "Eins", done: true },
    ]);
  });

  it("drops emptied items on save (checklist becomes undefined)", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const task: BoardTask = {
      ...baseTask,
      checklist: [{ id: "c1", text: "Eins", done: false }],
    };
    render(<TaskDialog task={task} onOpenChange={() => {}} onSave={onSave} onDelete={() => {}} />);

    await user.clear(screen.getByLabelText("Checklistenpunkt"));
    await user.click(screen.getByRole("button", { name: "Speichern" }));

    expect(lastPatch(onSave).checklist).toBeUndefined();
  });
});
