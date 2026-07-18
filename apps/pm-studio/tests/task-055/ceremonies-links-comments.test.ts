import { describe, expect, it } from "vitest";

import {
  addComment,
  commentsChronological,
  createComment,
  removeComment,
  resolveLinks,
  toggleLink,
} from "@/lib/ceremonies";
import type { CeremonyComment } from "@/types";

describe("toggleLink (TASK-055)", () => {
  it("adds an id when absent", () => {
    expect(toggleLink(undefined, "a")).toEqual(["a"]);
    expect(toggleLink(["a"], "b")).toEqual(["a", "b"]);
  });

  it("removes an id when present", () => {
    expect(toggleLink(["a", "b"], "a")).toEqual(["b"]);
  });
});

describe("resolveLinks (TASK-055)", () => {
  const items = [
    { id: "s1", title: "Login" },
    { id: "s2", title: "Logout" },
  ];

  it("resolves ids to titles", () => {
    expect(resolveLinks(["s2"], items)).toEqual([
      { id: "s2", label: "Logout", missing: false },
    ]);
  });

  it("flags deleted items as missing without crashing", () => {
    expect(resolveLinks(["s1", "gone"], items)).toEqual([
      { id: "s1", label: "Login", missing: false },
      { id: "gone", label: "Gelöschtes Item", missing: true },
    ]);
  });

  it("returns an empty array for undefined ids", () => {
    expect(resolveLinks(undefined, items)).toEqual([]);
  });
});

describe("createComment (TASK-055)", () => {
  it("trims and injects id/createdAt", () => {
    const comment = createComment(
      { author: "  Mia ", text: "  gut gelaufen  " },
      { id: "c1", now: "2026-07-02T10:00:00.000Z" },
    );
    expect(comment).toEqual({
      id: "c1",
      author: "Mia",
      text: "gut gelaufen",
      createdAt: "2026-07-02T10:00:00.000Z",
    });
  });

  it("returns null for blank text", () => {
    expect(createComment({ author: "Mia", text: "   " })).toBeNull();
  });

  it("falls back to 'Unbekannt' for a blank author", () => {
    const comment = createComment({ author: "  ", text: "hi" }, { id: "c", now: "x" });
    expect(comment?.author).toBe("Unbekannt");
  });

  it("generates distinct ids without options", () => {
    const a = createComment({ author: "a", text: "x" });
    const b = createComment({ author: "a", text: "x" });
    expect(a?.id).not.toBe(b?.id);
  });
});

describe("comment thread transforms (TASK-055)", () => {
  const base = (id: string, createdAt: string): CeremonyComment => ({
    id,
    author: "a",
    text: "t",
    createdAt,
  });

  it("appends and removes comments immutably", () => {
    const c1 = base("c1", "2026-01-01T00:00:00.000Z");
    const withOne = addComment(undefined, c1);
    expect(withOne).toEqual([c1]);

    const c2 = base("c2", "2026-01-02T00:00:00.000Z");
    const withTwo = addComment(withOne, c2);
    expect(withTwo).toHaveLength(2);

    expect(removeComment(withTwo, "c1")).toEqual([c2]);
    expect(removeComment(undefined, "c1")).toEqual([]);
  });

  it("orders comments chronologically (oldest first)", () => {
    const older = base("older", "2026-01-01T00:00:00.000Z");
    const newer = base("newer", "2026-03-01T00:00:00.000Z");
    expect(commentsChronological([newer, older]).map((c) => c.id)).toEqual([
      "older",
      "newer",
    ]);
    expect(commentsChronological(undefined)).toEqual([]);
  });
});
