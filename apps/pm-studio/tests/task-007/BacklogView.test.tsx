import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BacklogView } from "@/components/project/BacklogView";
import { useBacklogStore } from "@/store/useBacklogStore";
import type { Epic, SprintSuggestion, UserStory } from "@/types";

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
    acceptance_criteria: [
      { id: "ac-1", text: "AK eins", done: false },
      { id: "ac-2", text: "AK zwei", done: false },
    ],
    estimate_pt: 2,
    priority: "hoch",
    rank: 0,
    provenance: "agent",
  },
  {
    id: "US-Q1",
    epicId: "E-2",
    projectId: "P-1",
    title: "Automatisierte Tests",
    acceptance_criteria: [
      { id: "ac-3", text: "AK a", done: false },
      { id: "ac-4", text: "AK b", done: false },
    ],
    estimate_pt: 4,
    priority: "mittel",
    rank: 0,
    provenance: "agent",
  },
];

const sprintSuggestions: SprintSuggestion[] = [
  { name: "Sprint 1", goal: "Ziel", story_ids: ["US-1"] },
];

describe("BacklogView", () => {
  it("renders epics, and the open epic's stories with acceptance criteria", () => {
    useBacklogStore.setState({ epics, stories, artifactsMigrated: true });
    render(
      <BacklogView
        projectId="P-1"
        projectName="Demo-Projekt"
        sprintSuggestions={sprintSuggestions}
      />,
    );

    // Epic titles are always rendered (accordion triggers).
    expect(screen.getByText("Kern-Features")).toBeInTheDocument();
    expect(screen.getByText("Qualität & Tests")).toBeInTheDocument();

    // First epic is open by default -> its story + AKs + priority are visible.
    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(screen.getByText("AK eins")).toBeInTheDocument();
    // "Hoch" appears both as the story badge and as the StoryTasks add-form's
    // default priority (TASK-037), so assert it is present rather than unique.
    expect(screen.getAllByText("Hoch").length).toBeGreaterThan(0);
  });
});
