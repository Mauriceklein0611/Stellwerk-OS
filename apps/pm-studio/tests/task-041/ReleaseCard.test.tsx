import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReleaseCard } from "@/components/release/ReleaseCard";
import type { ReleaseProgress, ReleaseScope } from "@/lib/release";
import type { PlannedSprint, Release } from "@/types";

function release(patch: Partial<Release> = {}): Release {
  return {
    id: "r1",
    projectId: "p1",
    name: "Release Q3",
    status: "active",
    startDate: "2026-07-01",
    endDate: "2026-07-28",
    sprintLengthWeeks: 2,
    ...patch,
  };
}

function sprint(patch: Partial<PlannedSprint>): PlannedSprint {
  return {
    id: "s1",
    projectId: "p1",
    name: "Sprint 1",
    goal: "",
    status: "planned",
    storyIds: [],
    order: 0,
    ...patch,
  };
}

const progress: ReleaseProgress = {
  donePt: 3,
  plannedPt: 8,
  doneCount: 1,
  total: 2,
  sprintCount: 2,
};

const scope: ReleaseScope = {
  storyCount: 0,
  plannedPt: 0,
  donePt: 0,
  doneCount: 0,
};

const noop = () => {};

describe("ReleaseCard (TASK-041)", () => {
  it("renders the release status as a StatusBadge", () => {
    render(
      <ReleaseCard
        release={release({ status: "active" })}
        progress={progress}
        scope={scope}
        sprints={[]}
        onEdit={noop}
        onRegenerate={noop}
      />,
    );
    expect(screen.getByText("Aktiv")).toBeInTheDocument();
  });

  it("shows the computed scope and progress numbers", () => {
    render(
      <ReleaseCard
        release={release()}
        progress={progress}
        scope={scope}
        sprints={[]}
        onEdit={noop}
        onRegenerate={noop}
      />,
    );
    expect(screen.getByText("Sprints: 2 Stories · 8 PT")).toBeInTheDocument();
    expect(screen.getByTestId("release-progress-r1")).toHaveTextContent(
      "erledigt 3 / 8 PT · 1/2",
    );
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "3");
    expect(bar).toHaveAttribute("aria-valuemax", "8");
  });

  it("lists the release's sprints in the timeline and marks the active one", () => {
    render(
      <ReleaseCard
        release={release()}
        progress={progress}
        scope={scope}
        sprints={[
          sprint({ id: "s1", name: "Sprint 1", startDate: "2026-07-01", endDate: "2026-07-14" }),
          sprint({ id: "s2", name: "Sprint 2", startDate: "2026-07-15", endDate: "2026-07-28" }),
        ]}
        today="2026-07-20"
        onEdit={noop}
        onRegenerate={noop}
      />,
    );
    expect(screen.getByText("Sprint 1")).toBeInTheDocument();
    expect(screen.getByText("Sprint 2")).toBeInTheDocument();
    // Sprint 2's timebox contains "today" → highlighted as active.
    expect(screen.getByTestId("release-timeline-sprint-s2")).toHaveAttribute(
      "data-active",
      "true",
    );
    expect(screen.getByTestId("release-timeline-sprint-s1")).toHaveAttribute(
      "data-active",
      "false",
    );
  });

  it("shows an empty-state hint when the release has no sprints", () => {
    render(
      <ReleaseCard
        release={release()}
        progress={{ ...progress, sprintCount: 0 }}
        scope={scope}
        sprints={[]}
        onEdit={noop}
        onRegenerate={noop}
      />,
    );
    expect(
      screen.getByText(/Noch keine Sprints/),
    ).toBeInTheDocument();
  });
});
