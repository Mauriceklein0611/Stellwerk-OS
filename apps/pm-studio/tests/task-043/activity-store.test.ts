import { beforeEach, describe, expect, it } from "vitest";

import { DEFAULT_BOARD_COLUMNS } from "@/lib/board";
import { eventsForEntity } from "@/lib/activity";
import { useActivityStore } from "@/store/useActivityStore";
import { useBoardStore } from "@/store/useBoardStore";
import { useBoardColumnsStore } from "@/store/useBoardColumnsStore";
import { useProjectStore } from "@/store/useProjectStore";
import { useReleaseStore } from "@/store/useReleaseStore";
import { useSprintStore } from "@/store/useSprintStore";
import type { BoardTask, ProjectIdea, Release } from "@/types";

const taskBase: Omit<BoardTask, "id" | "column"> = {
  title: "Login",
  order: 0,
  projectId: "p1",
  projectName: "Projekt",
  priority: "mittel",
};

const idea: ProjectIdea = {
  id: "p1",
  createdAt: "2026-06-22T08:00:00.000Z",
  status: "idea",
  name: "Mein Projekt",
  description: "",
  problem: "",
  features: [],
  approach: "agil",
};

const release: Release = {
  id: "r1",
  projectId: "p1",
  name: "Release Q3",
  status: "planned",
  startDate: "2026-07-01",
  endDate: "2026-09-30",
  sprintLengthWeeks: 2,
};

beforeEach(() => {
  useActivityStore.setState({ events: [] });
  useBoardStore.setState({ tasks: [] });
  useBoardColumnsStore.setState({ columns: DEFAULT_BOARD_COLUMNS });
  useProjectStore.setState({ ideas: [], artifacts: {} });
  useReleaseStore.setState({ releases: [] });
  useSprintStore.setState({ sprints: [], reviews: [], retros: [] });
});

const events = () => useActivityStore.getState().events;

describe("useActivityStore.log (TASK-043)", () => {
  it("appends a built event with id + timestamp", () => {
    useActivityStore.getState().log({
      entityType: "task",
      entityId: "t1",
      kind: "create",
      summary: "x",
    });
    expect(events()).toHaveLength(1);
    expect(events()[0].id).toBeTruthy();
    expect(events()[0].actor).toBe("human");
  });
});

describe("project store instrumentation", () => {
  it("logs create on addIdea and delete on removeIdea", () => {
    useProjectStore.getState().addIdea(idea);
    useProjectStore.getState().removeIdea("p1");

    // Same-ms events tie on createdAt; assert the set, not the tie order
    // (strict newest-first ordering is covered in activity.test.ts).
    const kinds = eventsForEntity(events(), "project", "p1").map((e) => e.kind);
    expect(kinds).toHaveLength(2);
    expect(new Set(kinds)).toEqual(new Set(["create", "delete"]));
    expect(events().find((e) => e.kind === "create")?.summary).toContain(
      "Mein Projekt",
    );
  });
});

describe("board store instrumentation", () => {
  it("logs create on addTask and delete on removeTask", () => {
    useBoardStore.getState().addTask({ ...taskBase, id: "t1", column: "todo" });
    useBoardStore.getState().removeTask("t1");

    const kinds = eventsForEntity(events(), "task", "t1").map((e) => e.kind);
    expect(new Set(kinds)).toEqual(new Set(["create", "delete"]));
  });

  it("logs a move only when the column actually changes (moveTask)", () => {
    useBoardStore.getState().addTask({ ...taskBase, id: "t1", column: "todo" });
    useBoardStore.getState().addTask({ ...taskBase, id: "t2", column: "todo" });
    useActivityStore.setState({ events: [] });

    // Reorder within the same column → no event.
    useBoardStore.getState().moveTask("t1", "todo", "t2");
    expect(events()).toHaveLength(0);

    // Real column change → one update event mentioning the target phase label.
    useBoardStore.getState().moveTask("t1", "in_progress");
    expect(events()).toHaveLength(1);
    expect(events()[0].kind).toBe("update");
    expect(events()[0].summary).toContain("In Progress");
  });

  it("logs a column change via updateTask but not a plain field edit", () => {
    useBoardStore.getState().addTask({ ...taskBase, id: "t1", column: "todo" });
    useActivityStore.setState({ events: [] });

    // Field-only edit → no event (avoids per-keystroke noise).
    useBoardStore.getState().updateTask("t1", { title: "Neu" });
    expect(events()).toHaveLength(0);

    // Column change via the dialog/inline edit → update event.
    useBoardStore.getState().updateTask("t1", { column: "done" });
    expect(events()).toHaveLength(1);
    expect(events()[0].kind).toBe("update");
    expect(events()[0].summary).toContain("Done");
  });
});

describe("sprint store instrumentation", () => {
  it("logs create/update/delete", () => {
    useSprintStore.getState().addSprint({
      id: "s1",
      projectId: "p1",
      name: "Sprint 1",
      goal: "",
      status: "planned",
      storyIds: [],
    });
    useSprintStore.getState().updateSprint("s1", { status: "active" });
    useSprintStore.getState().removeSprint("s1");

    const kinds = eventsForEntity(events(), "sprint", "s1").map((e) => e.kind);
    expect(new Set(kinds)).toEqual(new Set(["create", "update", "delete"]));
  });
});

describe("release store instrumentation", () => {
  it("logs create/update/delete with the release name", () => {
    useReleaseStore.getState().addRelease(release);
    useReleaseStore.getState().updateRelease("r1", { status: "active" });
    useReleaseStore.getState().removeRelease("r1");

    const releaseEvents = eventsForEntity(events(), "release", "r1");
    const kinds = releaseEvents.map((e) => e.kind);
    expect(new Set(kinds)).toEqual(new Set(["create", "update", "delete"]));
    expect(releaseEvents[0].summary).toContain("Release Q3");
  });
});
