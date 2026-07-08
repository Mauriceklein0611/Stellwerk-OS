import { describe, expect, it } from "vitest";

import { useBoardStore } from "@/store/useBoardStore";
import type { BoardTask } from "@/types";

/** The persist migrate function (v1 → v2) configured on the board store. */
const migrate = useBoardStore.persist.getOptions().migrate!;

describe("board store migration (v1 → v2)", () => {
  it("drops the legacy assignee string so old tasks default to unassigned", () => {
    const legacy = {
      tasks: [
        {
          id: "t1",
          title: "Alt",
          column: "todo",
          order: 0,
          projectId: "p-1",
          projectName: "P1",
          priority: "mittel",
          assignee: "Max Mustermann",
        },
      ],
    };

    const migrated = migrate(legacy, 1) as { tasks: BoardTask[] };
    const task = migrated.tasks[0];

    expect("assignee" in task).toBe(false);
    expect(task.assigneeId).toBeUndefined();
    // Untouched fields survive.
    expect(task.title).toBe("Alt");
  });

  it("is a no-op for already-migrated v2 state", () => {
    const current = {
      tasks: [
        {
          id: "t1",
          title: "Neu",
          column: "todo",
          order: 0,
          projectId: "p-1",
          projectName: "P1",
          priority: "mittel",
          assigneeId: "u1",
        },
      ],
    };

    const migrated = migrate(current, 2) as { tasks: BoardTask[] };
    expect(migrated.tasks[0].assigneeId).toBe("u1");
  });
});
