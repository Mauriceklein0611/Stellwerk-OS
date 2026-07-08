import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { BacklogTree } from "@/components/backlog/BacklogTree";
import type { BoardTask, Epic, UserStory } from "@/types";

const epics: Epic[] = [{ id: "E-1", projectId: "P-1", title: "Kern", rank: 0 }];

const stories: UserStory[] = [
  {
    id: "US-1",
    epicId: "E-1",
    projectId: "P-1",
    title: "Login",
    acceptance_criteria: [],
    estimate_pt: 3,
    priority: "hoch",
    rank: 0,
    provenance: "agent",
  },
  {
    id: "US-2",
    epicId: "E-1",
    projectId: "P-1",
    title: "Logout",
    acceptance_criteria: [],
    estimate_pt: 2,
    priority: "mittel",
    rank: 1,
    provenance: "human",
  },
];

function doneTask(storyId: string): BoardTask {
  return {
    id: `${storyId}-t`,
    title: "t",
    column: "done",
    order: 0,
    projectId: "P-1",
    projectName: "Demo",
    storyId,
    priority: "mittel",
  };
}

function renderTree(
  overrides: Partial<{
    openAddStoryEpicId: string | null;
    tasks: BoardTask[];
  }> = {},
) {
  const onRenameEpic = vi.fn();
  const onDeleteEpic = vi.fn();
  const onAddStory = vi.fn();
  const onUpdateStory = vi.fn();
  const onDeleteStory = vi.fn();
  const onOpenStory = vi.fn();
  const onReorderStory = vi.fn();
  const onOpenAddStory = vi.fn();
  render(
    <BacklogTree
      epics={epics}
      stories={stories}
      tasks={overrides.tasks ?? []}
      releases={[]}
      openAddStoryEpicId={overrides.openAddStoryEpicId ?? null}
      onRenameEpic={onRenameEpic}
      onDeleteEpic={onDeleteEpic}
      onAddStory={onAddStory}
      onUpdateStory={onUpdateStory}
      onDeleteStory={onDeleteStory}
      onOpenStory={onOpenStory}
      onReorderStory={onReorderStory}
      onOpenAddStory={onOpenAddStory}
    />,
  );
  return {
    onRenameEpic,
    onDeleteEpic,
    onAddStory,
    onUpdateStory,
    onDeleteStory,
    onOpenStory,
    onReorderStory,
    onOpenAddStory,
  };
}

describe("BacklogTree", () => {
  it("renders every epic and its stories with a task roll-up", () => {
    renderTree({ tasks: [doneTask("US-1")] });
    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(screen.getByText("Logout")).toBeInTheDocument();
    // US-1 has one done task → 1/1; US-2 has none → 0/0.
    expect(screen.getByTestId("backlog-rollup-US-1")).toHaveTextContent("1/1");
    expect(screen.getByTestId("backlog-rollup-US-2")).toHaveTextContent("0/0");
  });

  it("commits an inline title edit (trimmed) via onUpdateStory", async () => {
    const user = userEvent.setup();
    const { onUpdateStory } = renderTree();
    await user.click(screen.getByRole("button", { name: "Story-Titel: Login" }));
    const input = screen.getByRole("textbox", { name: "Story-Titel: Login" });
    await user.clear(input);
    await user.type(input, "  Neuer Titel  {Enter}");
    expect(onUpdateStory).toHaveBeenCalledWith("US-1", { title: "Neuer Titel" });
  });

  it("ignores an empty title edit", async () => {
    const user = userEvent.setup();
    const { onUpdateStory } = renderTree();
    await user.click(screen.getByRole("button", { name: "Story-Titel: Login" }));
    const input = screen.getByRole("textbox", { name: "Story-Titel: Login" });
    await user.clear(input);
    await user.type(input, "   {Enter}");
    expect(onUpdateStory).not.toHaveBeenCalled();
  });

  it("commits a valid PT edit and ignores a negative one", async () => {
    const user = userEvent.setup();
    const { onUpdateStory } = renderTree();

    await user.click(screen.getByRole("button", { name: "Story Points: 3" }));
    const input = screen.getByRole("spinbutton", { name: "Story Points: 3" });
    await user.clear(input);
    await user.type(input, "8{Enter}");
    expect(onUpdateStory).toHaveBeenCalledWith("US-1", { estimate_pt: 8 });

    onUpdateStory.mockClear();
    await user.click(screen.getByRole("button", { name: "Story Points: 2" }));
    const input2 = screen.getByRole("spinbutton", { name: "Story Points: 2" });
    await user.clear(input2);
    await user.type(input2, "-4{Enter}");
    expect(onUpdateStory).not.toHaveBeenCalled();
  });

  it("deletes a story via its delete button", async () => {
    const user = userEvent.setup();
    const { onDeleteStory } = renderTree();
    await user.click(screen.getByTestId("backlog-story-delete-US-1"));
    expect(onDeleteStory).toHaveBeenCalledWith(
      expect.objectContaining({ id: "US-1" }),
    );
  });

  it("opens the inline add via the trigger and submits a trimmed story", async () => {
    const user = userEvent.setup();
    const { onOpenAddStory } = renderTree();
    await user.click(screen.getByTestId("backlog-add-story-E-1-trigger"));
    expect(onOpenAddStory).toHaveBeenCalledWith("E-1");
  });

  it("submits a new story when the add field is open", async () => {
    const user = userEvent.setup();
    const { onAddStory } = renderTree({ openAddStoryEpicId: "E-1" });
    const input = screen.getByTestId("backlog-add-story-E-1-input");
    await user.type(input, "  Passwort vergessen  {Enter}");
    expect(onAddStory).toHaveBeenCalledWith("E-1", "Passwort vergessen");
  });
});
