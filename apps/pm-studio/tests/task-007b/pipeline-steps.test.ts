import { describe, expect, it } from "vitest";

import { computeStepStatuses } from "@/lib/pipeline-steps";
import type { AgentRun } from "@/types";

const run = (agent: string): AgentRun => ({
  id: agent,
  agent,
  project: "P",
  status: "success",
  timestamp: new Date().toISOString(),
});

describe("computeStepStatuses", () => {
  it("is all pending when nothing ran", () => {
    const status = computeStepStatuses([], false, false);
    expect(Object.values(status).every((s) => s === "pending")).toBe(true);
  });

  it("marks done agents and the next agent step as running", () => {
    const status = computeStepStatuses(
      [run("Draft-Agent"), run("Requirements-Agent")],
      true,
      false,
    );
    expect(status.draft).toBe("done");
    expect(status.requirements).toBe("done");
    expect(status.scrum).toBe("running");
    expect(status.po).toBe("pending");
    expect(status.risk).toBe("pending");
  });

  it("marks the 4 artifact steps done from persisted artifacts (after reload)", () => {
    const status = computeStepStatuses([], false, true);
    expect(status.draft).toBe("done");
    expect(status.requirements).toBe("done");
    expect(status.scrum).toBe("done");
    expect(status.risk).toBe("done");
    // PO/Review are not run by the mock pipeline.
    expect(status.po).toBe("pending");
    expect(status.review).toBe("pending");
  });
});
