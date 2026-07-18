import { describe, expect, it } from "vitest";

import { PROVENANCE_META } from "@/lib/provenance";

/**
 * TASK-060: provenance → badge meta. Agent-provided items carry a visible mark,
 * manually created ones stay unmarked (no badge → no noise).
 */
describe("PROVENANCE_META", () => {
  it("marks agent items as info", () => {
    expect(PROVENANCE_META.agent).toEqual({ status: "info", label: "Agent" });
  });

  it("marks agent-then-edited items as warning", () => {
    expect(PROVENANCE_META.human_edited).toEqual({
      status: "warning",
      label: "bearbeitet",
    });
  });

  it("shows no badge for manually created items", () => {
    expect(PROVENANCE_META.human).toBeNull();
  });
});
