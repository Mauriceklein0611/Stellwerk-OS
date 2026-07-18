import { beforeEach, describe, expect, it } from "vitest";

import { useProjectStore } from "@/store/useProjectStore";
import type { ProjectIdea } from "@/types";

const makeIdea = (id: string): ProjectIdea => ({
  id,
  createdAt: new Date().toISOString(),
  status: "idea",
  name: `Idea ${id}`,
  description: "desc",
  problem: "problem",
  features: [],
  approach: "agil",
});

beforeEach(() => {
  useProjectStore.setState({ ideas: [] });
});

describe("useProjectStore", () => {
  it("prepends a newly added idea", () => {
    useProjectStore.getState().addIdea(makeIdea("1"));
    useProjectStore.getState().addIdea(makeIdea("2"));

    expect(useProjectStore.getState().ideas.map((i) => i.id)).toEqual(["2", "1"]);
  });

  it("removes an idea by id", () => {
    useProjectStore.getState().addIdea(makeIdea("1"));
    useProjectStore.getState().addIdea(makeIdea("2"));
    useProjectStore.getState().removeIdea("1");

    expect(useProjectStore.getState().ideas.map((i) => i.id)).toEqual(["2"]);
  });
});
