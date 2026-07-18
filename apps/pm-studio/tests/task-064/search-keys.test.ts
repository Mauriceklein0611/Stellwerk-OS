import { describe, expect, it } from "vitest";

import { searchEntities, type SearchSources } from "@/lib/search";
import type { BoardTask, UserStory } from "@/types";

/**
 * TASK-064: search finds items by their readable key, and an exact key match
 * ranks first (typing "PMS-2" jumps straight to that item).
 */

function story(id: string, title: string): UserStory {
  return {
    id,
    epicId: "e1",
    projectId: "p1",
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

const sources: SearchSources = {
  ideas: [{ id: "p1", createdAt: "", status: "idea", name: "Apollo", description: "", problem: "", features: [], approach: "agil" }],
  tasks: [task("t1", "Login"), task("t2", "Logout")],
  stories: [story("s1", "Onboarding")],
  persons: [],
  releases: [],
  keys: { t1: "APO-1", t2: "APO-2", s1: "APO-3" },
};

describe("searchEntities with item keys (TASK-064)", () => {
  it("matches a task by its key", () => {
    const results = searchEntities("APO-1", sources);
    const hit = results.find((r) => r.kind === "task");
    expect(hit?.label).toBe("Login");
    expect(hit?.badge).toBe("APO-1");
  });

  it("matches a story by its key", () => {
    const results = searchEntities("apo-3", sources);
    expect(results.some((r) => r.kind === "story" && r.badge === "APO-3")).toBe(
      true,
    );
  });

  it("ranks an exact key match first", () => {
    const results = searchEntities("APO-2", sources);
    expect(results[0]?.badge).toBe("APO-2");
  });

  it("still works without a keys map (optional)", () => {
    const results = searchEntities("login", { ...sources, keys: undefined });
    expect(results.some((r) => r.label === "Login")).toBe(true);
  });
});
