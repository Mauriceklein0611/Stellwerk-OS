import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { SprintDetail } from "@/components/sprint/SprintDetail";
import { useSprintStore } from "@/store/useSprintStore";
import { useBacklogStore } from "@/store/useBacklogStore";
import { useBoardStore } from "@/store/useBoardStore";
import { usePeopleStore } from "@/store/usePeopleStore";
import type { Epic, PlannedSprint, SprintRetro, SprintReview } from "@/types";

const epics: Epic[] = [{ id: "E-1", projectId: "p1", title: "Epic", rank: 0 }];

const sprint: PlannedSprint = {
  id: "sp1",
  projectId: "p1",
  name: "Sprint 1",
  goal: "Erstes Inkrement",
  status: "planned",
  storyIds: [],
  order: 0,
};

const review: SprintReview = {
  sprintId: "sp1",
  delivered: "Login geliefert",
  achievedPt: 8,
  id: "rev1",
  scope: "cross",
  createdAt: "2026-03-02T00:00:00.000Z",
};

const retro: SprintRetro = {
  sprintId: "sp1",
  good: [],
  improve: [],
  actions: ["CI reparieren"],
  id: "rt1",
  scope: "cross",
  createdAt: "2026-03-01T00:00:00.000Z",
};

function seed(options?: { reviews?: SprintReview[]; retros?: SprintRetro[] }) {
  useSprintStore.setState({
    sprints: [sprint],
    reviews: options?.reviews ?? [],
    retros: options?.retros ?? [],
  });
  useBacklogStore.setState({ epics, stories: [], artifactsMigrated: true });
  useBoardStore.setState({ tasks: [] });
  usePeopleStore.setState({ persons: [], teams: [] });
}

describe("SprintDetail ceremonies section (TASK-065)", () => {
  beforeEach(() => {
    seed();
  });

  it("shows an empty state when the sprint has no ceremonies", () => {
    render(<SprintDetail id="sp1" />);
    expect(
      screen.getByText(/Noch keine Reviews oder Retros für diesen Sprint/i),
    ).toBeInTheDocument();
  });

  it("lists the sprint's reviews and retros linked to /ceremonies", () => {
    seed({ reviews: [review], retros: [retro] });
    render(<SprintDetail id="sp1" />);

    const list = screen.getByTestId("sprint-detail-ceremonies");
    expect(list).toBeInTheDocument();
    const reviewLink = screen.getByTestId("sprint-detail-ceremony-rev1");
    const retroLink = screen.getByTestId("sprint-detail-ceremony-rt1");
    expect(reviewLink).toHaveAttribute("href", "/ceremonies");
    expect(retroLink).toHaveAttribute("href", "/ceremonies");
  });

  it("only lists ceremonies of this sprint", () => {
    seed({
      retros: [retro, { ...retro, id: "rt-other", sprintId: "sp-other" }],
    });
    render(<SprintDetail id="sp1" />);
    expect(screen.getByTestId("sprint-detail-ceremony-rt1")).toBeInTheDocument();
    expect(
      screen.queryByTestId("sprint-detail-ceremony-rt-other"),
    ).not.toBeInTheDocument();
  });
});
