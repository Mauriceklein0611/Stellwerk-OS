import { beforeEach, describe, expect, it } from "vitest";

import { useSprintStore } from "@/store/useSprintStore";
import type { CeremonyComment, SprintRetro, SprintReview } from "@/types";

const review: SprintReview = {
  sprintId: "s1",
  delivered: "Login",
  achievedPt: 5,
  id: "r1",
  scope: "cross",
  createdAt: "2026-03-01T00:00:00.000Z",
};

const retro: SprintRetro = {
  sprintId: "s1",
  good: ["gut"],
  improve: [],
  actions: [],
  id: "rt1",
  scope: "cross",
  createdAt: "2026-03-01T00:00:00.000Z",
};

const comment: CeremonyComment = {
  id: "c1",
  author: "Mia",
  text: "danke",
  createdAt: "2026-03-02T00:00:00.000Z",
};

beforeEach(() => {
  useSprintStore.setState({
    sprints: [],
    reviews: [{ ...review }],
    retros: [{ ...retro }],
  });
});

describe("useSprintStore ceremony links (TASK-055)", () => {
  it("toggles a linked story on the matching review", () => {
    useSprintStore.getState().toggleCeremonyStory("review", "r1", "story-9");
    expect(useSprintStore.getState().reviews[0].linkedStoryIds).toEqual(["story-9"]);

    // Toggling again removes it.
    useSprintStore.getState().toggleCeremonyStory("review", "r1", "story-9");
    expect(useSprintStore.getState().reviews[0].linkedStoryIds).toEqual([]);
    // Retro untouched.
    expect(useSprintStore.getState().retros[0].linkedStoryIds).toBeUndefined();
  });

  it("toggles a linked task on the matching retro", () => {
    useSprintStore.getState().toggleCeremonyTask("retro", "rt1", "task-3");
    expect(useSprintStore.getState().retros[0].linkedTaskIds).toEqual(["task-3"]);
    expect(useSprintStore.getState().reviews[0].linkedTaskIds).toBeUndefined();
  });

  it("leaves entries with a non-matching id untouched", () => {
    useSprintStore.getState().toggleCeremonyStory("review", "nope", "x");
    expect(useSprintStore.getState().reviews[0].linkedStoryIds).toBeUndefined();
  });
});

describe("useSprintStore ceremony comments (TASK-055)", () => {
  it("adds and removes a comment on a review", () => {
    useSprintStore.getState().addCeremonyComment("review", "r1", comment);
    expect(useSprintStore.getState().reviews[0].comments).toEqual([comment]);

    useSprintStore.getState().removeCeremonyComment("review", "r1", "c1");
    expect(useSprintStore.getState().reviews[0].comments).toEqual([]);
  });

  it("adds a comment on a retro independently", () => {
    useSprintStore.getState().addCeremonyComment("retro", "rt1", comment);
    expect(useSprintStore.getState().retros[0].comments).toEqual([comment]);
    expect(useSprintStore.getState().reviews[0].comments).toBeUndefined();
  });
});
