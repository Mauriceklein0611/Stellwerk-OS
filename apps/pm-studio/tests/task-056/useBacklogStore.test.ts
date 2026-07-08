import { beforeEach, describe, expect, it } from "vitest";

import { useBacklogStore } from "@/store/useBacklogStore";
import { useBoardStore } from "@/store/useBoardStore";
import type { Backlog, BoardTask, Epic, ProjectArtifacts, UserStory } from "@/types";

/**
 * TASK-056: backlog store. Covers CRUD, the delete cascades (epic → stories →
 * detach board tasks), rank reorder, the additive/idempotent importBacklog and
 * the one-time artifact migration.
 */

function epic(id: string, projectId: string, rank = 0): Epic {
  return { id, projectId, title: id, rank };
}

function story(
  id: string,
  projectId: string,
  epicId: string,
  rank = 0,
): UserStory {
  return {
    id,
    epicId,
    projectId,
    title: id,
    acceptance_criteria: [],
    estimate_pt: 3,
    priority: "mittel",
    rank,
    provenance: "agent",
  };
}

function boardTask(id: string, storyId: string): BoardTask {
  return {
    id,
    title: id,
    column: "todo",
    order: 0,
    projectId: "p1",
    projectName: "P1",
    storyId,
    priority: "mittel",
  };
}

const backlog: Backlog = {
  epics: [
    {
      id: "E-1",
      title: "Kern",
      stories: [
        { id: "US-1", title: "A", acceptance_criteria: [], estimate_pt: 2, priority: "hoch" },
        { id: "US-2", title: "B", acceptance_criteria: [], estimate_pt: 5, priority: "mittel" },
      ],
    },
  ],
  sprint_suggestions: [],
};

/** Minimal but fully-typed artifacts bundle carrying the given backlog. */
function makeArtifacts(bl: Backlog): ProjectArtifacts {
  return {
    draft: {
      summary: "",
      vision: "",
      value_proposition: "",
      target_group: "",
      mvp: { description: "", features: [] },
      phases: [],
      initial_risks: [],
      open_questions: [],
    },
    requirements: {
      functional: [],
      non_functional: [],
      technical: [],
      dependencies: [],
      assumptions: [],
      budget_drivers: [],
      time_risks: [],
      clarifications: [],
    },
    backlog: bl,
    risks: { risks: [] },
  };
}

beforeEach(() => {
  useBacklogStore.setState({ epics: [], stories: [], artifactsMigrated: true });
  useBoardStore.setState({ tasks: [] });
});

describe("useBacklogStore CRUD", () => {
  it("adds and updates epics and stories", () => {
    const s = useBacklogStore.getState();
    s.addEpic(epic("E-1", "p1"));
    s.addStory(story("US-1", "p1", "E-1"));
    s.updateEpic("E-1", { title: "Kern-Features" });
    s.updateStory("US-1", { estimate_pt: 8 });

    const state = useBacklogStore.getState();
    expect(state.epics[0].title).toBe("Kern-Features");
    expect(state.stories[0].estimate_pt).toBe(8);
  });

  it("marks an edited agent story as human_edited (explicit provenance wins)", () => {
    const s = useBacklogStore.getState();
    s.addStory(story("US-1", "p1", "E-1"));
    s.updateStory("US-1", { title: "Neuer Titel" });
    expect(useBacklogStore.getState().stories[0].provenance).toBe("human_edited");

    s.updateStory("US-1", { provenance: "human" });
    expect(useBacklogStore.getState().stories[0].provenance).toBe("human");
  });

  it("removeStory drops the story and detaches its board tasks", () => {
    useBoardStore.setState({ tasks: [boardTask("t1", "US-1"), boardTask("t2", "US-2")] });
    const s = useBacklogStore.getState();
    s.addStory(story("US-1", "p1", "E-1"));

    s.removeStory("US-1");

    expect(useBacklogStore.getState().stories).toHaveLength(0);
    const tasks = useBoardStore.getState().tasks;
    expect(tasks.find((t) => t.id === "t1")?.storyId).toBeUndefined();
    expect(tasks.find((t) => t.id === "t2")?.storyId).toBe("US-2");
  });

  it("removeEpic cascade-deletes its stories and detaches their tasks", () => {
    useBoardStore.setState({ tasks: [boardTask("t1", "US-1"), boardTask("t2", "US-2")] });
    const s = useBacklogStore.getState();
    s.addEpic(epic("E-1", "p1"));
    s.addStory(story("US-1", "p1", "E-1"));
    s.addStory(story("US-2", "p1", "E-1"));

    s.removeEpic("E-1");

    const state = useBacklogStore.getState();
    expect(state.epics).toHaveLength(0);
    expect(state.stories).toHaveLength(0);
    const tasks = useBoardStore.getState().tasks;
    expect(tasks.find((t) => t.id === "t1")?.storyId).toBeUndefined();
    expect(tasks.find((t) => t.id === "t2")?.storyId).toBeUndefined();
  });

  it("reorderEpic / reorderStory reassign ranks within their scope", () => {
    const s = useBacklogStore.getState();
    s.addEpic(epic("E-1", "p1", 0));
    s.addEpic(epic("E-2", "p1", 1));
    s.addStory(story("US-1", "p1", "E-1", 0));
    s.addStory(story("US-2", "p1", "E-1", 1));

    s.reorderEpic("p1", "E-2", 0);
    s.reorderStory("E-1", "US-2", 0);

    const state = useBacklogStore.getState();
    const rank = (id: string) =>
      [...state.epics, ...state.stories].find((i) => i.id === id)?.rank;
    expect(rank("E-2")).toBe(0);
    expect(rank("E-1")).toBe(1);
    expect(rank("US-2")).toBe(0);
    expect(rank("US-1")).toBe(1);
  });

  it("removeProjectItems removes a project's entities and detaches their tasks", () => {
    useBoardStore.setState({ tasks: [boardTask("t1", "US-1")] });
    const s = useBacklogStore.getState();
    s.addEpic(epic("E-1", "p1"));
    s.addEpic(epic("E-9", "p2"));
    s.addStory(story("US-1", "p1", "E-1"));
    s.addStory(story("US-9", "p2", "E-9"));

    s.removeProjectItems("p1");

    const state = useBacklogStore.getState();
    expect(state.epics.map((e) => e.id)).toEqual(["E-9"]);
    expect(state.stories.map((st) => st.id)).toEqual(["US-9"]);
    expect(useBoardStore.getState().tasks[0].storyId).toBeUndefined();
  });

  it("restore replaces the whole slice (Undo)", () => {
    const s = useBacklogStore.getState();
    s.addEpic(epic("E-1", "p1"));
    const snapshot = useBacklogStore.getState();
    const before = { epics: snapshot.epics, stories: snapshot.stories };

    s.addStory(story("US-1", "p1", "E-1"));
    s.restore(before);

    expect(useBacklogStore.getState().stories).toHaveLength(0);
    expect(useBacklogStore.getState().epics).toHaveLength(1);
  });
});

