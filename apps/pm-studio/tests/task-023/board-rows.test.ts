import { describe, expect, it } from "vitest";

import { buildBoardRows } from "@/lib/board-rows";
import type { BoardTask, Person, PlannedSprint } from "@/types";

function task(overrides: Partial<BoardTask> & { id: string }): BoardTask {
  return {
    title: overrides.id,
    column: "todo",
    order: 0,
    projectId: "p-1",
    projectName: "Projekt Eins",
    priority: "mittel",
    ...overrides,
  };
}

const persons: Person[] = [
  { id: "u1", name: "Lena Schmidt", role: "Dev", capacityPtPerSprint: 10 },
];

const sprints: Pick<PlannedSprint, "name" | "storyIds">[] = [
  { name: "Sprint 1", storyIds: ["US-1"] },
];

describe("buildBoardRows", () => {
  it("resolves assignee, sprint, column label/status and short id", () => {
    const [row] = buildBoardRows(
      [
        task({
          id: "t1",
          title: "Login",
          column: "done",
          storyId: "US-1",
          assigneeId: "u1",
          estimate_pt: 5,
        }),
      ],
      persons,
      sprints,
    );

    expect(row).toMatchObject({
      id: "t1",
      shortId: "US-1",
      title: "Login",
      columnLabel: "Done",
      columnStatus: "success",
      estimatePt: 5,
      assigneeName: "Lena Schmidt",
      sprintName: "Sprint 1",
      projectName: "Projekt Eins",
    });
    // Keeps the underlying task for the row-click → TaskDialog.
    expect(row.task.id).toBe("t1");
  });

  it("falls back cleanly when assignee/sprint/estimate are missing", () => {
    const [row] = buildBoardRows(
      [task({ id: "abcdefgh1234", column: "backlog" })],
      persons,
      sprints,
    );

    expect(row.shortId).toBe("abcdefgh"); // first 8 chars of the task id
    expect(row.columnLabel).toBe("Backlog");
    expect(row.columnStatus).toBe("idle");
    expect(row.assigneeName).toBeUndefined();
    expect(row.sprintName).toBeUndefined();
    expect(row.estimatePt).toBeUndefined();
  });
});
