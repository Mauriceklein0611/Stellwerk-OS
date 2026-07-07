import { beforeEach, describe, expect, it } from "vitest";

import { useSprintStore } from "@/store/useSprintStore";
import type { SprintRetro, SprintReview } from "@/types";

function reset() {
  useSprintStore.setState({ sprints: [], reviews: [], retros: [] });
}

const review = (sprintId: string, overrides: Partial<SprintReview> = {}): SprintReview => ({
  sprintId,
  delivered: "Login + Profil",
  achievedPt: 5,
  id: crypto.randomUUID(),
  scope: "cross",
  createdAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

const retro = (sprintId: string, overrides: Partial<SprintRetro> = {}): SprintRetro => ({
  sprintId,
  good: ["Gute Abstimmung"],
  improve: ["Weniger WIP"],
  actions: ["Daily kürzen"],
  id: crypto.randomUUID(),
  scope: "cross",
  createdAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("useSprintStore – reviews & retros (TASK-018 → TASK-054 list model)", () => {
  beforeEach(reset);

  it("addReview appends a review", () => {
    const r = review("s1");
    useSprintStore.getState().addReview(r);
    expect(useSprintStore.getState().reviews).toEqual([r]);
  });

  it("addReview keeps several reviews of the same sprint (no upsert)", () => {
    const { addReview } = useSprintStore.getState();
    addReview(review("s1", { achievedPt: 5 }));
    addReview(review("s1", { achievedPt: 8, delivered: "Mehr" }));

    const reviews = useSprintStore.getState().reviews;
    expect(reviews).toHaveLength(2);
    expect(reviews[1]).toMatchObject({ sprintId: "s1", achievedPt: 8, delivered: "Mehr" });
  });

  it("addRetro appends a retro (several per sprint)", () => {
    const { addRetro } = useSprintStore.getState();
    addRetro(retro("s1"));
    addRetro(retro("s1", { good: ["Neu"] }));

    const retros = useSprintStore.getState().retros;
    expect(retros).toHaveLength(2);
    expect(retros[1].good).toEqual(["Neu"]);
  });

  it("keeps reviews/retros of different sprints apart", () => {
    const { addReview, addRetro } = useSprintStore.getState();
    addReview(review("s1"));
    addReview(review("s2", { achievedPt: 13 }));
    addRetro(retro("s1"));

    expect(useSprintStore.getState().reviews).toHaveLength(2);
    expect(
      useSprintStore.getState().reviews.find((r) => r.sprintId === "s2")?.achievedPt,
    ).toBe(13);
  });

  it("removeSprint drops the sprint's reviews and retros", () => {
    const { addSprint, addReview, addRetro, removeSprint } = useSprintStore.getState();
    addSprint({ id: "s1", projectId: "p-1", name: "S1", goal: "", status: "active", storyIds: [] });
    addReview(review("s1"));
    addReview(review("s1", { delivered: "Zweite" }));
    addRetro(retro("s1"));
    addReview(review("s2"));

    removeSprint("s1");

    const state = useSprintStore.getState();
    expect(state.reviews.some((r) => r.sprintId === "s1")).toBe(false);
    expect(state.retros.some((r) => r.sprintId === "s1")).toBe(false);
    // Other sprints' data is untouched.
    expect(state.reviews.some((r) => r.sprintId === "s2")).toBe(true);
  });
});
