import { beforeEach, describe, expect, it } from "vitest";

import { useRiskStore } from "@/store/useRiskStore";
import type { ProjectArtifacts, RiskEntry } from "@/types";

function makeRisk(id: string, overrides: Partial<RiskEntry> = {}): RiskEntry {
  return {
    id,
    title: `Risiko ${id}`,
    probability: "mittel",
    impact: "mittel",
    priority: "mittel",
    status: "open",
    ...overrides,
  };
}

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

beforeEach(() => {
  useRiskStore.setState({ risks: {}, artifactsMigrated: false });
});

describe("useRiskStore.setRisks (TASK-061)", () => {
  it("replaces the whole risk array of a project", () => {
    useRiskStore.getState().setRisks("p-1", [makeRisk("R-1")]);
    useRiskStore.getState().setRisks("p-1", [makeRisk("R-2", { status: "closed" })]);

    const risks = useRiskStore.getState().risks["p-1"];
    expect(risks).toHaveLength(1);
    expect(risks[0].id).toBe("R-2");
  });

  it("works on a fresh project without any pipeline run (no artifacts)", () => {
    // The old project-store setRisks was a no-op without artifacts; the risk
    // store always writes, so "+ Risiko" works on a blank project.
    useRiskStore.getState().setRisks("blank", [makeRisk("R-9")]);
    expect(useRiskStore.getState().risks["blank"]).toHaveLength(1);
  });
});

describe("useRiskStore.importRisks (TASK-061)", () => {
  it("adds an agent register to an empty project", () => {
    useRiskStore.getState().importRisks("p-1", [makeRisk("R-1"), makeRisk("R-2")]);
    expect(useRiskStore.getState().risks["p-1"]).toHaveLength(2);
  });

  it("is additive & idempotent over risk id – a re-run never duplicates", () => {
    useRiskStore.getState().importRisks("p-1", [makeRisk("R-1")]);
    useRiskStore.getState().importRisks("p-1", [makeRisk("R-1"), makeRisk("R-2")]);

    const ids = useRiskStore.getState().risks["p-1"].map((r) => r.id);
    expect(ids).toEqual(["R-1", "R-2"]);
  });

  it("never overwrites a human-edited risk on re-run", () => {
    useRiskStore.getState().setRisks("p-1", [makeRisk("R-1", { title: "Von Hand" })]);
    // A re-run brings R-1 again with the original agent title – it must not win.
    useRiskStore.getState().importRisks("p-1", [makeRisk("R-1")]);

    expect(useRiskStore.getState().risks["p-1"][0].title).toBe("Von Hand");
  });

  it("backfills a missing status on import (legacy agent risks)", () => {
    const legacy = { ...makeRisk("R-1") } as Partial<RiskEntry>;
    delete legacy.status;
    useRiskStore.getState().importRisks("p-1", [legacy as RiskEntry]);
    expect(useRiskStore.getState().risks["p-1"][0].status).toBe("open");
  });
});

describe("useRiskStore.removeProjectRisks (TASK-061)", () => {
  it("drops all risks of a project (delete cascade)", () => {
    useRiskStore.getState().setRisks("p-1", [makeRisk("R-1")]);
    useRiskStore.getState().setRisks("p-2", [makeRisk("R-2")]);

    useRiskStore.getState().removeProjectRisks("p-1");

    expect(useRiskStore.getState().risks["p-1"]).toBeUndefined();
    expect(useRiskStore.getState().risks["p-2"]).toHaveLength(1);
  });
});

describe("useRiskStore.restore (TASK-061)", () => {
  it("replaces the whole slice for safe-delete Undo", () => {
    const snapshot = { risks: { "p-1": [makeRisk("R-1")] } };
    useRiskStore.getState().setRisks("p-2", [makeRisk("R-2")]);

    useRiskStore.getState().restore(snapshot);

    expect(useRiskStore.getState().risks["p-2"]).toBeUndefined();
    expect(useRiskStore.getState().risks["p-1"]).toHaveLength(1);
  });
});

describe("useRiskStore.migrateFromArtifacts (TASK-061)", () => {
  it("promotes legacy artifact risks once and sets the flag", () => {
    const artifacts = {
      "p-1": makeArtifacts([makeRisk("R-1")]),
      "p-2": makeArtifacts([]),
    };

    useRiskStore.getState().migrateFromArtifacts(artifacts);

    expect(useRiskStore.getState().risks["p-1"]).toHaveLength(1);
    // No entry for a project whose artifact had no risks.
    expect(useRiskStore.getState().risks["p-2"]).toBeUndefined();
    expect(useRiskStore.getState().artifactsMigrated).toBe(true);
  });

  it("is a no-op once artifactsMigrated is true (no double import)", () => {
    useRiskStore.setState({ risks: {}, artifactsMigrated: true });
    useRiskStore
      .getState()
      .migrateFromArtifacts({ "p-1": makeArtifacts([makeRisk("R-1")]) });
    expect(useRiskStore.getState().risks["p-1"]).toBeUndefined();
  });

  it("keeps an existing store edit over a legacy import", () => {
    useRiskStore.setState({
      risks: { "p-1": [makeRisk("R-1", { title: "Bearbeitet" })] },
      artifactsMigrated: false,
    });
    useRiskStore
      .getState()
      .migrateFromArtifacts({ "p-1": makeArtifacts([makeRisk("R-1")]) });

    expect(useRiskStore.getState().risks["p-1"][0].title).toBe("Bearbeitet");
  });

  it("backfills a missing status during migration", () => {
    const legacy = { ...makeRisk("R-1") } as Partial<RiskEntry>;
    delete legacy.status;
    useRiskStore
      .getState()
      .migrateFromArtifacts({ "p-1": makeArtifacts([legacy as RiskEntry]) });

    expect(useRiskStore.getState().risks["p-1"][0].status).toBe("open");
  });
});
