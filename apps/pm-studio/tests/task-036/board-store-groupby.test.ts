import { beforeEach, describe, expect, it } from "vitest";

import { useBoardStore } from "@/store/useBoardStore";

describe("useBoardStore groupBy (TASK-036)", () => {
  beforeEach(() => {
    useBoardStore.setState({ groupBy: "none" });
  });

  it("defaults to 'none'", () => {
    expect(useBoardStore.getState().groupBy).toBe("none");
  });

  it("setGroupBy updates the persisted grouping dimension", () => {
    useBoardStore.getState().setGroupBy("assignee");
    expect(useBoardStore.getState().groupBy).toBe("assignee");

    useBoardStore.getState().setGroupBy("sprint");
    expect(useBoardStore.getState().groupBy).toBe("sprint");
  });

  it("is part of the persisted partition", () => {
    // The persisted slice carries groupBy so the choice survives a reload.
    const persisted = useBoardStore.persist.getOptions().partialize?.(
      useBoardStore.getState(),
    ) as { groupBy?: string };
    expect(persisted).toHaveProperty("groupBy");
  });
});
