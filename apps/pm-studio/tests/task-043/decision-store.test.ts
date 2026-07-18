import { beforeEach, describe, expect, it } from "vitest";

import { decisionsForEntity } from "@/lib/decision";
import { useDecisionStore } from "@/store/useDecisionStore";

beforeEach(() => {
  useDecisionStore.setState({ decisions: [] });
});

const decisions = () => useDecisionStore.getState().decisions;

describe("useDecisionStore (TASK-043)", () => {
  it("records a decision with its related entity", () => {
    useDecisionStore.getState().addDecision({
      context: "Scope",
      choice: "MVP zuerst",
      rationale: "Budget knapp",
      relatedEntity: { type: "project", id: "p1" },
    });

    const list = decisionsForEntity(decisions(), "project", "p1");
    expect(list).toHaveLength(1);
    expect(list[0].choice).toBe("MVP zuerst");
    expect(list[0].rationale).toBe("Budget knapp");
  });

  it("ignores a blank decision (no context or choice)", () => {
    useDecisionStore.getState().addDecision({ context: "  ", choice: "x" });
    useDecisionStore.getState().addDecision({ context: "c", choice: "   " });
    expect(decisions()).toHaveLength(0);
  });

  it("removeDecision drops the entry", () => {
    useDecisionStore.getState().addDecision({
      context: "c",
      choice: "x",
      relatedEntity: { type: "sprint", id: "s1" },
    });
    const id = decisions()[0].id;
    useDecisionStore.getState().removeDecision(id);
    expect(decisions()).toHaveLength(0);
  });
});
