import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DndContext } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";

import { SprintStoryCard } from "@/components/sprint/SprintStoryCard";
import type { UserStory } from "@/types";

/**
 * TASK-058: a click on the card body opens the story dialog, while the grip
 * handle stays a pure drag affordance (its click is swallowed so it never
 * opens the dialog). `useSortable` needs a Dnd/Sortable context around it.
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

function renderCard(onOpen: (story: UserStory) => void) {
  return render(
    <DndContext>
      <SortableContext items={[story.id]}>
        <SprintStoryCard story={story} onOpen={onOpen} />
      </SortableContext>
    </DndContext>,
  );
}

describe("SprintStoryCard", () => {
  it("opens the story on a body click", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    renderCard(onOpen);
    await user.click(screen.getByText("Login"));
    expect(onOpen).toHaveBeenCalledWith(story);
  });

  it("does NOT open the story when the drag handle is clicked", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    renderCard(onOpen);
    await user.click(screen.getByTestId("sprint-story-drag-US-1"));
    expect(onOpen).not.toHaveBeenCalled();
  });
});
