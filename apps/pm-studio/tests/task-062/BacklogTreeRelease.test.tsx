import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { BacklogTree } from "@/components/backlog/BacklogTree";
import type { Epic, Release, UserStory } from "@/types";

/**
 * TASK-062: the inline release cell in a backlog row lets a story be assigned to
 * or cleared from a release. When the project has no releases the cell is a
 * static placeholder (nothing assignable).
 */

const epics: Epic[] = [{ id: "E-1", projectId: "P-1", title: "Kern", rank: 0 }];

function story(id: string, title: string, releaseId?: string): UserStory {
  return {
    id,
    epicId: "E-1",
    projectId: "P-1",
    title,
    acceptance_criteria: [],
    estimate_pt: 1,
    priority: "mittel",
    rank: 0,
    provenance: "human",
    releaseId,
  };
}

function release(id: string, name: string): Release {
  return {
    id,
    projectId: "P-1",
    name,
    status: "planned",
    startDate: "2026-07-01",
    endDate: "2026-07-28",
    sprintLengthWeeks: 2,
  };
}

function renderTree(stories: UserStory[], releases: Release[]) {
  const onUpdateStory = vi.fn();
  render(
    <BacklogTree
      epics={epics}
      stories={stories}
      tasks={[]}
      releases={releases}
      openAddStoryEpicId={null}
      onRenameEpic={vi.fn()}
      onDeleteEpic={vi.fn()}
      onAddStory={vi.fn()}
      onUpdateStory={onUpdateStory}
      onDeleteStory={vi.fn()}
      onOpenStory={vi.fn()}
      onReorderStory={vi.fn()}
      onOpenAddStory={vi.fn()}
    />,
  );
  return { onUpdateStory };
}

describe("BacklogTree inline release cell (TASK-062)", () => {
  it("assigns a story to a release via onUpdateStory", async () => {
    const user = userEvent.setup();
    const { onUpdateStory } = renderTree(
      [story("US-1", "Login")],
      [release("r1", "Release Q3")],
    );

    await user.click(screen.getByLabelText("Release: Login"));
    await user.click(screen.getByRole("option", { name: "Release Q3" }));

    expect(onUpdateStory).toHaveBeenCalledWith("US-1", { releaseId: "r1" });
  });

  it("clears a story's release (Kein Release → undefined)", async () => {
    const user = userEvent.setup();
    const { onUpdateStory } = renderTree(
      [story("US-1", "Login", "r1")],
      [release("r1", "Release Q3")],
    );

    await user.click(screen.getByLabelText("Release: Login"));
    await user.click(screen.getByRole("option", { name: "–" }));

    expect(onUpdateStory).toHaveBeenCalledWith("US-1", { releaseId: undefined });
  });

  it("renders a static placeholder when the project has no releases", () => {
    renderTree([story("US-1", "Login")], []);
    expect(screen.queryByLabelText("Release: Login")).not.toBeInTheDocument();
  });
});
