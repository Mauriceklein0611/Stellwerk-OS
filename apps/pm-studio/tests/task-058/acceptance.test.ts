import { describe, expect, it } from "vitest";

import {
  acceptanceComplete,
  acceptanceProgress,
  addAcceptanceCriterion,
  criteriaFromStrings,
  normalizeAcceptance,
  removeAcceptanceCriterion,
  renameAcceptanceCriterion,
  toggleAcceptanceCriterion,
} from "@/lib/acceptance";
import type { AcceptanceCriterion } from "@/types";

/**
 * TASK-058: pure acceptance-criteria transforms (mirror of the checklist
 * helpers, but story-level and with a required `[]` field).
 */

function ac(id: string, text: string, done = false): AcceptanceCriterion {
  return { id, text, done };
}

describe("acceptanceProgress / acceptanceComplete", () => {
  it("counts done vs. total; missing list is 0/0 and not complete", () => {
    expect(acceptanceProgress()).toEqual({ done: 0, total: 0 });
    expect(acceptanceComplete()).toBe(false);
    const items = [ac("1", "a", true), ac("2", "b", false)];
    expect(acceptanceProgress(items)).toEqual({ done: 1, total: 2 });
    expect(acceptanceComplete(items)).toBe(false);
    expect(acceptanceComplete([ac("1", "a", true)])).toBe(true);
  });
});

describe("add/toggle/rename/remove", () => {
  it("adds a trimmed, open criterion and ignores blank text", () => {
    const base: AcceptanceCriterion[] = [];
    const added = addAcceptanceCriterion(base, "  Kriterium  ");
    expect(added).toHaveLength(1);
    expect(added[0]).toMatchObject({ text: "Kriterium", done: false });
    // Blank input returns the SAME array reference (used by the dialog to keep
    // the input field's value).
    expect(addAcceptanceCriterion(base, "   ")).toBe(base);
  });

  it("toggles done by id", () => {
    const items = [ac("1", "a", false)];
    expect(toggleAcceptanceCriterion(items, "1")[0].done).toBe(true);
    expect(toggleAcceptanceCriterion(items, "x")).toEqual(items);
  });

  it("renames WITHOUT trimming (interim edits allowed)", () => {
    const items = [ac("1", "a")];
    expect(renameAcceptanceCriterion(items, "1", "  neu ")[0].text).toBe("  neu ");
  });

  it("removes by id", () => {
    const items = [ac("1", "a"), ac("2", "b")];
    expect(removeAcceptanceCriterion(items, "1")).toEqual([ac("2", "b")]);
  });
});

describe("normalizeAcceptance", () => {
  it("trims, drops empty and always returns an array (never undefined)", () => {
    const items = [ac("1", "  a "), ac("2", "   "), ac("3", "b", true)];
    expect(normalizeAcceptance(items)).toEqual([
      ac("1", "a"),
      ac("3", "b", true),
    ]);
    expect(normalizeAcceptance([])).toEqual([]);
  });
});

describe("criteriaFromStrings", () => {
  it("maps strings to open criteria, dropping blanks, with injectable ids", () => {
    const result = criteriaFromStrings(
      ["AK eins", "  ", " AK zwei "],
      (i) => `ac-${i}`,
    );
    expect(result).toEqual([
      { id: "ac-0", text: "AK eins", done: false },
      { id: "ac-1", text: "AK zwei", done: false },
    ]);
  });
});
