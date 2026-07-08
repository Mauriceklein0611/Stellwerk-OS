import { beforeEach, describe, expect, it } from "vitest";

import { useBacklogStore } from "@/store/useBacklogStore";
import { useReleaseStore } from "@/store/useReleaseStore";
import type { Release, UserStory } from "@/types";

/**
 * TASK-062: deleting a release must not leave a dangling `releaseId` on any
 * story. `useBacklogStore.detachRelease` unlinks the stories; `removeRelease`
 * wires that cascade in (same pattern as useTagStore.removeTag → detachTag).
 */

function story(id: string, releaseId?: string): UserStory {
  return {
    id,
    epicId: "E-1",
    projectId: "p1",
    title: id,
    acceptance_criteria: [],
    estimate_pt: 1,
    priority: "mittel",
    rank: 0,
    provenance: "human",
    releaseId,
  };
}

function release(id: string): Release {
  return {
    id,
    projectId: "p1",
    name: `Release ${id}`,
    status: "planned",
    startDate: "2026-07-01",
    endDate: "2026-07-28",
    sprintLengthWeeks: 2,
  };
}

beforeEach(() => {
  useBacklogStore.setState({ epics: [], stories: [], artifactsMigrated: true });
  useReleaseStore.setState({ releases: [] });
});

describe("useBacklogStore.detachRelease (TASK-062)", () => {
  it("clears releaseId on matching stories and leaves the rest untouched", () => {
    useBacklogStore.setState({
      stories: [story("st1", "r1"), story("st2", "r2"), story("st3")],
    });

    useBacklogStore.getState().detachRelease("r1");

    const stories = useBacklogStore.getState().stories;
    expect(stories.find((s) => s.id === "st1")?.releaseId).toBeUndefined();
    expect(stories.find((s) => s.id === "st2")?.releaseId).toBe("r2");
    expect(stories.find((s) => s.id === "st3")?.releaseId).toBeUndefined();
    // Stories are never dropped, only unlinked.
    expect(stories).toHaveLength(3);
  });
});

describe("useReleaseStore.removeRelease cascade (TASK-062)", () => {
  it("detaches the deleted release from every story", () => {
    useReleaseStore.setState({ releases: [release("r1"), release("r2")] });
    useBacklogStore.setState({
      stories: [story("st1", "r1"), story("st2", "r1"), story("st3", "r2")],
    });

    useReleaseStore.getState().removeRelease("r1");

    const stories = useBacklogStore.getState().stories;
    expect(stories.every((s) => s.releaseId !== "r1")).toBe(true);
    // The other release's assignment stays intact.
    expect(stories.find((s) => s.id === "st3")?.releaseId).toBe("r2");
    expect(useReleaseStore.getState().releases.map((r) => r.id)).toEqual(["r2"]);
  });
});
