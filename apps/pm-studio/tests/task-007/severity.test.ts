import { describe, expect, it } from "vitest";

import { severityBadge } from "@/lib/severity";

describe("severityBadge", () => {
  it("maps levels to StatusBadge status + label", () => {
    expect(severityBadge("hoch")).toEqual({ status: "danger", label: "Hoch" });
    expect(severityBadge("mittel")).toEqual({ status: "warning", label: "Mittel" });
    expect(severityBadge("niedrig")).toEqual({ status: "info", label: "Niedrig" });
  });
});
