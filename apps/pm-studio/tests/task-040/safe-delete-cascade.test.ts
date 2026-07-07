import { beforeEach, describe, expect, it } from "vitest";

import { DEFAULT_BOARD_COLUMNS } from "@/lib/board";
import { useBoardStore } from "@/store/useBoardStore";
import { useBoardColumnsStore } from "@/store/useBoardColumnsStore";
import { usePeopleStore } from "@/store/usePeopleStore";
import { useReleaseStore } from "@/store/useReleaseStore";
import { useSprintStore } from "@/store/useSprintStore";
import type { BoardTask, Person, PlannedSprint, Release } from "@/types";

const taskBase: Omit<BoardTask, "id" | "assigneeId" | "column"> = {
  title: "Task",
  order: 0,
  projectId: "p1",
  projectName: "Projekt",
  priority: "mittel",
};

const person: Person = {
  id: "alice",
  name: "Alice",
  role: "Dev",
  capacityPtPerSprint: 8,
};

beforeEach(() => {
  useBoardStore.setState({ tasks: [] });
  usePeopleStore.setState({ persons: [], teams: [] });
  useBoardColumnsStore.setState({ columns: DEFAULT_BOARD_COLUMNS });
  useReleaseStore.setState({ releases: [] });
  useSprintStore.setState({ sprints: [], reviews: [], retros: [] });
});

describe("removePerson cascade + undo (TASK-040)", () => {
  it("removePerson leaves no dangling assigneeId", () => {
    usePeopleStore.setState({ persons: [person], teams: [] });
    useBoardStore.getState().addTask({ ...taskBase, id: "t1", column: "todo", assigneeId: "alice" });

    usePeopleStore.getState().removePerson("alice");

    expect(usePeopleStore.getState().persons).toHaveLength(0);
    expect(useBoardStore.getState().tasks[0].assigneeId).toBeUndefined();
  });

  it("undo restores the person and the assignment 1:1", () => {
    usePeopleStore.setState({ persons: [person], teams: [] });
    useBoardStore.getState().addTask({ ...taskBase, id: "t1", column: "todo", assigneeId: "alice" });

    // Snapshot, like the page handler does before deleting.
    const personsBefore = usePeopleStore.getState().persons;
    const teamsBefore = usePeopleStore.getState().teams;
    const tasksBefore = useBoardStore.getState().tasks;

    usePeopleStore.getState().removePerson("alice");
    // Undo:
    usePeopleStore.getState().restore({ persons: personsBefore, teams: teamsBefore });
    useBoardStore.getState().restore(tasksBefore);

    expect(usePeopleStore.getState().persons).toEqual([person]);
    expect(useBoardStore.getState().tasks[0].assigneeId).toBe("alice");
  });
});

describe("board task delete + undo (TASK-040)", () => {
  it("removeTask deletes, restore brings it back", () => {
    useBoardStore.getState().addTask({ ...taskBase, id: "t1", column: "todo" });
    const tasksBefore = useBoardStore.getState().tasks;

    useBoardStore.getState().removeTask("t1");
    expect(useBoardStore.getState().tasks).toHaveLength(0);

    useBoardStore.getState().restore(tasksBefore);
    expect(useBoardStore.getState().tasks).toEqual(tasksBefore);
  });
});

describe("board phase delete + undo (TASK-040)", () => {
  it("restore reverts a removed phase and its relocated tasks", () => {
    const [first, second] = DEFAULT_BOARD_COLUMNS;
    useBoardStore.getState().addTask({ ...taskBase, id: "t1", column: second.id });

    const columnsBefore = useBoardColumnsStore.getState().columns;
    const tasksBefore = useBoardStore.getState().tasks;

    useBoardColumnsStore.getState().removeColumn(second.id, first.id);
    // The task was relocated to the fallback column.
    expect(useBoardStore.getState().tasks[0].column).toBe(first.id);

    useBoardColumnsStore.getState().restore(columnsBefore);
    useBoardStore.getState().restore(tasksBefore);

    expect(useBoardColumnsStore.getState().columns).toEqual(columnsBefore);
    expect(useBoardStore.getState().tasks[0].column).toBe(second.id);
  });
});

describe("release delete + undo (TASK-040)", () => {
  const release: Release = {
    id: "r1",
    name: "Release Q3",
    projectId: "p1",
    status: "planned",
    startDate: "2026-07-01",
    endDate: "2026-09-30",
    sprintLengthWeeks: 2,
  };
  const sprint: PlannedSprint = {
    id: "s1",
    projectId: "p1",
    name: "Sprint 1",
    goal: "Ziel",
    status: "planned",
    storyIds: [],
    order: 0,
    releaseId: "r1",
  };

  it("delete unlinks sprints; undo restores release and links", () => {
    useReleaseStore.setState({ releases: [release] });
    useSprintStore.setState({ sprints: [sprint], reviews: [], retros: [] });

    const releasesBefore = useReleaseStore.getState().releases;
    const sprintsBefore = useSprintStore.getState().sprints;

    useSprintStore.getState().detachRelease("r1");
    useReleaseStore.getState().removeRelease("r1");
    expect(useReleaseStore.getState().releases).toHaveLength(0);
    expect(useSprintStore.getState().sprints[0].releaseId).toBeUndefined();

    useReleaseStore.getState().restore(releasesBefore);
    useSprintStore.getState().restore(sprintsBefore);
    expect(useReleaseStore.getState().releases).toEqual([release]);
    expect(useSprintStore.getState().sprints[0].releaseId).toBe("r1");
  });
});
