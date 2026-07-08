import { describe, expect, it } from "vitest";

import {
  buildKeyBackfill,
  derivePrefix,
  formatItemKey,
  type KeyState,
} from "@/lib/item-key";

/**
 * TASK-064: readable item keys. Pure helpers – prefix derivation (initials,
 * collisions, accents), key formatting and the one-time backfill (shared
 * per-project sequence over stories + tasks, idempotent, deterministic order).
 */

const empty: KeyState = { prefixes: {}, counters: {}, keys: {} };

describe("derivePrefix", () => {
  it("uses word initials for multi-word names", () => {
    expect(derivePrefix("Agentic PM Studio")).toBe("APS");
  });

  it("uses the first letters for a single-word name", () => {
    expect(derivePrefix("Projektmind")).toBe("PRO");
  });

  it("strips accents and non-letters", () => {
    expect(derivePrefix("Übungs Projekt")).toBe("UP");
  });

  it("resolves collisions with a deterministic numeric suffix", () => {
    const taken = new Set(["APS"]);
    expect(derivePrefix("Agentic PM Studio", taken)).toBe("APS2");
    taken.add("APS2");
    expect(derivePrefix("Agentic PM Studio", taken)).toBe("APS3");
  });

  it("falls back to PRJ when no usable letters remain", () => {
    expect(derivePrefix("123 456")).toBe("PRJ");
  });
});

describe("formatItemKey", () => {
  it("joins prefix and number", () => {
    expect(formatItemKey("PMS", 42)).toBe("PMS-42");
  });
});

describe("buildKeyBackfill", () => {
  const input = {
    projects: [
      { id: "p1", name: "Apollo Board" },
      { id: "p2", name: "Zephyr" },
    ],
    stories: [
      { id: "s2", projectId: "p1", rank: 1 },
      { id: "s1", projectId: "p1", rank: 0 },
    ],
    tasks: [
      { id: "t1", projectId: "p1", column: "todo", order: 0 },
      { id: "tz", projectId: "p2", column: "todo", order: 0 },
    ],
  };

  it("registers a prefix per project", () => {
    const next = buildKeyBackfill(input, empty);
    expect(next.prefixes.p1).toBe("AB");
    expect(next.prefixes.p2).toBe("ZEP");
  });

  it("keys stories (by rank) before tasks, sharing the project sequence", () => {
    const next = buildKeyBackfill(input, empty);
    // p1 order: s1 (rank 0), s2 (rank 1), then the task t1.
    expect(next.keys.s1).toBe("AB-1");
    expect(next.keys.s2).toBe("AB-2");
    expect(next.keys.t1).toBe("AB-3");
    expect(next.counters.p1).toBe(3);
    // p2 has its own sequence.
    expect(next.keys.tz).toBe("ZEP-1");
  });

  it("is idempotent – a re-run keeps existing prefixes/keys and adds nothing", () => {
    const once = buildKeyBackfill(input, empty);
    const twice = buildKeyBackfill(input, once);
    expect(twice).toEqual(once);
  });

  it("continues the counter for new items and never reuses a number", () => {
    const once = buildKeyBackfill(input, empty); // p1 counter = 3
    const withNew = buildKeyBackfill(
      {
        ...input,
        stories: [...input.stories, { id: "s3", projectId: "p1", rank: 2 }],
      },
      once,
    );
    expect(withNew.keys.s3).toBe("AB-4");
    // The already-keyed items keep their numbers.
    expect(withNew.keys.s1).toBe("AB-1");
  });

  it("resolves a prefix collision between two projects", () => {
    const next = buildKeyBackfill(
      {
        projects: [
          { id: "p1", name: "Apollo Beta" },
          { id: "p2", name: "Apollo Board" },
        ],
        stories: [],
        tasks: [],
      },
      empty,
    );
    expect(next.prefixes.p1).toBe("AB");
    expect(next.prefixes.p2).toBe("AB2");
  });
});
