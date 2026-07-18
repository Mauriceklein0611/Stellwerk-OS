import { beforeEach, describe, expect, it } from "vitest";

import { useProjectStore } from "@/store/useProjectStore";
import type { ProjectArtifacts, RiskEntry } from "@/types";

function makeArtifacts(risks: RiskEntry[]): ProjectArtifacts {
  return {
    draft: {
      summary: "",
      vision: "",
      value_proposition: "",
      target_group: "",
      mvp: { description: "", features: [] },
      phases: [],
      initial_risks: [],
      open_questions: [],
    },
    requirements: {
      functional: [],
      non_functional: [],
      technical: [],
      dependencies: [],
      assumptions: [],
      budget_drivers: [],
      time_risks: [],
      clarifications: [],
    },
    backlog: { epics: [], sprint_suggestions: [] },
    risks: { risks },
  };
}

const risk: RiskEntry = {
  id: "R-1",
  title: "Scope-Creep",
  probability: "mittel",
  impact: "hoch",
  priority: "hoch",
  status: "open",
};

beforeEach(() => {
  useProjectStore.setState({ ideas: [], artifacts: {} });
});

// The editable risk register moved to useRiskStore in TASK-061 (see
// tests/task-061/useRiskStore.test.ts). The project store keeps only the v1→v2
// migration that backfills the artifact snapshot's risk status.
describe("useProjectStore migration (v1 → v2, TASK-045)", () => {
  const migrate = useProjectStore.persist.getOptions().migrate!;

  it("backfills missing risk status to 'open'", () => {
    const legacyRisk = { ...risk } as Partial<RiskEntry>;
    delete legacyRisk.status;
    const legacy = {
      ideas: [],
      artifacts: { "idea-1": makeArtifacts([legacyRisk as RiskEntry]) },
    };

    const migrated = migrate(legacy, 1) as typeof legacy;
    expect(migrated.artifacts["idea-1"].risks.risks[0].status).toBe("open");
  });

  it("keeps an explicit status during migration", () => {
    const legacy = {
      ideas: [],
      artifacts: { "idea-1": makeArtifacts([{ ...risk, status: "monitoring" }]) },
    };

    const migrated = migrate(legacy, 1) as typeof legacy;
    expect(migrated.artifacts["idea-1"].risks.risks[0].status).toBe("monitoring");
  });

  it("is a no-op for already-migrated v2 state", () => {
    const current = {
      ideas: [],
      artifacts: { "idea-1": makeArtifacts([risk]) },
    };
    const migrated = migrate(current, 2) as typeof current;
    expect(migrated.artifacts["idea-1"].risks.risks[0].status).toBe("open");
  });
});
