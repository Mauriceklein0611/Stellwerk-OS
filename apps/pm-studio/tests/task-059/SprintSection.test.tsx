import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DndContext } from "@dnd-kit/core";

import { SprintSection } from "@/components/sprint/SprintSection";
import type { BoardTask, Person, PlannedSprint, Priority, UserStory } from "@/types";

/**
 * TASK-059: vertical, collapsible sprint section. Rendered inside a DndContext
 * because the droppable list and the sortable story rows need it.
 */

function makeStory(id: string, pt: number, priority: Priority = "mittel"): UserStory {
  return {
    id,
    epicId: "E-1",
    projectId: "p1",
    title: `Story ${id}`,
    acceptance_criteria: [],
    estimate_pt: pt,
    priority,
    rank: 0,
    provenance: "agent",
  };
}

const sprint: PlannedSprint = {
  id: "sp1",
  projectId: "p1",
  name: "Sprint 1",
  goal: "Erstes Inkrement",
  status: "planned",
  storyIds: ["US-1", "US-2"],
  order: 0,
  startDate: "2026-07-01",
  endDate: "2026-07-14",
};

const persons: Person[] = [
  { id: "per-1", name: "Ada", role: "Dev", capacityPtPerSprint: 8 },
];

function boardTask(overrides: Partial<BoardTask> & { id: string }): BoardTask {
  return {
    title: `Task ${overrides.id}`,
    column: "todo",
    order: 0,
    projectId: "p1",
    projectName: "Projekt",
    priority: "mittel",
    ...overrides,
  };
}

function renderSection(props?: Partial<React.ComponentProps<typeof SprintSection>>) {
  const stories = [makeStory("US-1", 3, "hoch"), makeStory("US-2", 5)];
  return render(
    <DndContext>
      <SprintSection
        id="sp1"
        label="Sprint 1"
        goal="Erstes Inkrement"
        sprint={sprint}
        stories={stories}
        boardTasks={[]}
        persons={persons}
        {...props}
      />
    </DndContext>,
  );
}

describe("SprintSection (TASK-059)", () => {
  it("renders the header with name, status, timebox and PT summary", () => {
    renderSection();
    expect(screen.getByRole("heading", { name: "Sprint 1" })).toBeInTheDocument();
    expect(screen.getByText("Geplant")).toBeInTheDocument();
    expect(screen.getByTestId("sprint-section-sp1-range")).toHaveTextContent(
      "01.07.–14.07.",
    );
    // 8 PT planned, 0 done, 0/2 stories.
    expect(screen.getByTestId("sprint-section-sp1-points")).toHaveTextContent(
      "geplant 8 PT",
    );
  });

  it("shows the story rows and opens the dialog on a row click", async () => {
    const user = userEvent.setup();
    const onStoryClick = vi.fn();
    renderSection({ onStoryClick });
    const row = screen.getByTestId("sprint-story-US-1");
    await user.click(within(row).getByText("Story US-1"));
    expect(onStoryClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: "US-1" }),
    );
  });

  it("does not open the dialog when the drag handle is used", () => {
    // fireEvent, not userEvent: a full pointer sequence on the grip would start a
    // dnd-kit drag (default sensors activate on pointerdown), whose leftover jsdom
    // state disrupts the next test. A raw click still exercises the grip's
    // stopPropagation (the card's onClick must not fire).
    const onStoryClick = vi.fn();
    renderSection({ onStoryClick });
    fireEvent.click(screen.getByTestId("sprint-story-drag-US-1"));
    expect(onStoryClick).not.toHaveBeenCalled();
  });

  it("collapses the body via the section toggle", async () => {
    const user = userEvent.setup();
    renderSection();
    expect(screen.getByTestId("sprint-story-US-1")).toBeInTheDocument();
    await user.click(screen.getByTestId("sprint-section-toggle-sp1"));
    expect(screen.queryByTestId("sprint-story-US-1")).not.toBeInTheDocument();
  });

  it("warns when planned PT exceed the team capacity, and not otherwise", () => {
    // 8 PT planned vs. 8 capacity → no warning.
    renderSection();
    expect(screen.queryByTestId("sprint-commitment-sp1")).not.toBeInTheDocument();

    // 20 PT planned vs. 8 capacity → warning.
    renderSection({ stories: [makeStory("US-1", 20)] });
    expect(screen.getByTestId("sprint-commitment-sp1")).toBeInTheDocument();
    expect(screen.getByText("Überplant")).toBeInTheDocument();
  });

  it("reveals per-person workload behind its own toggle", async () => {
    const user = userEvent.setup();
    renderSection({
      boardTasks: [boardTask({ id: "t1", storyId: "US-1", assigneeId: "per-1" })],
    });
    // Collapsed by default.
    expect(screen.queryByTestId("sprint-load-per-1")).not.toBeInTheDocument();
    await user.click(screen.getByTestId("sprint-load-toggle-sp1"));
    expect(screen.getByTestId("sprint-load-per-1")).toHaveTextContent("Ada");
  });

  it("renders the backlog section without sprint chrome", () => {
    renderSection({
      id: "unassigned",
      label: "Backlog / Nicht zugeordnet",
      goal: undefined,
      sprint: undefined,
      detailHref: undefined,
    });
    // Plain "PT · count" summary, no status/commitment/range/workload.
    expect(screen.getByTestId("sprint-section-unassigned-points")).toHaveTextContent(
      "8 PT · 2",
    );
    expect(screen.queryByText("Geplant")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("sprint-commitment-unassigned"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("sprint-section-unassigned-workload"),
    ).not.toBeInTheDocument();
  });
});
