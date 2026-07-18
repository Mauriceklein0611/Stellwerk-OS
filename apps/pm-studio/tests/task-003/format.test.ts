import { describe, expect, it } from "vitest";

import { formatRelativeTime } from "@/lib/format";

const now = new Date("2026-06-11T12:00:00Z");
const minutesAgo = (minutes: number): string =>
  new Date(now.getTime() - minutes * 60_000).toISOString();

describe("formatRelativeTime", () => {
  it("returns 'gerade eben' under a minute", () => {
    expect(formatRelativeTime(minutesAgo(0), now)).toBe("gerade eben");
  });

  it("formats minutes", () => {
    expect(formatRelativeTime(minutesAgo(5), now)).toBe("vor 5 min");
  });

  it("formats hours", () => {
    expect(formatRelativeTime(minutesAgo(120), now)).toBe("vor 2 h");
  });

  it("formats days", () => {
    expect(formatRelativeTime(minutesAgo(60 * 24 * 2), now)).toBe("vor 2 d");
  });
});
