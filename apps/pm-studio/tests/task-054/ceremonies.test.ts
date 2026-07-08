import { describe, expect, it } from "vitest";

import {
  ceremonyHistory,
  createRetro,
  createReview,
  isCeremonyInputValid,
  scopeLabel,
} from "@/lib/ceremonies";
import type { RetroContent, ReviewContent, SprintRetro, SprintReview, Team } from "@/types";

const reviewContent: ReviewContent = {
  sprintId: "s1",
  delivered: "Login",
  achievedPt: 5,
};

const retroContent: RetroContent = {
  sprintId: "s1",
  good: ["gut"],
  improve: ["besser"],
  actions: ["tun"],
};

describe("createReview / createRetro (TASK-054)", () => {
  it("adds injected id + createdAt and keeps the content", () => {
    const review = createReview(reviewContent, { scope: "cross" }, {
      id: "r1",
      now: "2026-07-02T10:00:00.000Z",
    });
    expect(review).toEqual({
      sprintId: "s1",
      delivered: "Login",
      achievedPt: 5,
      id: "r1",
      scope: "cross",
      createdAt: "2026-07-02T10:00:00.000Z",
    });
  });

  it("keeps teamId only for team scope", () => {
    const team = createReview(reviewContent, { scope: "team", teamId: "t1" }, { id: "r1", now: "x" });
    expect(team.teamId).toBe("t1");

    // teamId supplied but non-team scope → dropped, never dangles.
    const cross = createReview(reviewContent, { scope: "cross", teamId: "t1" }, { id: "r2", now: "x" });
    expect("teamId" in cross).toBe(false);
  });

  it("createRetro builds a retro with metadata", () => {
    const retro = createRetro(retroContent, { scope: "project" }, { id: "rt1", now: "x" });
    expect(retro).toMatchObject({ id: "rt1", scope: "project", good: ["gut"] });
  });

  it("generates a random id/createdAt when no options are given", () => {
    const a = createReview(reviewContent, { scope: "cross" });
    const b = createReview(reviewContent, { scope: "cross" });
    expect(a.id).not.toBe(b.id);
    expect(a.createdAt).toBeTruthy();
  });
});

describe("isCeremonyInputValid", () => {
  it("requires a team for team scope", () => {
    expect(isCeremonyInputValid({ scope: "team" })).toBe(false);
    expect(isCeremonyInputValid({ scope: "team", teamId: "t1" })).toBe(true);
  });

  it("accepts cross/project without a team", () => {
    expect(isCeremonyInputValid({ scope: "cross" })).toBe(true);
    expect(isCeremonyInputValid({ scope: "project" })).toBe(true);
  });
});

describe("scopeLabel", () => {
  const teams: Team[] = [{ id: "t1", name: "Core" }];

  it("labels cross/project without a team", () => {
    expect(scopeLabel("cross", undefined, teams)).toBe("Team-übergreifend");
    expect(scopeLabel("project", undefined, teams)).toBe("Projekt");
  });

  it("appends the team name for team scope", () => {
    expect(scopeLabel("team", "t1", teams)).toBe("Team: Core");
  });

  it("falls back when the team is unknown", () => {
    expect(scopeLabel("team", "gone", teams)).toBe("Team");
  });
});

describe("ceremonyHistory", () => {
  const review = (id: string, createdAt: string): SprintReview => ({
    sprintId: "s1",
    delivered: "d",
    achievedPt: 1,
    id,
    scope: "cross",
    createdAt,
  });
  const retro = (id: string, createdAt: string): SprintRetro => ({
    sprintId: "s1",
    good: [],
    improve: [],
    actions: [],
    id,
    scope: "cross",
    createdAt,
  });

  it("merges reviews and retros newest first", () => {
    const entries = ceremonyHistory(
      [review("r1", "2026-01-01T00:00:00.000Z"), review("r2", "2026-03-01T00:00:00.000Z")],
      [retro("rt1", "2026-02-01T00:00:00.000Z")],
    );
    expect(entries.map((e) => (e.kind === "review" ? e.review.id : e.retro.id))).toEqual([
      "r2",
      "rt1",
      "r1",
    ]);
  });

  it("returns an empty history for no entries", () => {
    expect(ceremonyHistory([], [])).toEqual([]);
  });
});
