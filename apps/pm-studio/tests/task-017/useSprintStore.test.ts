import { beforeEach, describe, expect, it } from "vitest";

import { useSprintStore } from "@/store/useSprintStore";
import type { SprintSuggestion } from "@/types";

function reset() {
  useSprintStore.setState({ sprints: [] });
}

describe("useSprintStore", () => {
  beforeEach(reset);

  it("addSprint assigns an incrementing order per project", () => {
    const { addSprint } = useSprintStore.getState();
    addSprint({ id: "s1", projectId: "p-1", name: "Sprint 1", goal: "", status: "planned", storyIds: [] });
    addSprint({ id: "s2", projectId: "p-1", name: "Sprint 2", goal: "", status: "planned", storyIds: [] });
    addSprint({ id: "s3", projectId: "p-2", name: "Sprint A", goal: "", status: "planned", storyIds: [] });

    const sprints = useSprintStore.getState().sprints;
    expect(sprints.find((s) => s.id === "s1")?.order).toBe(0);
    expect(sprints.find((s) => s.id === "s2")?.order).toBe(1);
    expect(sprints.find((s) => s.id === "s3")?.order).toBe(0); // own project
  });

  it("assignStory moves a story and keeps it in at most one sprint", () => {
    const { addSprint, assignStory } = useSprintStore.getState();
    addSprint({ id: "s1", projectId: "p-1", name: "S1", goal: "", status: "planned", storyIds: [] });
    addSprint({ id: "s2", projectId: "p-1", name: "S2", goal: "", status: "planned", storyIds: [] });

    assignStory("US-1", "s1");
    expect(useSprintStore.getState().sprints.find((s) => s.id === "s1")?.storyIds).toEqual(["US-1"]);

    // Reassigning detaches from s1 first.
    assignStory("US-1", "s2");
    const sprints = useSprintStore.getState().sprints;
    expect(sprints.find((s) => s.id === "s1")?.storyIds).toEqual([]);
    expect(sprints.find((s) => s.id === "s2")?.storyIds).toEqual(["US-1"]);

    // null unassigns.
    assignStory("US-1", null);
    expect(useSprintStore.getState().sprints.every((s) => !s.storyIds.includes("US-1"))).toBe(true);
  });

  it("removeSprint deletes the sprint (its stories become unassigned)", () => {
    const { addSprint, assignStory, removeSprint } = useSprintStore.getState();
    addSprint({ id: "s1", projectId: "p-1", name: "S1", goal: "", status: "planned", storyIds: [] });
    assignStory("US-1", "s1");

    removeSprint("s1");
    const sprints = useSprintStore.getState().sprints;
    expect(sprints).toHaveLength(0);
    // Story is no longer referenced anywhere → effectively unassigned.
    expect(sprints.some((s) => s.storyIds.includes("US-1"))).toBe(false);
  });

  it("updateSprint patches name, goal and status", () => {
    const { addSprint, updateSprint } = useSprintStore.getState();
    addSprint({ id: "s1", projectId: "p-1", name: "S1", goal: "alt", status: "planned", storyIds: [] });

    updateSprint("s1", { name: "Renamed", goal: "neu", status: "active" });
    const sprint = useSprintStore.getState().sprints.find((s) => s.id === "s1");
    expect(sprint).toMatchObject({ name: "Renamed", goal: "neu", status: "active" });
  });

  it("importSuggestions creates sprints and skips duplicates by name", () => {
    const { importSuggestions } = useSprintStore.getState();
    const suggestions: SprintSuggestion[] = [
      { name: "Sprint 1", goal: "Ziel 1", story_ids: ["US-1", "US-2"] },
      { name: "Sprint 2", goal: "Ziel 2", story_ids: ["US-3"] },
    ];

    importSuggestions("p-1", suggestions);
    expect(useSprintStore.getState().sprints).toHaveLength(2);

    // Re-import: same names are skipped, no duplicates.
    importSuggestions("p-1", suggestions);
    expect(useSprintStore.getState().sprints).toHaveLength(2);

    const sprint1 = useSprintStore.getState().sprints.find((s) => s.name === "Sprint 1");
    expect(sprint1?.storyIds).toEqual(["US-1", "US-2"]);
    expect(sprint1?.status).toBe("planned");
  });

  it("importSuggestions detaches stories already assigned elsewhere", () => {
    const { addSprint, assignStory, importSuggestions } = useSprintStore.getState();
    addSprint({ id: "s1", projectId: "p-1", name: "Bestand", goal: "", status: "planned", storyIds: [] });
    assignStory("US-1", "s1");

    importSuggestions("p-1", [{ name: "Sprint 1", goal: "", story_ids: ["US-1"] }]);

    const sprints = useSprintStore.getState().sprints;
    expect(sprints.find((s) => s.id === "s1")?.storyIds).toEqual([]);
    expect(sprints.find((s) => s.name === "Sprint 1")?.storyIds).toEqual(["US-1"]);
  });
});
