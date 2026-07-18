import { describe, expect, it } from "vitest";

import { formatSprintRange, isActiveSprint } from "@/lib/sprint";
import type { PlannedSprint } from "@/types";

function sprint(patch: Partial<PlannedSprint> = {}): PlannedSprint {
  return {
    id: "s-1",
    projectId: "p-1",
    name: "Sprint 1",
    goal: "",
    status: "planned",
    storyIds: [],
    order: 0,
    ...patch,
  };
}

describe("isActiveSprint", () => {
  it("is active when today is within the timebox (inclusive bounds)", () => {
    const s = sprint({ startDate: "2026-07-01", endDate: "2026-07-14" });
    expect(isActiveSprint(s, "2026-07-07")).toBe(true);
    expect(isActiveSprint(s, "2026-07-01")).toBe(true); // start boundary
    expect(isActiveSprint(s, "2026-07-14")).toBe(true); // end boundary
  });

  it("is inactive before the start or after the end", () => {
    const s = sprint({ startDate: "2026-07-01", endDate: "2026-07-14" });
    expect(isActiveSprint(s, "2026-06-30")).toBe(false);
    expect(isActiveSprint(s, "2026-07-15")).toBe(false);
  });

  it("is never active without a full timebox", () => {
    expect(isActiveSprint(sprint(), "2026-07-07")).toBe(false);
    expect(isActiveSprint(sprint({ startDate: "2026-07-01" }), "2026-07-07")).toBe(
      false,
    );
    expect(isActiveSprint(sprint({ endDate: "2026-07-14" }), "2026-07-07")).toBe(
      false,
    );
  });

  it("ignores the manually set status (derived purely from dates)", () => {
    const planned = sprint({
      status: "planned",
      startDate: "2026-07-01",
      endDate: "2026-07-14",
    });
    expect(isActiveSprint(planned, "2026-07-07")).toBe(true);
  });
});

describe("formatSprintRange", () => {
  it("formats a full range as compact DD.MM.", () => {
    expect(
      formatSprintRange(sprint({ startDate: "2026-07-01", endDate: "2026-07-14" })),
    ).toBe("01.07.–14.07.");
  });

  it("falls back for one-sided boxes", () => {
    expect(formatSprintRange(sprint({ startDate: "2026-07-01" }))).toBe("ab 01.07.");
    expect(formatSprintRange(sprint({ endDate: "2026-07-14" }))).toBe("bis 14.07.");
  });

  it("returns an empty string without dates", () => {
    expect(formatSprintRange(sprint())).toBe("");
  });
});
