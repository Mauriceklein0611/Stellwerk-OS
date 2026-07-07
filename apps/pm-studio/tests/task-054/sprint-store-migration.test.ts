import { describe, expect, it } from "vitest";

import { useSprintStore } from "@/store/useSprintStore";
import type { SprintRetro, SprintReview } from "@/types";

/** The persist migrate function (v1 → v2) configured on the sprint store. */
const migrate = useSprintStore.persist.getOptions().migrate!;

describe("useSprintStore persist migration v1 → v2 (TASK-054)", () => {
  it("backfills legacy reviews/retros into the list shape without data loss", () => {
    // TASK-018 upsert entries: no id/scope/createdAt.
    const legacy = {
      sprints: [],
      reviews: [{ sprintId: "s1", delivered: "Login", achievedPt: 5 }],
      retros: [{ sprintId: "s1", good: ["gut"], improve: [], actions: [] }],
    };

    const migrated = migrate(legacy, 1) as {
      reviews: SprintReview[];
      retros: SprintRetro[];
    };

    const review = migrated.reviews[0];
    expect(review.delivered).toBe("Login");
    expect(review.achievedPt).toBe(5);
    expect(review.scope).toBe("cross");
    expect(typeof review.id).toBe("string");
    expect(review.id.length).toBeGreaterThan(0);
    expect(review.createdAt).toBe(new Date(0).toISOString());

    const retro = migrated.retros[0];
    expect(retro.good).toEqual(["gut"]);
    expect(retro.scope).toBe("cross");
    expect(typeof retro.id).toBe("string");
  });

  it("tolerates missing reviews/retros arrays", () => {
    const migrated = migrate({ sprints: [] }, 1) as {
      reviews: SprintReview[];
      retros: SprintRetro[];
    };
    expect(migrated.reviews).toEqual([]);
    expect(migrated.retros).toEqual([]);
  });

  it("leaves already-migrated v2 entries untouched", () => {
    const current = {
      sprints: [],
      reviews: [
        {
          sprintId: "s1",
          delivered: "d",
          achievedPt: 1,
          id: "keep-me",
          scope: "team",
          teamId: "t1",
          createdAt: "2026-07-02T00:00:00.000Z",
        },
      ],
      retros: [],
    };

    const migrated = migrate(current, 2) as { reviews: SprintReview[] };
    expect(migrated.reviews[0].id).toBe("keep-me");
    expect(migrated.reviews[0].createdAt).toBe("2026-07-02T00:00:00.000Z");
  });
});
