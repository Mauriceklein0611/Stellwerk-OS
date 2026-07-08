import { describe, expect, it } from "vitest";

import { searchEntities } from "@/lib/search";
import type {
  BoardTask,
  Person,
  ProjectIdea,
  Release,
  UserStory,
} from "@/types";

/**
 * TASK-042: index-free global search. Case-insensitive substring match across
 * projects/tasks/stories/people/releases; results carry navigation targets.
 */

function idea(id: string, name: string): ProjectIdea {
  return {
    id,
    createdAt: "2026-01-01T00:00:00.000Z",
    status: "idea",
    name,
    description: "",
    problem: "",
    features: [],
    approach: "agil",
  };
}

function story(id: string, title: string, projectId = "p1"): UserStory {
  return {
    id,
    epicId: "e1",
    projectId,
    title,
    acceptance_criteria: [],
    estimate_pt: 3,
    priority: "mittel",
    rank: 0,
    provenance: "agent",
  };
}

function task(id: string, title: string): BoardTask {
  return {
    id,
    title,
    column: "todo",
    order: 0,
    projectId: "p1",
    projectName: "Apollo",
    priority: "mittel",
  };
}

function person(id: string, name: string, role = "Dev"): Person {
  return { id, name, role, capacityPtPerSprint: 10 };
}

function release(id: string, name: string): Release {
  return {
    id,
    projectId: "p1",
    name,
    status: "planned",
    startDate: "2026-01-01",
    endDate: "2026-03-01",
    sprintLengthWeeks: 2,
  };
}

const sources = {
  ideas: [idea("p1", "Apollo"), idea("p2", "Zephyr")],
  tasks: [task("t1", "Apollo login flow"), task("t2", "Logout")],
  stories: [story("st1", "Apollo onboarding story")],
  persons: [person("u1", "Alice Apollo"), person("u2", "Bob")],
  releases: [release("r1", "Apollo v1")],
};

describe("searchEntities", () => {
  it("returns nothing for an empty query", () => {
    expect(searchEntities("", sources)).toEqual([]);
    expect(searchEntities("   ", sources)).toEqual([]);
  });

  it("matches across every entity kind, case-insensitively", () => {
    const results = searchEntities("apollo", sources);
    const byKind = results.reduce<Record<string, number>>((acc, r) => {
      acc[r.kind] = (acc[r.kind] ?? 0) + 1;
      return acc;
    }, {});
    expect(byKind).toEqual({
      project: 1,
      task: 1,
      story: 1,
      person: 1,
      release: 1,
    });
  });

  it("targets the right navigation hrefs", () => {
    const results = searchEntities("apollo", sources);
    const href = (kind: string) => results.find((r) => r.kind === kind)?.href;
    expect(href("project")).toBe("/projects/p1");
    expect(href("task")).toBe("/board");
    expect(href("story")).toBe("/projects/p1");
    expect(href("person")).toBe("/team");
    expect(href("release")).toBe("/releases");
  });

  it("resolves a story's project name as sublabel", () => {
    const result = searchEntities("onboarding", sources).find(
      (r) => r.kind === "story",
    );
    expect(result?.sublabel).toBe("Apollo");
  });

  it("matches a person by role too", () => {
    const results = searchEntities("dev", sources);
    expect(results.filter((r) => r.kind === "person")).toHaveLength(2);
  });

  it("caps results per kind", () => {
    const manyTasks = Array.from({ length: 8 }, (_, i) =>
      task(`t${i}`, `Match ${i}`),
    );
    const results = searchEntities(
      "match",
      { ...sources, tasks: manyTasks },
      3,
    );
    expect(results.filter((r) => r.kind === "task")).toHaveLength(3);
  });

  it("returns kind-namespaced keys (ids can collide across kinds)", () => {
    const results = searchEntities("apollo", sources);
    expect(new Set(results.map((r) => r.key)).size).toBe(results.length);
  });
});
