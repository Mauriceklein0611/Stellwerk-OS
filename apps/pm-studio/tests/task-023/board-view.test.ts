import { beforeEach, describe, expect, it } from "vitest";

import { useBoardStore } from "@/store/useBoardStore";

describe("useBoardStore view", () => {
  beforeEach(() => useBoardStore.setState({ view: "kanban" }));

  it("defaults to the kanban view", () => {
    expect(useBoardStore.getState().view).toBe("kanban");
  });

  it("setView switches the view (persisted via the store)", () => {
    useBoardStore.getState().setView("list");
    expect(useBoardStore.getState().view).toBe("list");
    useBoardStore.getState().setView("kanban");
    expect(useBoardStore.getState().view).toBe("kanban");
  });

  it("persists the view field via partialize", () => {
    const partialize = useBoardStore.persist.getOptions().partialize!;
    useBoardStore.getState().setView("list");
    const persisted = partialize(useBoardStore.getState()) as unknown as {
      view: string;
    };
    expect(persisted.view).toBe("list");
  });
});
