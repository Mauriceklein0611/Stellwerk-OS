import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DndContext } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";

import { SprintStoryCard } from "@/components/sprint/SprintStoryCard";
import type { UserStory } from "@/types";

/**
 * TASK-059: the compact `row` variant used by the vertical sprint sections keeps
 * the TASK-058 grip-vs-click behaviour (grip drags, body opens the dialog).
 */

const story: UserStory = {
  id: "US-1",
  epicId: "E-1",
  projectId: "p1",
  title: "Login",
  acceptance_criteria: [],
  estimate_pt: 3,
  priority: "hoch",
  rank: 0,
  provenance: "agent",
};

function renderRow(onOpen: (story: UserStory) => void) {
  return render(
    <DndContext>
      <SortableContext items={[story.id]}>
        <SprintStoryCard story={story} variant="row" done onOpen={onOpen} />
      </SortableContext>
    </DndContext>,
  );
}

describe("SprintStoryCard row variant (TASK-059)", () => {
  it("renders title, priority, done badge and PT compactly", () => {
    renderRow(vi.fn());
    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(screen.getByText("Hoch")).toBeInTheDocument();
    expect(screen.getByText("Fertig")).toBeInTheDocument();
    expect(screen.getByText("3 PT")).toBeInTheDocument();
  });

  it("opens on a body click but not on the grip handle", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    renderRow(onOpen);

    await user.click(screen.getByText("Login"));
    expect(onOpen).toHaveBeenCalledWith(story);

    onOpen.mockClear();
    // Raw click (no pointer sequence) so no dnd drag starts; the grip's
    // stopPropagation still keeps the card's onClick from firing.
    fireEvent.click(screen.getByTestId("sprint-story-drag-US-1"));
    expect(onOpen).not.toHaveBeenCalled();
  });
});
