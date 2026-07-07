import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { StoryTasks } from "@/components/project/StoryTasks";
import { useBoardStore } from "@/store/useBoardStore";
import type { UserStory } from "@/types";

const story: UserStory = {
  id: "US-1",
  epicId: "E-1",
  projectId: "P-1",
  title: "Login",
  acceptance_criteria: [{ id: "ac-1", text: "AK", done: false }],
  estimate_pt: 5,
  priority: "hoch",
  rank: 0,
  provenance: "agent",
};

function renderStory() {
  return render(<StoryTasks story={story} projectId="P-1" projectName="Demo" />);
}

describe("StoryTasks", () => {
  beforeEach(() => {
    useBoardStore.setState({ tasks: [] });
  });

  it("shows an empty state when the story has no tasks", () => {
    renderStory();
    expect(screen.getByText(/Noch keine Aufgaben/)).toBeInTheDocument();
  });

  it("adds a board task with the story link and shows it in the roll-up", async () => {
    const user = userEvent.setup();
    renderStory();

    await user.type(screen.getByLabelText("Aufgabentitel"), "Login-Formular");
    await user.type(screen.getByLabelText("Personentage"), "2");
    await user.click(screen.getByRole("button", { name: "Hinzufügen" }));

    const tasks = useBoardStore.getState().tasks;
    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({
      title: "Login-Formular",
      column: "todo",
      projectId: "P-1",
      projectName: "Demo",
      storyId: "US-1",
      estimate_pt: 2,
      priority: "hoch", // defaults to the story's priority
    });

    // Roll-up reflects 0 done of 1 task, and the task row is rendered.
    expect(screen.getByText("0/1 · 0/2 PT")).toBeInTheDocument();
    expect(screen.getByText("Login-Formular")).toBeInTheDocument();
  });

  it("ignores a blank title (add button disabled)", () => {
    renderStory();
    expect(screen.getByRole("button", { name: "Hinzufügen" })).toBeDisabled();
  });
});
