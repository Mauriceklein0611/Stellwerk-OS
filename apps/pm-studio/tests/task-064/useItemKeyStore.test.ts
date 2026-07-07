import { beforeEach, describe, expect, it } from "vitest";

import { useItemKeyStore } from "@/store/useItemKeyStore";

/**
 * TASK-064: item-key store. Covers prefix registration, idempotent key
 * allocation with an only-counts-up counter (keys never reused), and the
 * one-time backfill reading the persisted stores from localStorage.
 */

beforeEach(() => {
  useItemKeyStore.setState({
    prefixes: {},
    counters: {},
    keys: {},
    backfilled: false,
  });
  localStorage.clear();
});

describe("registerProject", () => {
  it("derives and stores a prefix once (idempotent)", () => {
    const { registerProject } = useItemKeyStore.getState();
    registerProject("p1", "Apollo Board");
    expect(useItemKeyStore.getState().prefixes.p1).toBe("AB");
    // A second call keeps the original prefix.
    registerProject("p1", "Andere Bezeichnung");
    expect(useItemKeyStore.getState().prefixes.p1).toBe("AB");
  });

  it("resolves collisions across projects", () => {
    const { registerProject } = useItemKeyStore.getState();
    registerProject("p1", "Apollo Board");
    registerProject("p2", "Apollo Beta");
    expect(useItemKeyStore.getState().prefixes.p2).toBe("AB2");
  });
});

describe("assignKey", () => {
  it("hands out a running key per project", () => {
    const store = useItemKeyStore.getState();
    store.registerProject("p1", "Apollo Board");
    expect(store.assignKey("s1", "p1")).toBe("AB-1");
    expect(store.assignKey("t1", "p1", "Apollo Board")).toBe("AB-2");
  });

  it("is idempotent per item id", () => {
    const store = useItemKeyStore.getState();
    store.registerProject("p1", "Apollo Board");
    const first = store.assignKey("s1", "p1");
    const again = store.assignKey("s1", "p1");
    expect(again).toBe(first);
    expect(useItemKeyStore.getState().counters.p1).toBe(1);
  });

  it("never reuses a number after an item disappears", () => {
    const store = useItemKeyStore.getState();
    store.registerProject("p1", "Apollo Board");
    store.assignKey("s1", "p1"); // AB-1
    // Simulate the item being deleted (its key stays in the map).
    // A newly created item continues the counter, it never falls back to AB-1.
    expect(store.assignKey("s2", "p1")).toBe("AB-2");
  });

  it("lazily registers a prefix from the passed name when missing", () => {
    const store = useItemKeyStore.getState();
    expect(store.assignKey("t1", "p9", "Fresh Project")).toBe("FP-1");
  });
});

describe("runBackfill", () => {
  it("keys pre-existing stories/tasks from localStorage, once", () => {
    localStorage.setItem(
      "pm-studio-projects",
      JSON.stringify({ state: { ideas: [{ id: "p1", name: "Apollo Board" }] } }),
    );
    localStorage.setItem(
      "pm-studio-backlog",
      JSON.stringify({
        state: {
          stories: [
            { id: "s1", projectId: "p1", rank: 0 },
            { id: "s2", projectId: "p1", rank: 1 },
          ],
        },
      }),
    );
    localStorage.setItem(
      "pm-studio-board",
      JSON.stringify({
        state: {
          tasks: [{ id: "t1", projectId: "p1", column: "todo", order: 0 }],
        },
      }),
    );

    useItemKeyStore.getState().runBackfill();
    const state = useItemKeyStore.getState();
    expect(state.backfilled).toBe(true);
    expect(state.keys).toEqual({ s1: "AB-1", s2: "AB-2", t1: "AB-3" });

    // A second run is a no-op even with more data present.
    localStorage.setItem(
      "pm-studio-backlog",
      JSON.stringify({
        state: { stories: [{ id: "s9", projectId: "p1", rank: 5 }] },
      }),
    );
    useItemKeyStore.getState().runBackfill();
    expect(useItemKeyStore.getState().keys.s9).toBeUndefined();
  });
});
