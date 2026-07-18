import { describe, expect, it } from "vitest";

import {
  buildRetroActionTask,
  findRetroActionTask,
  retroActionHasTask,
} from "@/lib/retro-actions";
import type { BoardTask } from "@/types";

function task(overrides: Partial<BoardTask> & { id: string }): BoardTask {
  return {
    title: `Task ${overrides.id}`,
    column: "todo",
    order: 0,
    projectId: "p1",
    projectName: "Projekt",
    priority: "mittel",
    ...overrides,
  };
}

describe("findRetroActionTask (TASK-065)", () => {
  const tasks: BoardTask[] = [
    task({ id: "t1", sourceRetroId: "rt1", sourceRetroAction: "CI fixen" }),
    task({ id: "t2", sourceRetroId: "rt1", sourceRetroAction: "Doku ergänzen" }),
    task({ id: "t3" }),
  ];

  it("matches on retro id AND action text (identifies a single action)", () => {
    expect(findRetroActionTask("rt1", "CI fixen", tasks)?.id).toBe("t1");
    expect(findRetroActionTask("rt1", "Doku ergänzen", tasks)?.id).toBe("t2");
  });

  it("does not match a different action of the same retro", () => {
    expect(findRetroActionTask("rt1", "Anderes", tasks)).toBeUndefined();
  });

  it("does not match the same action of a different retro", () => {
    expect(findRetroActionTask("rt2", "CI fixen", tasks)).toBeUndefined();
  });

  it("retroActionHasTask reflects existence", () => {
    expect(retroActionHasTask("rt1", "CI fixen", tasks)).toBe(true);
    expect(retroActionHasTask("rt1", "Anderes", tasks)).toBe(false);
  });
});

describe("buildRetroActionTask (TASK-065)", () => {
  it("builds a todo task carrying the origin reference", () => {
    const built = buildRetroActionTask({
      id: "fixed-id",
      retroId: "rt1",
      action: "CI fixen",
      title: "CI-Pipeline reparieren",
      projectId: "p1",
      projectName: "Projekt A",
    });
    expect(built).toMatchObject({
      id: "fixed-id",
      title: "CI-Pipeline reparieren",
      column: "todo",
      projectId: "p1",
      projectName: "Projekt A",
      priority: "mittel",
      sourceRetroId: "rt1",
      sourceRetroAction: "CI fixen",
    });
    // Optional fields are omitted, not set to undefined.
    expect("assigneeId" in built).toBe(false);
    expect("dueDate" in built).toBe(false);
  });

  it("includes assignee and due date when provided", () => {
    const built = buildRetroActionTask({
      retroId: "rt1",
      action: "CI fixen",
      title: "CI fixen",
      projectId: "p1",
      projectName: "Projekt",
      assigneeId: "person-1",
      dueDate: "2026-08-01",
    });
    expect(built.assigneeId).toBe("person-1");
    expect(built.dueDate).toBe("2026-08-01");
  });

  it("falls back to the action text when the title is blank", () => {
    const built = buildRetroActionTask({
      retroId: "rt1",
      action: "CI fixen",
      title: "   ",
      projectId: "p1",
      projectName: "Projekt",
    });
    expect(built.title).toBe("CI fixen");
  });
});
