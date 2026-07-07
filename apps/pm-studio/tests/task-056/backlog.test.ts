import { describe, expect, it } from "vitest";

import {
  epicRollup,
  epicsForProject,
  flattenBacklog,
  moveRanked,
  storiesForEpic,
  storiesForProject,
} from "@/lib/backlog";
import type { Backlog, Epic, UserStory } from "@/types";

/**
 * TASK-056: pure backlog helpers. Cover the selectors (project/epic filtering +
 * rank ordering), the epic roll-up, the rank move used by reorder, and the
 * artifact→store flatten transform.
 */

function epic(id: string, projectId: string, rank: number): Epic {
  return { id, projectId, title: id, rank };
}

function story(
  id: string,
  projectId: string,
  epicId: string,
  rank: number,
  estimate_pt = 3,
): UserStory {
  return {
    id,
    epicId,
    projectId,
    title: id,
    acceptance_criteria: [],
    estimate_pt,
    priority: "mittel",
    rank,
    provenance: "agent",
  };
}

describe("backlog selectors", () => {
  const epics: Epic[] = [
    epic("E-2", "p1", 1),
    epic("E-1", "p1", 0),
    epic("E-X", "p2", 0),
  ];
  const stories: UserStory[] = [
    story("S-2", "p1", "E-1", 1),
    story("S-1", "p1", "E-1", 0),
    story("S-3", "p1", "E-2", 0),
    story("S-X", "p2", "E-X", 0),
  ];

  it("epicsForProject filters by project and sorts by rank", () => {
    expect(epicsForProject(epics, "p1").map((e) => e.id)).toEqual(["E-1", "E-2"]);
    expect(epicsForProject(epics, "p2").map((e) => e.id)).toEqual(["E-X"]);
  });

  it("storiesForProject / storiesForEpic filter and sort by rank", () => {
    expect(storiesForProject(stories, "p1").map((s) => s.id)).toEqual([
      "S-1",
      "S-3",
      "S-2",
    ]);
    expect(storiesForEpic(stories, "E-1").map((s) => s.id)).toEqual([
      "S-1",
      "S-2",
    ]);
  });

  it("epicRollup counts stories and sums their points", () => {
    expect(epicRollup("E-1", stories)).toEqual({ storyCount: 2, totalPt: 6 });
    expect(epicRollup("E-2", stories)).toEqual({ storyCount: 1, totalPt: 3 });
    expect(epicRollup("missing", stories)).toEqual({ storyCount: 0, totalPt: 0 });
  });
});

describe("moveRanked", () => {
  const items = [
    { id: "a", rank: 0 },
    { id: "b", rank: 1 },
    { id: "c", rank: 2 },
  ];

  it("moves an item and re-assigns contiguous ranks", () => {
    const moved = moveRanked(items, "c", 0);
    expect(moved.map((i) => i.id)).toEqual(["c", "a", "b"]);
    expect(moved.map((i) => i.rank)).toEqual([0, 1, 2]);
  });

  it("clamps an out-of-range target index", () => {
    expect(moveRanked(items, "a", 99).map((i) => i.id)).toEqual(["b", "c", "a"]);
  });

  it("re-ranks but keeps order for an unknown id", () => {
    expect(moveRanked(items, "zzz", 0).map((i) => i.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });
});

describe("flattenBacklog", () => {
  const backlog: Backlog = {
    epics: [
      {
        id: "E-1",
        title: "Kern",
        stories: [
          { id: "US-1", title: "A", acceptance_criteria: ["ak"], estimate_pt: 2, priority: "hoch" },
          { id: "US-2", title: "B", acceptance_criteria: [], estimate_pt: 5, priority: "mittel" },
        ],
      },
      {
        id: "E-2",
        title: "Qualität",
        stories: [
          { id: "US-3", title: "C", acceptance_criteria: [], estimate_pt: 1, priority: "niedrig" },
        ],
      },
    ],
    sprint_suggestions: [],
  };

  it("flattens nested epics/stories into ranked store entities", () => {
    const { epics, stories } = flattenBacklog("p1", backlog, "agent");

    expect(epics).toEqual([
      { id: "E-1", projectId: "p1", title: "Kern", rank: 0 },
      { id: "E-2", projectId: "p1", title: "Qualität", rank: 1 },
    ]);

    // Story ids are preserved 1:1 (board/sprint storyId references stay valid).
    expect(stories.map((s) => s.id)).toEqual(["US-1", "US-2", "US-3"]);
    expect(stories[0]).toMatchObject({
      id: "US-1",
      epicId: "E-1",
      projectId: "p1",
      rank: 0,
      provenance: "agent",
      estimate_pt: 2,
    });
    // Rank restarts per epic.
    expect(stories[1].rank).toBe(1);
    expect(stories[2]).toMatchObject({ epicId: "E-2", rank: 0 });
  });

  it("defaults provenance to agent", () => {
    const { stories } = flattenBacklog("p1", backlog);
    expect(stories.every((s) => s.provenance === "agent")).toBe(true);
  });
});
