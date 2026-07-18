import { describe, expect, it } from "vitest";

import {
  ideaFormDefaults,
  ideaFormSchema,
  ideaFromForm,
  parseFeatures,
} from "@/lib/idea-schema";

describe("ideaFormSchema", () => {
  it("rejects empty required fields", () => {
    const result = ideaFormSchema.safeParse(ideaFormDefaults);
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((issue) => issue.path[0]);
      expect(fields).toContain("name");
      expect(fields).toContain("description");
      expect(fields).toContain("problem");
    }
  });

  it("accepts a valid idea", () => {
    const result = ideaFormSchema.safeParse({
      ...ideaFormDefaults,
      name: "Onboarding Revamp",
      description: "Neuer Onboarding-Flow",
      problem: "Zu hohe Absprungrate",
    });
    expect(result.success).toBe(true);
  });
});

describe("parseFeatures", () => {
  it("splits non-empty, trimmed lines", () => {
    expect(parseFeatures("A\n B \n\nC")).toEqual(["A", "B", "C"]);
  });

  it("returns an empty list for empty input", () => {
    expect(parseFeatures("")).toEqual([]);
    expect(parseFeatures(undefined)).toEqual([]);
  });
});

describe("ideaFromForm", () => {
  it("builds a ProjectIdea with id, createdAt, status and parsed features", () => {
    const idea = ideaFromForm({
      ...ideaFormDefaults,
      name: "Test",
      description: "Desc",
      problem: "Prob",
      features: "F1\nF2",
    });

    expect(idea.id).toBeTruthy();
    expect(idea.status).toBe("idea");
    expect(idea.features).toEqual(["F1", "F2"]);
    expect(idea.approach).toBe("agil");
    expect(Number.isNaN(Date.parse(idea.createdAt))).toBe(false);
    // Empty optional fields become undefined, not "".
    expect(idea.targetAudience).toBeUndefined();
  });
});
