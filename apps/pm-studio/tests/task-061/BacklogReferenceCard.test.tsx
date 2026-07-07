import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { BacklogReferenceCard } from "@/components/project/BacklogReferenceCard";
import { useBacklogStore } from "@/store/useBacklogStore";
import type { Epic, UserStory } from "@/types";

const epics: Epic[] = [
  { id: "E-1", projectId: "P-1", title: "Kern", rank: 0 },
  { id: "E-2", projectId: "P-2", title: "Anderes Projekt", rank: 0 },
];

const stories: UserStory[] = [
  {
    id: "US-1",
    epicId: "E-1",
    projectId: "P-1",
    title: "Login",
    acceptance_criteria: [],
    estimate_pt: 3,
    priority: "hoch",
    rank: 0,
    provenance: "agent",
  },
  {
    id: "US-2",
    epicId: "E-1",
    projectId: "P-1",
    title: "Logout",
    acceptance_criteria: [],
    estimate_pt: 5,
    priority: "mittel",
    rank: 1,
    provenance: "agent",
  },
  // Belongs to another project – must not be counted.
  {
    id: "US-3",
    epicId: "E-2",
    projectId: "P-2",
    title: "Fremd",
    acceptance_criteria: [],
    estimate_pt: 8,
    priority: "mittel",
    rank: 0,
    provenance: "agent",
  },
];

beforeEach(() => {
  useBacklogStore.setState({ epics, stories, artifactsMigrated: true });
});

describe("BacklogReferenceCard (TASK-061)", () => {
  it("shows the rollup scoped to the project (epics/stories/Σ PT)", () => {
    render(<BacklogReferenceCard projectId="P-1" />);

    // 1 epic, 2 stories, 8 PT for P-1 (US-3 of P-2 is excluded).
    expect(screen.getByText("Epics").previousSibling).toHaveTextContent("1");
    expect(screen.getByText("Stories").previousSibling).toHaveTextContent("2");
    expect(screen.getByText("Σ PT").previousSibling).toHaveTextContent("8");
  });

  it("deep-links into the backlog workspace for the project", () => {
    render(<BacklogReferenceCard projectId="P-1" />);
    const link = screen.getByTestId("project-backlog-open");
    expect(link).toHaveAttribute("href", "/backlog?project=P-1");
  });

  it("renders a zero rollup for a project without a backlog", () => {
    render(<BacklogReferenceCard projectId="P-empty" />);
    expect(screen.getByText("Epics").previousSibling).toHaveTextContent("0");
    expect(screen.getByText("Stories").previousSibling).toHaveTextContent("0");
  });
});
