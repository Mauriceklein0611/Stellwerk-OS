import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { BacklogView } from "@/components/project/BacklogView";
import { useBoardStore } from "@/store/useBoardStore";
import { useBacklogStore } from "@/store/useBacklogStore";
import type { Epic, UserStory } from "@/types";

const epics: Epic[] = [
  { id: "E-1", projectId: "P-1", title: "Kern-Features", rank: 0 },
];

const stories: UserStory[] = [
  {
    id: "US-1",
    epicId: "E-1",
    projectId: "P-1",
    title: "Login",
    acceptance_criteria: [{ id: "ac-1", text: "AK eins", done: false }],
    estimate_pt: 2,
    priority: "hoch",
    rank: 0,
    provenance: "agent",
  },
];

describe("BacklogView – In Board übernehmen", () => {
  beforeEach(() => {
    useBoardStore.setState({ tasks: [] });
    useBacklogStore.setState({ epics, stories, artifactsMigrated: true });
  });

  it("creates a backlog task from a story and prevents duplicates", async () => {
    const user = userEvent.setup();
    render(
      <BacklogView
        projectId="P-1"
        projectName="Demo-Projekt"
        sprintSuggestions={[]}
      />,
    );

    const button = screen.getByRole("button", { name: "In Board übernehmen" });
    await user.click(button);

    const tasks = useBoardStore.getState().tasks;
    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({
      title: "Login",
      column: "backlog",
      projectId: "P-1",
      projectName: "Demo-Projekt",
      storyId: "US-1",
      estimate_pt: 2,
      priority: "hoch",
    });

    // Re-render reflects the store: button is now disabled, no second task added.
    const disabledButton = screen.getByRole("button", { name: "Im Board" });
    expect(disabledButton).toBeDisabled();
    expect(useBoardStore.getState().tasks).toHaveLength(1);
  });
});
