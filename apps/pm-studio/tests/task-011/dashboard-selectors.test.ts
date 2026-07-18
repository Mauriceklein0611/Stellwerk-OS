import { describe, expect, it } from "vitest";

import {
  selectMetrics,
  selectProjects,
  selectTaskStatusDistribution,
  selectVelocity,
} from "@/lib/dashboard-selectors";
import type {
  BoardTask,
  ProjectArtifacts,
  ProjectIdea,
  RiskEntry,
  UserStory,
} from "@/types";

function makeIdea(id: string, name: string): ProjectIdea {
  return {
    id,
    name,
    createdAt: "2026-06-15T00:00:00.000Z",
    status: "idea",
    description: "",
    problem: "",
    features: [],
    approach: "agil",
  };
}

function makeTask(
  id: string,
  projectId: string,
  column: BoardTask["column"],
  storyId?: string,
): BoardTask {
  return {
    id,
    title: id,
    column,
    order: 0,
    projectId,
    projectName: projectId,
    storyId,
    priority: "mittel",
  };
}

const artifacts: Record<string, ProjectArtifacts> = {
  "p-1": {
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
          stories: [
            { id: "US-1", title: "A", acceptance_criteria: [], estimate_pt: 3, priority: "hoch" },
            { id: "US-2", title: "B", acceptance_criteria: [], estimate_pt: 5, priority: "mittel" },
          ],
        },
      ],
      sprint_suggestions: [
        { name: "Sprint 1", goal: "g", story_ids: ["US-1", "US-2"] },
      ],
    },
    risks: {
      risks: [
        {
          id: "R-1",
          title: "Risk",
          probability: "mittel",
          impact: "hoch",
          mitigation: "",
          priority: "hoch",
          escalation: "",
          status: "open",
        },
      ],
    },
  },
};

// Backlog store stories (TASK-056) – counts/velocity read from here now.
const stories: UserStory[] = [
  { id: "US-1", epicId: "E-1", projectId: "p-1", title: "A", acceptance_criteria: [], estimate_pt: 3, priority: "hoch", rank: 0, provenance: "agent" },
  { id: "US-2", epicId: "E-1", projectId: "p-1", title: "B", acceptance_criteria: [], estimate_pt: 5, priority: "mittel", rank: 1, provenance: "agent" },
];

// Risks come from the risk store (TASK-061), passed as a flat array.
const risks: RiskEntry[] = [
  {
    id: "R-1",
    title: "Scope-Creep",
    probability: "mittel",
    impact: "hoch",
    priority: "hoch",
    status: "open",
  },
];

describe("dashboard selectors", () => {
  it("selectMetrics counts projects, sprints, stories and risks", () => {
    const ideas = [makeIdea("p-1", "Projekt Eins")];
    const metrics = selectMetrics(ideas, artifacts, stories, risks);
    const value = (id: string) => metrics.find((m) => m.id === id)?.value;

    expect(value("active-projects")).toBe(1);
    expect(value("planned-sprints")).toBe(1);
    expect(value("open-tasks")).toBe(2);
    expect(value("open-risks")).toBe(1);
  });

  it("selectMetrics returns zeros for an empty workspace", () => {
    const metrics = selectMetrics([], {}, [], []);
    expect(metrics.map((m) => m.value)).toEqual([0, 0, 0, 0]);
  });

  it("selectProjects derives progress from done board tasks", () => {
    const ideas = [makeIdea("p-1", "Projekt Eins"), makeIdea("p-2", "Projekt Zwei")];
    const tasks = [
      makeTask("t1", "p-1", "done"),
      makeTask("t2", "p-1", "todo"),
      makeTask("t3", "p-1", "in_progress"),
      makeTask("t4", "p-1", "done"),
    ];

    const projects = selectProjects(ideas, tasks);
    const p1 = projects.find((p) => p.id === "p-1");
    const p2 = projects.find((p) => p.id === "p-2");

    expect(p1?.progress).toBe(50); // 2 of 4 done
    expect(p1?.status).toBe("running");
    expect(p2?.progress).toBe(0); // no tasks
    expect(p2?.status).toBe("idle");
  });

  it("selectProjects marks a fully done project as success", () => {
    const projects = selectProjects([makeIdea("p-1", "P")], [makeTask("t1", "p-1", "done")]);
    expect(projects[0].progress).toBe(100);
    expect(projects[0].status).toBe("success");
  });

  it("selectTaskStatusDistribution collapses columns into unique statuses", () => {
    const tasks = [
      makeTask("t1", "p-1", "backlog"),
      makeTask("t2", "p-1", "todo"),
      makeTask("t3", "p-1", "in_progress"),
      makeTask("t4", "p-1", "review"),
      makeTask("t5", "p-1", "testing"),
      makeTask("t6", "p-1", "done"),
    ];

    const slices = selectTaskStatusDistribution(tasks);

    expect(slices.map((s) => [s.status, s.count])).toEqual([
      ["idle", 2], // backlog + todo
      ["running", 1], // in_progress
      ["info", 2], // review + testing
      ["success", 1], // done
    ]);
    // Statuses are unique (safe as React keys / donut cells).
    expect(new Set(slices.map((s) => s.status)).size).toBe(slices.length);
  });

  it("selectTaskStatusDistribution is empty without tasks", () => {
    expect(selectTaskStatusDistribution([])).toEqual([]);
  });

  it("selectVelocity reports completed and planned points per sprint", () => {
    // US-1 (3 PT) done, US-2 (5 PT) still open → done 3, planned 8.
    const velocity = selectVelocity(artifacts, stories, [
      makeTask("T-1", "p-1", "done", "US-1"),
      makeTask("T-2", "p-1", "in_progress", "US-2"),
    ]);
    expect(velocity).toEqual([{ sprint: "Sprint 1", points: 3, planned: 8 }]);
  });

  it("selectVelocity counts zero completed without any done tasks", () => {
    expect(selectVelocity(artifacts, stories, [])).toEqual([
      { sprint: "Sprint 1", points: 0, planned: 8 },
    ]);
  });

  it("selectVelocity is empty without artifacts", () => {
    expect(selectVelocity({}, stories, [])).toEqual([]);
  });
});
