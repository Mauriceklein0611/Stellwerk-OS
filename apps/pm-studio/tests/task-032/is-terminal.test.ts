import { describe, expect, it } from "vitest";

import { terminalColumnIds, isTerminalColumn } from "@/lib/board";
import { sprintBurndown } from "@/lib/burndown";
import { OVERDUE, emptyBoardFilter, filterBoardTasks } from "@/lib/board-filters";
import { selectProjects, selectTaskStatusDistribution, selectVelocity } from "@/lib/dashboard-selectors";
import { isStoryDone, sprintProgress } from "@/lib/sprint-progress";
import { storyTaskRollup } from "@/lib/story-tasks";
import type { BoardColumnDef, BoardTask, ProjectArtifacts, ProjectIdea, UserStory } from "@/types";

/**
 * Custom phases where the terminal phase is "ship" and the default "done" id is
 * NOT terminal – the whole point of 032b is that done-semantics follow the flag,
 * not the literal "done".
 */
const columns: BoardColumnDef[] = [
  { id: "open", label: "Offen", status: "idle", order: 0, isTerminal: false },
  { id: "done", label: "Done (nicht terminal)", status: "info", order: 1, isTerminal: false },
  { id: "ship", label: "Shipped", status: "success", order: 2, isTerminal: true },
];
const terminal = terminalColumnIds(columns);

function task(overrides: Partial<BoardTask> & { id: string }): BoardTask {
  return {
    title: "T",
    column: "open",
    order: 0,
    projectId: "p-1",
    projectName: "Projekt",
    priority: "mittel",
    ...overrides,
  };
}

const stories: UserStory[] = [
  { id: "US-1", epicId: "E-1", projectId: "p1", title: "A", acceptance_criteria: [], estimate_pt: 3, priority: "hoch", rank: 0, provenance: "agent" },
  { id: "US-2", epicId: "E-1", projectId: "p1", title: "B", acceptance_criteria: [], estimate_pt: 5, priority: "mittel", rank: 1, provenance: "agent" },
];

describe("isTerminal drives done-semantics (TASK-032b)", () => {
  it("terminalColumnIds / isTerminalColumn read the flag", () => {
    expect([...terminal]).toEqual(["ship"]);
    expect(isTerminalColumn("ship", columns)).toBe(true);
    expect(isTerminalColumn("done", columns)).toBe(false);
  });

  it("isStoryDone counts a terminal phase, not the literal 'done'", () => {
    const inShip = [task({ id: "a", storyId: "US-1", column: "ship" })];
    const inDone = [task({ id: "b", storyId: "US-1", column: "done" })];
    expect(isStoryDone("US-1", inShip, terminal)).toBe(true);
    expect(isStoryDone("US-1", inDone, terminal)).toBe(false);
  });

  it("sprintProgress sums terminal-phase stories", () => {
    const tasks = [
      task({ id: "a", storyId: "US-1", column: "ship" }),
      task({ id: "b", storyId: "US-2", column: "done" }),
    ];
    const progress = sprintProgress({ storyIds: ["US-1", "US-2"] }, stories, tasks, terminal);
    expect(progress).toMatchObject({ donePt: 3, plannedPt: 8, doneCount: 1, total: 2 });
  });

  it("storyTaskRollup uses the columns' terminal flag", () => {
    const tasks = [
      task({ id: "a", storyId: "US-1", column: "ship", estimate_pt: 3 }),
      task({ id: "b", storyId: "US-1", column: "done", estimate_pt: 2 }),
    ];
    const rollup = storyTaskRollup("US-1", tasks, columns);
    // "done" is NOT terminal here, so only 1 of 2 tasks is terminal → not done (TASK-038).
    expect(rollup).toMatchObject({ total: 2, doneTasks: 1, totalPt: 5, donePt: 3, storyDone: false });
  });

  it("sprintBurndown burns down when a story reaches a terminal phase", () => {
    const sprint = { storyIds: ["US-1"], startDate: "2026-07-01", endDate: "2026-07-02" };
    const tasks = [
      task({ id: "a", storyId: "US-1", column: "ship", doneAt: "2026-07-01T08:00:00.000Z" }),
    ];
    const result = sprintBurndown(sprint, stories, tasks, "2026-07-02", terminal);
    // Day 1 burns the 3 PT story → remaining 0 on both days.
    expect(result.map((day) => day.remaining)).toEqual([0, 0]);
  });

  it("filterBoardTasks overdue skips tasks already in a terminal phase", () => {
    const tasks = [
      task({ id: "a", column: "ship", dueDate: "2020-01-01" }), // done → not overdue
      task({ id: "b", column: "open", dueDate: "2020-01-01" }), // open → overdue
    ];
    const filter = { ...emptyBoardFilter, due: OVERDUE };
    const visible = filterBoardTasks(tasks, filter, [], "2026-06-16", terminal).map((t) => t.id);
    expect(visible).toEqual(["b"]);
  });

  it("selectProjects / selectVelocity / distribution respect custom phases", () => {
    const ideas: ProjectIdea[] = [
      { id: "p-1", name: "P", createdAt: "", status: "idea", description: "", problem: "", features: [], approach: "agil" },
    ];
    const tasks = [
      task({ id: "a", column: "ship" }),
      task({ id: "b", column: "open" }),
    ];
    expect(selectProjects(ideas, tasks, terminal)[0].progress).toBe(50);

    // No crash on a non-default column id; bucketed by status accent.
    const dist = selectTaskStatusDistribution(tasks, columns);
    expect(dist.map((s) => [s.status, s.count])).toEqual([
      ["idle", 1], // open
      ["success", 1], // ship
    ]);

    const artifacts: Record<string, ProjectArtifacts> = {
      "p-1": {
        draft: { summary: "", vision: "", value_proposition: "", target_group: "", mvp: { description: "", features: [] }, phases: [], initial_risks: [], open_questions: [] },
        requirements: { functional: [], non_functional: [], technical: [], dependencies: [], assumptions: [], budget_drivers: [], time_risks: [], clarifications: [] },
        backlog: {
          epics: [
            {
              id: "E",
              title: "E",
              // The run-artifact snapshot keeps string AKs (BacklogStory).
              stories: stories.map((s) => ({
                id: s.id,
                title: s.title,
                acceptance_criteria: [],
                estimate_pt: s.estimate_pt,
                priority: s.priority,
              })),
            },
          ],
          sprint_suggestions: [{ name: "S1", goal: "", story_ids: ["US-1", "US-2"] }],
        },
        risks: { risks: [] },
      },
    };
    const velocity = selectVelocity(artifacts, stories, [task({ id: "a", storyId: "US-1", column: "ship" })], terminal);
    expect(velocity).toEqual([{ sprint: "S1", points: 3, planned: 8 }]);
  });
});
