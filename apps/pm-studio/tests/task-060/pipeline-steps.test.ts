import { describe, expect, it } from "vitest";

import { stepStatusesForPhase } from "@/lib/pipeline-steps";

/**
 * TASK-060: the gate stepper mapping. The mockup only drives draft →
 * requirements → scrum; the gates surface as `awaiting_review`. PO/Risk/Review
 * stay pending (wired in M6/M7).
 */
describe("stepStatusesForPhase", () => {
  it("idle → everything pending", () => {
    const s = stepStatusesForPhase("idle");
    expect(Object.values(s).every((v) => v === "pending")).toBe(true);
  });

  it("chatting → draft is running, nothing done yet", () => {
    const s = stepStatusesForPhase("chatting");
    expect(s.draft).toBe("running");
    expect(s.requirements).toBe("pending");
  });

  it("draft_review → draft holds at awaiting_review (gate)", () => {
    const s = stepStatusesForPhase("draft_review");
    expect(s.draft).toBe("awaiting_review");
    expect(s.requirements).toBe("pending");
  });

  it("requirements_review → draft done, requirements at the gate", () => {
    const s = stepStatusesForPhase("requirements_review");
    expect(s.draft).toBe("done");
    expect(s.requirements).toBe("awaiting_review");
    expect(s.scrum).toBe("pending");
  });

  it("proposals with pending items → scrum at the gate", () => {
    const s = stepStatusesForPhase("proposals", true);
    expect(s.draft).toBe("done");
    expect(s.requirements).toBe("done");
    expect(s.scrum).toBe("awaiting_review");
  });

  it("proposals with none left → scrum done", () => {
    expect(stepStatusesForPhase("proposals", false).scrum).toBe("done");
  });
});
