import { describe, expect, it } from "vitest";

import { sprintCommitment } from "@/lib/capacity";
import type { Person } from "@/types";

/**
 * TASK-059: the commitment warning is a pure comparison of planned person-days
 * against the combined capacity of the given people. No capacity ⇒ never warns
 * (so an empty roster does not flag every sprint).
 */

function people(...caps: number[]): Pick<Person, "capacityPtPerSprint">[] {
  return caps.map((capacityPtPerSprint) => ({ capacityPtPerSprint }));
}

describe("sprintCommitment (TASK-059)", () => {
  it("sums the given people's capacity", () => {
    const result = sprintCommitment(10, people(8, 5));
    expect(result.capacityPt).toBe(13);
    expect(result.plannedPt).toBe(10);
  });

  it("flags overcommitment when planned exceeds capacity", () => {
    expect(sprintCommitment(20, people(8, 8)).overcommitted).toBe(true);
  });

  it("does not warn when planned equals capacity", () => {
    expect(sprintCommitment(16, people(8, 8)).overcommitted).toBe(false);
  });

  it("does not warn when planned is under capacity", () => {
    expect(sprintCommitment(10, people(8, 8)).overcommitted).toBe(false);
  });

  it("never warns without any capacity (empty roster)", () => {
    const result = sprintCommitment(5, people());
    expect(result.capacityPt).toBe(0);
    expect(result.overcommitted).toBe(false);
  });
});
