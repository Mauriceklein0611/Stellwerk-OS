import { describe, expect, it } from "vitest";

import {
  addChecklistItem,
  checklistComplete,
  checklistProgress,
  normalizeChecklist,
  removeChecklistItem,
  renameChecklistItem,
  toggleChecklistItem,
} from "@/lib/checklist";
import type { ChecklistItem } from "@/types";

const item = (
  id: string,
  text: string,
  done = false,
): ChecklistItem => ({ id, text, done });

describe("checklistProgress (TASK-035)", () => {
  it("is 0/0 for an empty or missing checklist", () => {
    expect(checklistProgress(undefined)).toEqual({ done: 0, total: 0 });
    expect(checklistProgress([])).toEqual({ done: 0, total: 0 });
  });

  it("counts partially done items", () => {
    const items = [item("1", "a", true), item("2", "b"), item("3", "c", true)];
    expect(checklistProgress(items)).toEqual({ done: 2, total: 3 });
  });

  it("counts a fully done checklist", () => {
    const items = [item("1", "a", true), item("2", "b", true)];
    expect(checklistProgress(items)).toEqual({ done: 2, total: 2 });
  });
});

describe("checklistComplete", () => {
  it("is false when empty/missing or partial, true when all done", () => {
    expect(checklistComplete(undefined)).toBe(false);
    expect(checklistComplete([])).toBe(false);
    expect(checklistComplete([item("1", "a", true), item("2", "b")])).toBe(false);
    expect(checklistComplete([item("1", "a", true)])).toBe(true);
  });
});

describe("addChecklistItem", () => {
  it("appends a trimmed, open item with a generated id", () => {
    const next = addChecklistItem([], "  Schreiben  ");
    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({ text: "Schreiben", done: false });
    expect(next[0].id).toBeTruthy();
  });

  it("ignores empty/whitespace input (same array reference)", () => {
    const items = [item("1", "a")];
    expect(addChecklistItem(items, "   ")).toBe(items);
    expect(addChecklistItem(items, "")).toBe(items);
  });
});

describe("toggleChecklistItem", () => {
  it("flips only the matching item's done flag", () => {
    const items = [item("1", "a"), item("2", "b", true)];
    const next = toggleChecklistItem(items, "1");
    expect(next[0].done).toBe(true);
    expect(next[1].done).toBe(true);
  });
});

describe("renameChecklistItem", () => {
  it("sets the raw text without trimming (cleanup happens on save)", () => {
    const items = [item("1", "a")];
    expect(renameChecklistItem(items, "1", "  neu ")[0].text).toBe("  neu ");
  });
});

describe("removeChecklistItem", () => {
  it("drops the matching item", () => {
    const items = [item("1", "a"), item("2", "b")];
    expect(removeChecklistItem(items, "1")).toEqual([item("2", "b")]);
  });
});

describe("normalizeChecklist", () => {
  it("trims texts and drops empty items", () => {
    const items = [item("1", "  a "), item("2", "   "), item("3", "b")];
    expect(normalizeChecklist(items)).toEqual([
      item("1", "a"),
      item("3", "b"),
    ]);
  });

  it("returns undefined when nothing meaningful remains", () => {
    expect(normalizeChecklist([])).toBeUndefined();
    expect(normalizeChecklist([item("1", "  ")])).toBeUndefined();
  });
});
