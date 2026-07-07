import { beforeEach, describe, expect, it } from "vitest";

import {
  migrateBacklogPersistedState,
  useBacklogStore,
} from "@/store/useBacklogStore";
import { useBoardStore } from "@/store/useBoardStore";
import { useActivityStore } from "@/store/useActivityStore";
import type { Epic, UserStory } from "@/types";

/**
 * TASK-058: the story dialog's new store surface – `moveStoryToEpic`, the v1→v2
 * acceptance-criteria migration and story-level activity logging.
 */

function epic(id: string, rank = 0): Epic {
  return { id, projectId: "p1", title: id, rank };
}

function story(id: string, epicId: string, rank = 0): UserStory {
  return {
    id,
    epicId,
    projectId: "p1",
    title: id,
    acceptance_criteria: [],
    estimate_pt: 3,
    priority: "mittel",
    rank,
    provenance: "agent",
  };
}

beforeEach(() => {
  useBacklogStore.setState({ epics: [], stories: [], artifactsMigrated: true });
  useBoardStore.setState({ tasks: [] });
  useActivityStore.setState({ events: [] });
});

function storyEvents(entityId: string) {
  return useActivityStore
    .getState()
    .events.filter(
      (event) => event.entityType === "story" && event.entityId === entityId,
    );
}

describe("moveStoryToEpic", () => {
  it("moves a story, re-ranks it at the end of the target epic and bumps provenance", () => {
    const s = useBacklogStore.getState();
    s.addEpic(epic("E-1"));
    s.addEpic(epic("E-2", 1));
    s.addStory(story("US-1", "E-1"));
    s.addStory(story("US-2", "E-2", 0));
    s.addStory(story("US-3", "E-2", 1));

    useBacklogStore.getState().moveStoryToEpic("US-1", "E-2");

    const moved = useBacklogStore.getState().stories.find((x) => x.id === "US-1")!;
    expect(moved.epicId).toBe("E-2");
    // Ranked at the end of E-2 (which already had US-2, US-3).
    expect(moved.rank).toBe(2);
    // An agent story becomes human_edited once touched (TASK-060 basis).
    expect(moved.provenance).toBe("human_edited");
  });

  it("is a no-op when the story already sits in the target epic or is unknown", () => {
    const s = useBacklogStore.getState();
    s.addEpic(epic("E-1"));
    s.addStory(story("US-1", "E-1"));
    useActivityStore.setState({ events: [] });

    useBacklogStore.getState().moveStoryToEpic("US-1", "E-1");
    useBacklogStore.getState().moveStoryToEpic("ghost", "E-1");

    expect(storyEvents("US-1")).toHaveLength(0);
    expect(storyEvents("ghost")).toHaveLength(0);
  });
});

describe("story activity logging (granularity like TASK-043)", () => {
  it("logs create, update, delete and move – but NOT reorder", () => {
    const s = useBacklogStore.getState();
    s.addEpic(epic("E-1"));
    s.addEpic(epic("E-2", 1));
    s.addStory(story("US-1", "E-1"));
    s.addStory(story("US-2", "E-1", 1));

    useBacklogStore.getState().updateStory("US-1", { title: "Neu" });
    // Pure reordering must stay out of the history.
    useBacklogStore.getState().reorderStory("E-1", "US-1", 1);
    useBacklogStore.getState().moveStoryToEpic("US-1", "E-2");
    useBacklogStore.getState().removeStory("US-1");

    const kinds = storyEvents("US-1").map((e) => e.kind);
    // create, update (edit), update (move), delete – reorder produced nothing.
    expect(kinds).toEqual(["create", "update", "update", "delete"]);
  });
});

describe("migrateBacklogPersistedState (v1 → v2)", () => {
  it("lifts string acceptance criteria into checkable criteria", () => {
    const v1 = {
      epics: [epic("E-1")],
      stories: [
        { ...story("US-1", "E-1"), acceptance_criteria: ["AK eins", "AK zwei"] },
      ],
      artifactsMigrated: true,
    };

    const migrated = migrateBacklogPersistedState(v1, 1);
    const criteria = migrated.stories[0].acceptance_criteria;
    expect(criteria).toHaveLength(2);
    expect(criteria[0]).toMatchObject({ text: "AK eins", done: false });
    expect(criteria[1]).toMatchObject({ text: "AK zwei", done: false });
    expect(typeof (criteria[0] as { id: string }).id).toBe("string");
  });

  it("passes an already-v2 state through untouched", () => {
    const v2 = {
      epics: [epic("E-1")],
      stories: [story("US-1", "E-1")],
      artifactsMigrated: true,
    };
    expect(migrateBacklogPersistedState(v2, 2)).toBe(v2);
  });
});
