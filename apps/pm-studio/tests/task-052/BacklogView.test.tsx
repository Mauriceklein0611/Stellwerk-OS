import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BacklogView, BacklogEmpty } from "@/components/project/BacklogView";
import { useBoardStore } from "@/store/useBoardStore";
import { useBacklogStore } from "@/store/useBacklogStore";
import type { BoardTask, Epic, SprintSuggestion, UserStory } from "@/types";

const epics: Epic[] = [
  { id: "E-1", projectId: "P-1", title: "Kern-Features", rank: 0 },
  { id: "E-2", projectId: "P-1", title: "Qualität & Tests", rank: 1 },
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
  {
    id: "US-2",
    epicId: "E-2",
    projectId: "P-1",
    title: "Automatisierte Tests",
    acceptance_criteria: [{ id: "ac-2", text: "AK a", done: false }],
    estimate_pt: 4,
    priority: "mittel",
    rank: 0,
    provenance: "agent",
  },
];

const sprintSuggestions: SprintSuggestion[] = [
  { name: "Sprint 1", goal: "Ziel", story_ids: ["US-1"] },
];

function boardTask(storyId: string, id: string): BoardTask {
  return {
    id,
    title: `Task ${id}`,
    column: "todo",
    order: 0,
    projectId: "P-1",
    projectName: "Demo",
    storyId,
    priority: "mittel",
  };
}

function renderBacklog() {
  return render(
    <BacklogView
      projectId="P-1"
      projectName="Demo"
      sprintSuggestions={sprintSuggestions}
    />,
  );
}

describe("BacklogView – discoverability (TASK-052)", () => {
  beforeEach(() => {
    useBoardStore.setState({ tasks: [] });
    useBacklogStore.setState({ epics, stories, artifactsMigrated: true });
  });

  it("opens every epic by default so all stories (and their tasks) are visible", () => {
    renderBacklog();
    // Both epics' stories are in the DOM without expanding anything by hand.
    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(screen.getByText("Automatisierte Tests")).toBeInTheDocument();
  });

  it("shows a per-story task count badge that reflects linked board tasks", () => {
    useBoardStore.setState({
      tasks: [boardTask("US-1", "t1"), boardTask("US-1", "t2")],
    });
    renderBacklog();

    expect(screen.getByTestId("story-task-count-US-1")).toHaveTextContent(
      "2 Aufgaben",
    );
    // A story without tasks reads "Keine Aufgaben" instead of being silent.
    expect(screen.getByTestId("story-task-count-US-2")).toHaveTextContent(
      "Keine Aufgaben",
    );
  });

  it("uses the singular label for exactly one task", () => {
    useBoardStore.setState({ tasks: [boardTask("US-1", "t1")] });
    renderBacklog();
    expect(screen.getByTestId("story-task-count-US-1")).toHaveTextContent(
      "1 Aufgabe",
    );
  });

  it("scrolls to the story's task section when the count badge is clicked", async () => {
    const user = userEvent.setup();
    const scrollIntoView = vi.fn();
    // jsdom does not implement scrollIntoView; stub it for the assertion.
    Element.prototype.scrollIntoView = scrollIntoView;
    renderBacklog();

    await user.click(screen.getByTestId("story-task-count-US-1"));
    expect(scrollIntoView).toHaveBeenCalled();
  });
});

describe("BacklogEmpty – pipeline CTA (TASK-052)", () => {
  it("renders an explanatory hint and runs the pipeline on the CTA", async () => {
    const user = userEvent.setup();
    const onRunPipeline = vi.fn();
    render(<BacklogEmpty onRunPipeline={onRunPipeline} isRunning={false} />);

    expect(screen.getByText("Noch kein Backlog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Pipeline ausführen/ }));
    expect(onRunPipeline).toHaveBeenCalledTimes(1);
  });

  it("disables the CTA while a pipeline run is in progress", () => {
    render(<BacklogEmpty onRunPipeline={() => {}} isRunning />);
    expect(
      screen.getByRole("button", { name: /Pipeline ausführen/ }),
    ).toBeDisabled();
  });
});
