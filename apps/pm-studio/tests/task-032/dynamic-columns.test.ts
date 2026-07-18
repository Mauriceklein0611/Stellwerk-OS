import { describe, expect, it } from "vitest";

import { columnLabel, columnStatus } from "@/lib/board";
import { buildBoardRows } from "@/lib/board-rows";
import { tasksForStory } from "@/lib/story-tasks";
import type { BoardColumnDef, BoardTask } from "@/types";

/** A custom phase set that reorders and relabels the defaults. */
const customColumns: BoardColumnDef[] = [
  { id: "ship", label: "Shipped", status: "success", order: 0, isTerminal: true },
  { id: "wip", label: "In Arbeit", status: "running", order: 1, isTerminal: false },
  { id: "todo", label: "Offen", status: "idle", order: 2, isTerminal: false },
];

function task(overrides: Partial<BoardTask> & { id: string }): BoardTask {
  return {
    title: "T",
    column: "todo",
    order: 0,
    projectId: "p-1",
    projectName: "Projekt",
    priority: "mittel",
    ...overrides,
  };
}

describe("dynamic columns in pure libs (TASK-032)", () => {
  it("columnLabel/columnStatus resolve against the passed phases", () => {
    expect(columnLabel("wip", customColumns)).toBe("In Arbeit");
    expect(columnStatus("ship", customColumns)).toBe("success");
    // Unknown id falls back to the id / idle.
    expect(columnLabel("ghost", customColumns)).toBe("ghost");
    expect(columnStatus("ghost", customColumns)).toBe("idle");
  });

  it("buildBoardRows uses the custom phase label/status", () => {
    const rows = buildBoardRows(
      [task({ id: "t1", column: "wip" })],
      [],
      [],
      [],
      customColumns,
    );
    expect(rows[0].columnLabel).toBe("In Arbeit");
    expect(rows[0].columnStatus).toBe("running");
  });

  it("tasksForStory orders by the custom left-to-right phase order", () => {
    const tasks = [
      task({ id: "a", storyId: "US-1", column: "todo", order: 0 }),
      task({ id: "b", storyId: "US-1", column: "ship", order: 0 }),
      task({ id: "c", storyId: "US-1", column: "wip", order: 0 }),
    ];
    const ordered = tasksForStory("US-1", tasks, customColumns).map((t) => t.id);
    // ship(0) → wip(1) → todo(2)
    expect(ordered).toEqual(["b", "c", "a"]);
  });
});
