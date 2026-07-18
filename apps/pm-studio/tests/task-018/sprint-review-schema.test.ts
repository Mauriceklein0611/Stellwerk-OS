import { describe, expect, it } from "vitest";

import {
  cleanRetroItems,
  retroFromLists,
  retroListsFromRetro,
  reviewFormDefaults,
  reviewFormSchema,
  reviewFromForm,
} from "@/lib/sprint-review-schema";
import type { SprintRetro, SprintReview } from "@/types";

describe("reviewFormSchema (TASK-018)", () => {
  it("requires a non-empty 'delivered' text", () => {
    const result = reviewFormSchema.safeParse({ delivered: "   ", achievedPt: 3 });
    expect(result.success).toBe(false);
  });

  it("rejects a non-numeric (NaN) achievedPt", () => {
    const result = reviewFormSchema.safeParse({ delivered: "ok", achievedPt: Number.NaN });
    expect(result.success).toBe(false);
  });

  it("rejects negative story-points", () => {
    const result = reviewFormSchema.safeParse({ delivered: "ok", achievedPt: -1 });
    expect(result.success).toBe(false);
  });

  it("accepts a valid review (notes optional)", () => {
    const result = reviewFormSchema.safeParse({ delivered: "ok", achievedPt: 0 });
    expect(result.success).toBe(true);
  });
});

describe("reviewFormDefaults / reviewFromForm", () => {
  it("defaults to empty values without an existing review", () => {
    expect(reviewFormDefaults()).toEqual({ delivered: "", achievedPt: 0, notes: "" });
  });

  it("pre-fills from an existing review", () => {
    // Ceremony metadata (TASK-054) is ignored by reviewFormDefaults.
    const review: SprintReview = {
      sprintId: "s1",
      delivered: "X",
      achievedPt: 5,
      notes: "n",
      id: "r1",
      scope: "cross",
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    expect(reviewFormDefaults(review)).toEqual({ delivered: "X", achievedPt: 5, notes: "n" });
  });

  it("trims fields and omits empty notes", () => {
    const built = reviewFromForm("s1", { delivered: "  Login  ", achievedPt: 5, notes: "   " });
    expect(built).toEqual({ sprintId: "s1", delivered: "Login", achievedPt: 5 });
    expect("notes" in built).toBe(false);
  });

  it("keeps trimmed notes when present", () => {
    const built = reviewFromForm("s1", { delivered: "x", achievedPt: 1, notes: "  hi " });
    expect(built.notes).toBe("hi");
  });
});

describe("retro helpers", () => {
  it("cleanRetroItems trims and drops empty entries", () => {
    expect(cleanRetroItems(["  a ", "", "  ", "b"])).toEqual(["a", "b"]);
  });

  it("retroFromLists cleans all three lists", () => {
    const built = retroFromLists("s1", {
      good: [" gut ", ""],
      improve: ["", "  besser "],
      actions: ["tun"],
    });
    expect(built).toEqual({
      sprintId: "s1",
      good: ["gut"],
      improve: ["besser"],
      actions: ["tun"],
    });
  });

  it("retroListsFromRetro falls back to empty lists", () => {
    expect(retroListsFromRetro()).toEqual({ good: [], improve: [], actions: [] });
  });

  it("retroListsFromRetro mirrors an existing retro", () => {
    const retro: SprintRetro = {
      sprintId: "s1",
      good: ["g"],
      improve: ["i"],
      actions: ["a"],
      id: "rt1",
      scope: "cross",
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    expect(retroListsFromRetro(retro)).toEqual({ good: ["g"], improve: ["i"], actions: ["a"] });
  });
});
