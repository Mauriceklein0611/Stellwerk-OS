import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CeremonyEnrichment } from "@/components/ceremony/CeremonyEnrichment";
import type { CeremonyComment } from "@/types";

const stories = [
  { id: "s1", title: "Login" },
  { id: "s2", title: "Logout" },
];
const tasks = [{ id: "t1", title: "API bauen" }];

function setup(overrides: Partial<Parameters<typeof CeremonyEnrichment>[0]> = {}) {
  const props = {
    sprintId: "sp1",
    availableStories: stories,
    availableTasks: tasks,
    onToggleStory: vi.fn(),
    onToggleTask: vi.fn(),
    onAddComment: vi.fn(),
    onRemoveComment: vi.fn(),
    ...overrides,
  };
  render(<CeremonyEnrichment {...props} />);
  return props;
}

describe("CeremonyEnrichment (TASK-055)", () => {
  it("shows empty states without links or comments", () => {
    setup();
    expect(screen.getByText("Keine Items verknüpft.")).toBeInTheDocument();
    expect(screen.getByText("Noch keine Kommentare.")).toBeInTheDocument();
  });

  it("renders a linked story as a navigating link to the sprint", () => {
    setup({ linkedStoryIds: ["s1"] });
    const chip = screen.getByTestId("ceremony-link-s1");
    const link = chip.querySelector("a");
    expect(link).toHaveAttribute("href", "/sprints/sp1");
    expect(chip).toHaveTextContent("Login");
  });

  it("renders a deleted linked item robustly (no crash, marked missing)", () => {
    setup({ linkedTaskIds: ["gone"] });
    const chip = screen.getByTestId("ceremony-link-gone");
    expect(chip).toHaveTextContent("Gelöschtes Item");
    // No anchor for a missing item.
    expect(chip.querySelector("a")).toBeNull();
  });

  it("unlinks an item via the remove button", async () => {
    const user = userEvent.setup();
    const props = setup({ linkedStoryIds: ["s1"] });
    await user.click(screen.getByTestId("ceremony-unlink-s1"));
    expect(props.onToggleStory).toHaveBeenCalledWith("s1");
  });

  it("links a task from the picker", async () => {
    const user = userEvent.setup();
    const props = setup();
    await user.click(screen.getByTestId("ceremony-link-picker"));
    await user.click(screen.getByTestId("ceremony-link-option-task-t1"));
    expect(props.onToggleTask).toHaveBeenCalledWith("t1");
  });

  it("adds a comment and disables submit while empty", async () => {
    const user = userEvent.setup();
    const props = setup();
    const submit = screen.getByTestId("ceremony-comment-submit");
    expect(submit).toBeDisabled();

    await user.type(screen.getByTestId("ceremony-comment-author"), "Mia");
    await user.type(screen.getByTestId("ceremony-comment-input"), "Guter Sprint");
    expect(submit).toBeEnabled();
    await user.click(submit);

    expect(props.onAddComment).toHaveBeenCalledTimes(1);
    const addMock = props.onAddComment as ReturnType<typeof vi.fn>;
    const comment = addMock.mock.calls[0][0] as CeremonyComment;
    expect(comment.text).toBe("Guter Sprint");
    expect(comment.author).toBe("Mia");
  });

  it("removes an existing comment", async () => {
    const user = userEvent.setup();
    const comments: CeremonyComment[] = [
      { id: "c1", author: "Mia", text: "danke", createdAt: "2026-03-02T00:00:00.000Z" },
    ];
    const props = setup({ comments });
    await user.click(screen.getByTestId("ceremony-comment-remove-c1"));
    expect(props.onRemoveComment).toHaveBeenCalledWith("c1");
  });
});
