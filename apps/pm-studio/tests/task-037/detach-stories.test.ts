import { beforeEach, describe, expect, it } from "vitest";

import { useBoardStore } from "@/store/useBoardStore";
import { useProjectStore } from "@/store/useProjectStore";
import { useBacklogStore } from "@/store/useBacklogStore";
import type { BoardTask, Epic, ProjectArtifacts, UserStory } from "@/types";

const base: Omit<BoardTask, "id" | "column" | "order" | "storyId"> = {
  title: "Task",
  projectId: "idea-1",
  projectName: "Projekt",
  priority: "mittel",
};

/** Minimal but fully-typed artifacts bundle carrying the given story ids. */
function makeArtifacts(storyIds: string[]): ProjectArtifacts {
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
    backlog: {
      epics: [
        {
          id: "E-1",
          title: "Epic",
          stories: storyIds.map((id) => ({
            id,
            title: id,
            acceptance_criteria: [],
            estimate_pt: 1,
            priority: "mittel" as const,
          })),
        },
      ],
      sprint_suggestions: [],
    },
    risks: { risks: [] },
  };
}

function epic(id: string, projectId: string): Epic {
  return { id, projectId, title: id, rank: 0 };
}

function story(id: string, projectId: string, epicId = "E-1"): UserStory {
  return {
    id,
    epicId,
    projectId,
    title: id,
    acceptance_criteria: [],
    estimate_pt: 1,
    priority: "mittel",
    rank: 0,
    provenance: "agent",
  };
}

beforeEach(() => {
  useBoardStore.setState({ tasks: [] });
  useProjectStore.setState({ ideas: [], artifacts: {} });
  useBacklogStore.setState({ epics: [], stories: [], artifactsMigrated: true });
});

describe("useBoardStore.detachStory", () => {
  it("drops the storyId from a story's tasks but keeps the tasks", () => {
    const { addTask, detachStory } = useBoardStore.getState();
    addTask({ id: "1", column: "todo", storyId: "US-1", ...base });
    addTask({ id: "2", column: "todo", storyId: "US-2", ...base });

    detachStory("US-1");

    const tasks = useBoardStore.getState().tasks;
    expect(tasks).toHaveLength(2);
    expect(tasks.find((t) => t.id === "1")?.storyId).toBeUndefined();
    expect(tasks.find((t) => t.id === "2")?.storyId).toBe("US-2");
  });
});

describe("useProjectStore decouples stories on deletion (TASK-056)", () => {
  it("removeIdea cascades through the backlog store and detaches story tasks", () => {
    // Since TASK-056 the story lives in the backlog store; removeIdea routes the
    // cascade there (remove its epics/stories + detach their board tasks).
    useProjectStore.setState({ artifacts: { "idea-1": makeArtifacts(["US-1"]) } });
    useBacklogStore.setState({
      epics: [epic("E-1", "idea-1")],
      stories: [story("US-1", "idea-1")],
      artifactsMigrated: true,
    });
    useBoardStore.getState().addTask({ id: "1", column: "todo", storyId: "US-1", ...base });

    useProjectStore.getState().removeIdea("idea-1");

    expect(useBoardStore.getState().tasks.find((t) => t.id === "1")?.storyId).toBeUndefined();
    // The backlog entities of the deleted project are gone too.
    expect(useBacklogStore.getState().stories).toHaveLength(0);
    expect(useBacklogStore.getState().epics).toHaveLength(0);
  });

  it("setArtifacts no longer detaches tasks (a re-run is additive)", () => {
    // TASK-056: regenerating the backlog keeps existing stories/tasks – the
    // artifact is just a run snapshot, importBacklog is additive elsewhere.
    useBoardStore.getState().addTask({ id: "1", column: "todo", storyId: "US-1", ...base });
    useBoardStore.getState().addTask({ id: "2", column: "todo", storyId: "US-2", ...base });

    useProjectStore.getState().setArtifacts("idea-1", makeArtifacts(["US-1", "US-2"]));
    useProjectStore.getState().setArtifacts("idea-1", makeArtifacts(["US-2", "US-3"]));

    const tasks = useBoardStore.getState().tasks;
    expect(tasks.find((t) => t.id === "1")?.storyId).toBe("US-1");
    expect(tasks.find((t) => t.id === "2")?.storyId).toBe("US-2");
  });
});
