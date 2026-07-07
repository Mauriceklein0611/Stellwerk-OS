import { describe, expect, it } from "vitest";

import { loadStatus, sprintWorkload } from "@/lib/capacity";
import type { BoardTask, Person, UserStory } from "@/types";

function story(id: string, estimate_pt: number): UserStory {
  return { id, epicId: "E-1", projectId: "p1", title: id, acceptance_criteria: [], estimate_pt, priority: "mittel", rank: 0, provenance: "agent" };
}

function task(id: string, storyId: string, assigneeId?: string): BoardTask {
  return {
    id,
    title: id,
    column: "todo",
    order: 0,
    projectId: "p-1",
    projectName: "p-1",
    storyId,
    assigneeId,
    priority: "mittel",
  };
}

function person(id: string, name: string, capacity: number): Person {
  return { id, name, role: "Dev", capacityPtPerSprint: capacity };
}

describe("loadStatus", () => {
  it("is idle without assigned work", () => {
    expect(loadStatus(0, 10)).toBe("idle");
  });

  it("is success within capacity (≤ 90%)", () => {
    expect(loadStatus(5, 10)).toBe("success");
    expect(loadStatus(9, 10)).toBe("success");
  });

  it("is warning near the limit (> 90%, ≤ 100%)", () => {
    expect(loadStatus(10, 10)).toBe("warning");
    expect(loadStatus(95, 100)).toBe("warning");
  });

  it("is danger when overloaded or capacity is zero", () => {
    expect(loadStatus(11, 10)).toBe("danger");
    expect(loadStatus(1, 0)).toBe("danger");
  });
});

describe("sprintWorkload", () => {
  const stories = [story("US-1", 3), story("US-2", 5), story("US-3", 2)];
  const persons = [person("u1", "Lena", 6), person("u2", "Tom", 10)];

  it("sums assigned person-days per person and flags overload", () => {
    const load = sprintWorkload(
      { storyIds: ["US-1", "US-2", "US-3"] },
      stories,
      [
        task("T-1", "US-1", "u1"),
        task("T-2", "US-2", "u1"), // Lena: 3 + 5 = 8 > capacity 6 → danger
        task("T-3", "US-3", "u2"), // Tom: 2 of 10 → success
      ],
      persons,
    );

    expect(load).toEqual([
      { personId: "u1", name: "Lena", assignedPt: 8, capacityPt: 6, status: "danger" },
      { personId: "u2", name: "Tom", assignedPt: 2, capacityPt: 10, status: "success" },
    ]);
  });

  it("ignores unassigned tasks and stories outside the sprint", () => {
    const load = sprintWorkload(
      { storyIds: ["US-1"] },
      stories,
      [
        task("T-1", "US-1"), // unassigned → ignored
        task("T-2", "US-2", "u1"), // not in sprint → ignored
      ],
      persons,
    );
    expect(load).toEqual([]);
  });

  it("falls back to capacity 0 (danger) for an unknown assignee", () => {
    const load = sprintWorkload(
      { storyIds: ["US-1"] },
      stories,
      [task("T-1", "US-1", "ghost")],
      persons,
    );
    expect(load).toEqual([
      {
        personId: "ghost",
        name: "Unbekannt",
        assignedPt: 3,
        capacityPt: 0,
        status: "danger",
      },
    ]);
  });
});
