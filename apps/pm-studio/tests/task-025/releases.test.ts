import { beforeEach, describe, expect, it } from "vitest";

import { generateSprints, sprintWindows } from "@/lib/release";
import { useSprintStore } from "@/store/useSprintStore";
import type { PlannedSprint, Release } from "@/types";

function release(patch: Partial<Release> = {}): Release {
  return {
    id: "r-1",
    projectId: "p-1",
    name: "Release Q3",
    status: "planned",
    startDate: "2026-07-01",
    endDate: "2026-09-30",
    sprintLengthWeeks: 2,
    ...patch,
  };
}

describe("sprintWindows", () => {
  it("splits a range into back-to-back full windows", () => {
    // 2026-07-01 … 2026-07-28 is exactly two 14-day windows.
    expect(sprintWindows("2026-07-01", "2026-07-28", 2)).toEqual([
      { start: "2026-07-01", end: "2026-07-14" },
      { start: "2026-07-15", end: "2026-07-28" },
    ]);
  });

  it("clamps the final partial window to the range end (Restfenster)", () => {
    // 18 days with 14-day windows → one full + a 4-day remainder.
    expect(sprintWindows("2026-07-01", "2026-07-18", 2)).toEqual([
      { start: "2026-07-01", end: "2026-07-14" },
      { start: "2026-07-15", end: "2026-07-18" },
    ]);
  });

  it("honours other sprint lengths", () => {
    expect(sprintWindows("2026-07-01", "2026-07-07", 1)).toEqual([
      { start: "2026-07-01", end: "2026-07-07" },
    ]);
  });

  it("crosses month boundaries correctly", () => {
    expect(sprintWindows("2026-07-25", "2026-08-07", 1)).toEqual([
      { start: "2026-07-25", end: "2026-07-31" },
      { start: "2026-08-01", end: "2026-08-07" },
    ]);
  });

  it("returns a single one-day window when start equals end", () => {
    expect(sprintWindows("2026-07-01", "2026-07-01", 2)).toEqual([
      { start: "2026-07-01", end: "2026-07-01" },
    ]);
  });

  it("returns [] for an inverted range", () => {
    expect(sprintWindows("2026-07-10", "2026-07-01", 2)).toEqual([]);
  });
});

describe("generateSprints", () => {
  it("names sprints sequentially and dates each window", () => {
    const sprints = generateSprints(release({ endDate: "2026-07-28" }));
    expect(sprints.map((s) => s.name)).toEqual(["Sprint 1", "Sprint 2"]);
    expect(sprints.map((s) => [s.startDate, s.endDate])).toEqual([
      ["2026-07-01", "2026-07-14"],
      ["2026-07-15", "2026-07-28"],
    ]);
  });

  it("tags every sprint with project, release, planned status and order", () => {
    const sprints = generateSprints(release({ endDate: "2026-07-28" }));
    sprints.forEach((sprint, index) => {
      expect(sprint.projectId).toBe("p-1");
      expect(sprint.releaseId).toBe("r-1");
      expect(sprint.status).toBe("planned");
      expect(sprint.storyIds).toEqual([]);
      expect(sprint.order).toBe(index);
    });
  });

  it("assigns unique ids", () => {
    const sprints = generateSprints(release());
    const ids = new Set(sprints.map((s) => s.id));
    expect(ids.size).toBe(sprints.length);
  });
});

describe("useSprintStore release integration", () => {
  beforeEach(() => {
    useSprintStore.setState({ sprints: [] });
  });

  function manualSprint(patch: Partial<PlannedSprint> = {}): PlannedSprint {
    return {
      id: "m-1",
      projectId: "p-1",
      name: "Manueller Sprint",
      goal: "",
      status: "planned",
      storyIds: ["story-1"],
      order: 0,
      ...patch,
    };
  }

  it("setReleaseSprints is idempotent over releaseId (no duplicates) and keeps manual sprints", () => {
    useSprintStore.setState({ sprints: [manualSprint()] });
    const rel = release({ endDate: "2026-07-28" });

    useSprintStore.getState().setReleaseSprints(rel.id, generateSprints(rel));
    useSprintStore.getState().setReleaseSprints(rel.id, generateSprints(rel));

    const { sprints } = useSprintStore.getState();
    const releaseSprints = sprints.filter((s) => s.releaseId === rel.id);
    const manualSprints = sprints.filter((s) => s.releaseId === undefined);

    expect(releaseSprints).toHaveLength(2); // not duplicated by re-running
    expect(manualSprints).toHaveLength(1); // manual sprint untouched
    expect(manualSprints[0].storyIds).toEqual(["story-1"]);
  });

  it("appends generated sprints after the project's manual sprints (order)", () => {
    useSprintStore.setState({ sprints: [manualSprint({ order: 0 })] });
    const rel = release({ endDate: "2026-07-28" });

    useSprintStore.getState().setReleaseSprints(rel.id, generateSprints(rel));

    const orders = useSprintStore
      .getState()
      .sprints.filter((s) => s.releaseId === rel.id)
      .map((s) => s.order)
      .sort((a, b) => a - b);
    expect(orders).toEqual([1, 2]);
  });

  it("detachRelease unlinks sprints without deleting them", () => {
    const rel = release({ endDate: "2026-07-28" });
    useSprintStore.getState().setReleaseSprints(rel.id, generateSprints(rel));

    useSprintStore.getState().detachRelease(rel.id);

    const { sprints } = useSprintStore.getState();
    expect(sprints).toHaveLength(2); // still there
    expect(sprints.every((s) => s.releaseId === undefined)).toBe(true);
  });
});
