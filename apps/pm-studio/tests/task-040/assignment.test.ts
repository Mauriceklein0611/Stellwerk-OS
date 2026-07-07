import { describe, expect, it } from "vitest";

import { detachAssignee } from "@/lib/assignment";
import type { BoardTask } from "@/types";

const base: Omit<BoardTask, "id" | "assigneeId"> = {
  title: "Task",
  column: "todo",
  order: 0,
  projectId: "p1",
  projectName: "Projekt",
  priority: "mittel",
};

describe("detachAssignee (TASK-040)", () => {
  it("clears assigneeId only on the deleted person's tasks", () => {
    const tasks: BoardTask[] = [
      { ...base, id: "1", assigneeId: "alice" },
      { ...base, id: "2", assigneeId: "bob" },
      { ...base, id: "3" },
    ];

    const result = detachAssignee(tasks, "alice");

    expect(result.find((t) => t.id === "1")?.assigneeId).toBeUndefined();
    expect(result.find((t) => t.id === "2")?.assigneeId).toBe("bob");
    expect(result.find((t) => t.id === "3")?.assigneeId).toBeUndefined();
  });

  it("returns the same task reference when nothing changes", () => {
    const tasks: BoardTask[] = [{ ...base, id: "1", assigneeId: "bob" }];
    const result = detachAssignee(tasks, "alice");
    expect(result[0]).toBe(tasks[0]);
  });

  it("removes the assigneeId key entirely (no dangling undefined value)", () => {
    const tasks: BoardTask[] = [{ ...base, id: "1", assigneeId: "alice" }];
    const result = detachAssignee(tasks, "alice");
    expect("assigneeId" in result[0]).toBe(false);
  });
});
