import { describe, expect, it } from "vitest";

import {
  DUE_STATUS_TOKEN,
  dueStatus,
  formatDueDate,
  isOverdue,
} from "@/lib/due";

const TODAY = "2026-06-16";

describe("isOverdue", () => {
  it("is true when an open task's due date is in the past", () => {
    expect(isOverdue("2026-06-15", TODAY, false)).toBe(true);
  });

  it("is false for today and the future", () => {
    expect(isOverdue(TODAY, TODAY, false)).toBe(false);
    expect(isOverdue("2026-06-17", TODAY, false)).toBe(false);
  });

  it("is false for done tasks even when the date is past", () => {
    expect(isOverdue("2026-06-01", TODAY, true)).toBe(false);
  });

  it("is false without a due date", () => {
    expect(isOverdue(undefined, TODAY, false)).toBe(false);
  });
});

describe("dueStatus", () => {
  it("classifies past / today / future for open tasks", () => {
    expect(dueStatus("2026-06-15", TODAY, false)).toBe("overdue");
    expect(dueStatus(TODAY, TODAY, false)).toBe("today");
    expect(dueStatus("2026-06-17", TODAY, false)).toBe("upcoming");
  });

  it("is always upcoming (neutral) for done tasks", () => {
    expect(dueStatus("2026-06-01", TODAY, true)).toBe("upcoming");
    expect(dueStatus(TODAY, TODAY, true)).toBe("upcoming");
  });

  it("maps to StatusBadge tokens (warning/danger), upcoming stays neutral", () => {
    expect(DUE_STATUS_TOKEN.overdue).toBe("danger");
    expect(DUE_STATUS_TOKEN.today).toBe("warning");
    expect(DUE_STATUS_TOKEN.upcoming).toBeUndefined();
  });
});

describe("formatDueDate", () => {
  it("formats an ISO date as DD.MM.", () => {
    expect(formatDueDate("2026-06-16")).toBe("16.06.");
  });

  it("returns an empty string for missing/invalid input", () => {
    expect(formatDueDate(undefined)).toBe("");
    expect(formatDueDate("")).toBe("");
    expect(formatDueDate("2026")).toBe("");
  });
});
