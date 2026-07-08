import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { SprintDetail } from "@/components/sprint/SprintDetail";
import { useSprintStore } from "@/store/useSprintStore";
import { useBacklogStore } from "@/store/useBacklogStore";
import { useBoardStore } from "@/store/useBoardStore";
import { usePeopleStore } from "@/store/usePeopleStore";
import type {
  BoardTask,
  Epic,
  PlannedSprint,
  Priority,
  UserStory,
} from "@/types";

type StorySeed = { id: string; pt: number; priority?: Priority };

/** Flat backlog store stories for the project (TASK-056). */
function makeStories(seeds: StorySeed[]): UserStory[] {
  return seeds.map((seed, index) => ({
    id: seed.id,
    epicId: "E-1",
    projectId: "p1",
    title: seed.id,
    acceptance_criteria: [],
    estimate_pt: seed.pt,
    priority: seed.priority ?? "mittel",
    rank: index,
    provenance: "agent",
  }));
}

const epics: Epic[] = [
  { id: "E-1", projectId: "p1", title: "Epic", rank: 0 },
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

function seed(options?: {
  storyIds?: string[];
  tasks?: BoardTask[];
}) {
  useSprintStore.setState({
    sprints: [{ ...sprint, storyIds: options?.storyIds ?? sprint.storyIds }],
  });
  useBacklogStore.setState({
    epics,
    stories: makeStories([
      { id: "US-1", pt: 3, priority: "hoch" },
      { id: "US-2", pt: 5, priority: "mittel" },
    ]),
    artifactsMigrated: true,
  });
  useBoardStore.setState({ tasks: options?.tasks ?? [] });
  usePeopleStore.setState({ persons: [], teams: [] });
}

describe("SprintDetail (TASK-053)", () => {
  beforeEach(() => {
    seed();
  });

  it("shows a not-found state for an unknown sprint id", () => {
    render(<SprintDetail id="does-not-exist" />);
    expect(screen.getByTestId("sprint-detail-not-found")).toBeInTheDocument();
  });

  it("renders the header with name, goal, timebox and status badge", () => {
    render(<SprintDetail id="sp1" />);
    expect(screen.getByRole("heading", { name: "Sprint 1" })).toBeInTheDocument();
    expect(screen.getByText("Erstes Inkrement")).toBeInTheDocument();
    expect(screen.getByText("01.07.–14.07.")).toBeInTheDocument();
    // Status badge reflects the set status (deterministic; the derived "Aktiv"
    // badge depends on the real date and is covered by isActiveSprint tests).
    expect(screen.getByText("Geplant")).toBeInTheDocument();
  });

  it("derives progress from the single sprintProgress source (TASK-038)", () => {
    // US-1 (3 PT) done: its only task terminal; US-2 open. → 3/8 PT, 1/2 stories.
    seed({
      tasks: [
        boardTask({ id: "t1", storyId: "US-1", column: "done" }),
        boardTask({ id: "t2", storyId: "US-2", column: "todo" }),
      ],
    });
    render(<SprintDetail id="sp1" />);
    const points = screen.getByTestId("sprint-detail-points");
    expect(points).toHaveTextContent("3 / 8 PT");
    expect(points).toHaveTextContent("1/2");
  });

  it("lists assigned stories and their tasks, and opens the TaskDialog on click", async () => {
    const user = userEvent.setup();
    seed({
      tasks: [boardTask({ id: "t1", storyId: "US-1", title: "Login-Route" })],
    });
    render(<SprintDetail id="sp1" />);

    expect(screen.getByTestId("sprint-detail-story-US-1")).toBeInTheDocument();
    const taskButton = screen.getByTestId("sprint-detail-task-t1");
    expect(taskButton).toHaveTextContent("Login-Route");

    await user.click(taskButton);
    expect(
      screen.getByRole("heading", { name: "Task bearbeiten" }),
    ).toBeInTheDocument();
  });

  it("shows an empty state when no stories are assigned", () => {
    seed({ storyIds: [] });
    render(<SprintDetail id="sp1" />);
    expect(
      screen.getByText(/noch keine Stories zugeordnet/i),
    ).toBeInTheDocument();
  });
});
