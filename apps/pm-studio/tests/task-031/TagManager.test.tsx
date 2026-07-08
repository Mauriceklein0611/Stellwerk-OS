import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { TagManager } from "@/components/tags/TagManager";
import { useBoardStore } from "@/store/useBoardStore";
import { useTagStore } from "@/store/useTagStore";
import type { BoardTask } from "@/types";

const task: BoardTask = {
  id: "t1",
  title: "Task",
  column: "todo",
  order: 0,
  projectId: "p-1",
  projectName: "Projekt",
  priority: "mittel",
  tagIds: ["tag-bug"],
};

function renderManager() {
  return render(<TagManager open onOpenChange={() => {}} />);
}

describe("TagManager (TASK-031)", () => {
  beforeEach(() => {
    useTagStore.setState({ tags: [] });
    useBoardStore.setState({ tasks: [{ ...task }] });
  });

  it("creates a tag with the chosen color", async () => {
    const user = userEvent.setup();
    renderManager();

    await user.type(screen.getByLabelText("Neuer Tag"), "Frontend");
    await user.click(screen.getByTestId("new-tag-color-success"));
    await user.click(screen.getByRole("button", { name: "Hinzufügen" }));

    const tags = useTagStore.getState().tags;
    expect(tags).toHaveLength(1);
    expect(tags[0]).toMatchObject({ name: "Frontend", color: "success" });
  });

  it("renames an existing tag", async () => {
    useTagStore.setState({ tags: [{ id: "tag-bug", name: "Bug", color: "danger" }] });
    const user = userEvent.setup();
    renderManager();

    const input = screen.getByLabelText("Name von Bug");
    await user.type(input, "fix");

    expect(useTagStore.getState().tags[0].name).toBe("Bugfix");
  });

  it("deleting a tag detaches it from all board tasks", async () => {
    useTagStore.setState({ tags: [{ id: "tag-bug", name: "Bug", color: "danger" }] });
    const user = userEvent.setup();
    renderManager();

    await user.click(screen.getByRole("button", { name: "Bug löschen" }));

    expect(useTagStore.getState().tags).toHaveLength(0);
    // The deleted tag is removed from the task that carried it (no dangling id).
    expect(useBoardStore.getState().tasks[0].tagIds).toBeUndefined();
  });
});
