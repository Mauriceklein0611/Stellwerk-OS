import { beforeEach, describe, expect, it } from "vitest";

import { useBoardStore } from "@/store/useBoardStore";
import type { BoardTask } from "@/types";

/** The persist migrate function configured on the board store. */
const migrate = useBoardStore.persist.getOptions().migrate!;

describe("board store viewExplicit (TASK-029)", () => {
  beforeEach(() =>
    useBoardStore.setState({ view: "kanban", viewExplicit: false }),
  );

  it("starts not explicit so the board follows the settings default", () => {
    expect(useBoardStore.getState().viewExplicit).toBe(false);
  });

  it("marks the view explicit once the user toggles it", () => {
    useBoardStore.getState().setView("list");
    expect(useBoardStore.getState().view).toBe("list");
    expect(useBoardStore.getState().viewExplicit).toBe(true);
  });

  it("persists viewExplicit via partialize", () => {
    const partialize = useBoardStore.persist.getOptions().partialize!;
    useBoardStore.getState().setView("list");
    const persisted = partialize(useBoardStore.getState()) as unknown as {
      viewExplicit: boolean;
    };
    expect(persisted.viewExplicit).toBe(true);
  });
});

describe("board store migration v3 → v4 (TASK-029)", () => {
  const baseTask: BoardTask = {
    id: "t1",
    title: "Alt",
    column: "todo",
    order: 0,
    projectId: "p-1",
    projectName: "P1",
    priority: "mittel",
  };

  it("treats an existing persisted view as an explicit choice", () => {
    const migrated = migrate({ tasks: [baseTask], view: "list" }, 3) as unknown as {
      viewExplicit: boolean;
    };
    expect(migrated.viewExplicit).toBe(true);
  });

  it("leaves already-migrated v4 state untouched", () => {
    const migrated = migrate(
      { tasks: [baseTask], view: "kanban", viewExplicit: false },
      4,
    ) as unknown as { viewExplicit: boolean };
    expect(migrated.viewExplicit).toBe(false);
  });
});
