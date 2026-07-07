import { describe, expect, it } from "vitest";

import { STATUS_COLOR_VARS } from "@/components/agents/StatusBadge";
import type { StatusType } from "@/types";

const STATUSES: StatusType[] = [
  "success",
  "warning",
  "danger",
  "info",
  "idle",
  "running",
];

describe("STATUS_COLOR_VARS", () => {
  it("maps every status to a design-token CSS variable", () => {
    STATUSES.forEach((status) => {
      expect(STATUS_COLOR_VARS[status]).toMatch(/^var\(--[a-z]+\)$/);
    });
  });

  it("uses no raw hex colors", () => {
    Object.values(STATUS_COLOR_VARS).forEach((value) => {
      expect(value).not.toMatch(/#[0-9a-fA-F]/);
    });
  });
});
