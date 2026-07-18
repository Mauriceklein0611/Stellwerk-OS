import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CeremonyHistory } from "@/components/ceremony/CeremonyHistory";
import { ceremonyHistory } from "@/lib/ceremonies";
import type { SprintRetro, SprintReview, Team } from "@/types";

const teams: Team[] = [{ id: "t1", name: "Core" }];
const sprintLabel = (id: string) => (id === "s1" ? "Projekt A · Sprint 1" : id);

const review: SprintReview = {
  sprintId: "s1",
  delivered: "Login geliefert",
  achievedPt: 8,
  id: "r1",
  scope: "team",
  teamId: "t1",
  createdAt: "2026-03-02T00:00:00.000Z",
};

const retro: SprintRetro = {
  sprintId: "s1",
  good: ["Gute Abstimmung"],
  improve: ["Weniger WIP"],
  actions: [],
  id: "rt1",
  scope: "cross",
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("CeremonyHistory (TASK-054)", () => {
  it("shows an empty state without entries", () => {
    render(<CeremonyHistory entries={[]} sprintLabel={sprintLabel} teams={teams} />);
    expect(screen.getByText(/Noch keine Reviews oder Retros/)).toBeInTheDocument();
  });

  it("renders reviews and retros newest first with scope + sprint label", () => {
    render(
      <CeremonyHistory
        entries={ceremonyHistory([review], [retro])}
        sprintLabel={sprintLabel}
        teams={teams}
      />,
    );

    const items = screen.getAllByTestId("ceremony-entry");
    expect(items).toHaveLength(2);
    // Newest (review, March) first.
    expect(items[0]).toHaveAttribute("data-kind", "review");
    expect(items[1]).toHaveAttribute("data-kind", "retro");

    expect(screen.getByText("Login geliefert")).toBeInTheDocument();
    expect(screen.getByText("Team: Core")).toBeInTheDocument();
    expect(screen.getAllByText("Projekt A · Sprint 1")).toHaveLength(2);
    expect(screen.getByText(/Gute Abstimmung/)).toBeInTheDocument();
  });

  it("labels a legacy epoch timestamp as unknown", () => {
    const legacy: SprintReview = { ...review, id: "r-legacy", createdAt: new Date(0).toISOString() };
    render(
      <CeremonyHistory
        entries={ceremonyHistory([legacy], [])}
        sprintLabel={sprintLabel}
        teams={teams}
      />,
    );
    expect(screen.getByText("Datum unbekannt")).toBeInTheDocument();
  });
});