describe("importBacklog", () => {
  it("imports a backlog into flat store entities", () => {
    useBacklogStore.getState().importBacklog("p1", backlog, "agent");
    const state = useBacklogStore.getState();
    expect(state.epics.map((e) => e.id)).toEqual(["E-1"]);
    expect(state.stories.map((s) => s.id)).toEqual(["US-1", "US-2"]);
    expect(state.stories.every((s) => s.projectId === "p1")).toBe(true);
  });

  it("is additive & idempotent: a re-run adds nothing and keeps edits", () => {
    const s = useBacklogStore.getState();
    s.importBacklog("p1", backlog);
    s.updateStory("US-1", { title: "Editiert" });

    // Re-run the same pipeline output.
    s.importBacklog("p1", backlog);

    const state = useBacklogStore.getState();
    expect(state.epics).toHaveLength(1);
    expect(state.stories).toHaveLength(2);
    // Existing (edited) story is not overwritten by the re-import.
    expect(state.stories.find((st) => st.id === "US-1")?.title).toBe("Editiert");
  });

  it("appends genuinely new items from a later run", () => {
    const s = useBacklogStore.getState();
    s.importBacklog("p1", backlog);

    const extended: Backlog = {
      epics: [
        ...backlog.epics,
        {
          id: "E-2",
          title: "Neu",
          stories: [
            { id: "US-3", title: "C", acceptance_criteria: [], estimate_pt: 1, priority: "niedrig" },
          ],
        },
      ],
      sprint_suggestions: [],
    };
    s.importBacklog("p1", extended);

    const state = useBacklogStore.getState();
    expect(state.epics.map((e) => e.id)).toEqual(["E-1", "E-2"]);
    expect(state.stories.map((st) => st.id)).toEqual(["US-1", "US-2", "US-3"]);
    // The new epic is ranked after the existing one.
    expect(state.epics.find((e) => e.id === "E-2")?.rank).toBe(1);
  });
});

describe("migrateFromArtifacts", () => {
  it("promotes legacy artifact backlogs exactly once", () => {
    useBacklogStore.setState({ epics: [], stories: [], artifactsMigrated: false });

    const artifacts = { p1: makeArtifacts(backlog) };
    useBacklogStore.getState().migrateFromArtifacts(artifacts);

    let state = useBacklogStore.getState();
    expect(state.artifactsMigrated).toBe(true);
    expect(state.stories.map((s) => s.id)).toEqual(["US-1", "US-2"]);

    // A second call is a no-op (flag already set) – no duplicates.
    useBacklogStore.getState().migrateFromArtifacts(artifacts);
    state = useBacklogStore.getState();
    expect(state.stories).toHaveLength(2);
  });

  it("does nothing when already migrated", () => {
    useBacklogStore.setState({ epics: [], stories: [], artifactsMigrated: true });
    useBacklogStore.getState().migrateFromArtifacts({ p1: makeArtifacts(backlog) });
    expect(useBacklogStore.getState().stories).toHaveLength(0);
  });
});
