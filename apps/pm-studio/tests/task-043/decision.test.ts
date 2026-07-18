import { describe, expect, it } from "vitest";

import { createDecision, decisionsForEntity } from "@/lib/decision";
import type { Decision } from "@/types";

describe("createDecision (TASK-043)", () => {
  it("trims fields, defaults actor to 'human', fills id/createdAt", () => {
    const decision = createDecision(
      {
        context: "  Scope-Frage  ",
        choice: "  MVP zuerst  ",
        rationale: "  Budget  ",
        relatedEntity: { type: "project", id: "p1" },
      },
      { id: "d1", now: new Date("2026-06-22T10:00:00.000Z") },
    );

    expect(decision).toEqual({
      id: "d1",
      context: "Scope-Frage",
      choice: "MVP zuerst",
      rationale: "Budget",
      actor: "human",
      createdAt: "2026-06-22T10:00:00.000Z",
      relatedEntity: { type: "project", id: "p1" },
    });
  });

  it("drops a blank rationale to undefined", () => {
    const decision = createDecision(
      { context: "c", choice: "x", rationale: "   " },
      { id: "d2" },
    );
    expect(decision?.rationale).toBeUndefined();
  });

  it("returns null when context or choice is blank", () => {
    expect(createDecision({ context: "  ", choice: "x" })).toBeNull();
    expect(createDecision({ context: "c", choice: "  " })).toBeNull();
  });
});

function decision(patch: Partial<Decision>): Decision {
  return {
    id: "d",
    context: "c",
    choice: "x",
    actor: "human",
    createdAt: "2026-06-22T10:00:00.000Z",
    relatedEntity: { type: "project", id: "p1" },
    ...patch,
  };
}

describe("decisionsForEntity (TASK-043)", () => {
  const decisions: Decision[] = [
    decision({ id: "a", createdAt: "2026-06-22T10:00:00.000Z" }),
    decision({ id: "b", createdAt: "2026-06-22T12:00:00.000Z" }),
    decision({ id: "c", relatedEntity: { type: "sprint", id: "p1" } }),
    decision({ id: "e", relatedEntity: undefined }),
  ];

  it("filters by related entity and returns newest first", () => {
    const result = decisionsForEntity(decisions, "project", "p1");
    expect(result.map((d) => d.id)).toEqual(["b", "a"]);
  });

  it("ignores decisions without a matching related entity", () => {
    expect(decisionsForEntity(decisions, "release", "p1")).toEqual([]);
  });
});
