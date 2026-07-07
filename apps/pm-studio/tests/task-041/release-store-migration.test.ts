import { describe, expect, it } from "vitest";

import { useReleaseStore } from "@/store/useReleaseStore";
import type { Release } from "@/types";

/** The persist migrate function (v1 → v2) configured on the release store. */
const migrate = useReleaseStore.persist.getOptions().migrate!;

describe("release store migration (v1 → v2, TASK-041)", () => {
  it("lifts old releases without a status to 'planned' (additive)", () => {
    const legacy = {
      releases: [
        {
          id: "r1",
          projectId: "p1",
          name: "Release Q3",
          startDate: "2026-07-01",
          endDate: "2026-09-30",
          sprintLengthWeeks: 2,
        },
      ],
    };

    const migrated = migrate(legacy, 1) as { releases: Release[] };
    expect(migrated.releases[0].status).toBe("planned");
    // Untouched fields survive.
    expect(migrated.releases[0].name).toBe("Release Q3");
  });

  it("keeps an explicit status during migration", () => {
    const legacy = {
      releases: [
        {
          id: "r1",
          projectId: "p1",
          name: "Release Q3",
          status: "done",
          startDate: "2026-07-01",
          endDate: "2026-09-30",
          sprintLengthWeeks: 2,
        },
      ],
    };

    const migrated = migrate(legacy, 1) as { releases: Release[] };
    expect(migrated.releases[0].status).toBe("done");
  });

  it("is a no-op for already-migrated v2 state", () => {
    const current = {
      releases: [
        {
          id: "r1",
          projectId: "p1",
          name: "Release Q3",
          status: "active",
          startDate: "2026-07-01",
          endDate: "2026-09-30",
          sprintLengthWeeks: 2,
        },
      ],
    };

    const migrated = migrate(current, 2) as { releases: Release[] };
    expect(migrated.releases[0].status).toBe("active");
  });
});
