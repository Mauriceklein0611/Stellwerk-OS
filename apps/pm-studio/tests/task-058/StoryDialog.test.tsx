import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StoryDialog } from "@/components/backlog/StoryDialog";
import { useBacklogStore } from "@/store/useBacklogStore";
import { useBoardStore } from "@/store/useBoardStore";
import { useActivityStore } from "@/store/useActivityStore";
import type { Epic, UserStory } from "@/types";

/**
 * TASK-058: the reusable story dialog. Drives the real backlog store (the dialog
 * is self-contained) and asserts the edit patch + checkable acceptance criteria
 * persist and produce a story activity event.
 */

const epic: Epic = { id: "E-1", projectId: "p1", title: "Kern", rank: 0 };

const story: UserStory = {
  id: "US-1",
  epicId: "E-1",
  projectId: "p1",
  title: "Login",
  acceptance_criteria: [{ id: "ac-1", text: "AK eins", done: false }],
  estimate_pt: 3,
  priority: "hoch",
  rank: 0,
  provenance: "agent",
};

beforeEach(() => {
  useBacklogStore.setState({
    epics: [epic],
    stories: [story],
    artifactsMigrated: true,
  });
  useBoardStore.setState({ tasks: [] });
  useActivityStore.setState({ events: [] });
});

describe("StoryDialog", () => {
  it("renders the story's fields and acceptance criteria", () => {
    render(<StoryDialog story={story} onOpenChange={vi.fn()} />);
    expect(screen.getByLabelText("Titel")).toHaveValue("Login");
    expect(screen.getByTestId("ac-dialog-progress")).toHaveTextContent("0/1");
    // The existing criterion's checkbox is present and unchecked.
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "false");
  });

  it("saves an edited title + a new acceptance criterion and logs an update", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<StoryDialog story={story} onOpenChange={onOpenChange} />);

    const title = screen.getByLabelText("Titel");
    await user.clear(title);
    await user.type(title, "Login v2");

    const acInput = screen.getByTestId("ac-new-input");
    await user.type(acInput, "Neues Kriterium{Enter}");

    await user.click(screen.getByRole("button", { name: "Speichern" }));

    const saved = useBacklogStore.getState().stories.find((s) => s.id === "US-1")!;
    expect(saved.title).toBe("Login v2");
    expect(saved.acceptance_criteria.map((c) => c.text)).toEqual([
      "AK eins",
      "Neues Kriterium",
    ]);
    // Editing an agent story marks it human_edited (TASK-056) and logs an event.
    expect(saved.provenance).toBe("human_edited");
    expect(
      useActivityStore
        .getState()
        .events.some(
          (e) => e.entityType === "story" && e.entityId === "US-1" && e.kind === "update",
        ),
    ).toBe(true);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("toggles an acceptance criterion done and persists it on save", async () => {
    const user = userEvent.setup();
    render(<StoryDialog story={story} onOpenChange={vi.fn()} />);

    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Speichern" }));

    const saved = useBacklogStore.getState().stories.find((s) => s.id === "US-1")!;
    expect(saved.acceptance_criteria[0].done).toBe(true);
  });
});
