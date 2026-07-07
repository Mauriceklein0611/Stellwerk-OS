import { describe, expect, it } from "vitest";

import {
  RISK_STATUS,
  RISK_STATUS_ORDER,
  addRisk,
  createRisk,
  removeRisk,
  riskFormValues,
  riskStatusBadge,
  updateRisk,
  withRiskStatus,
  type RiskFormValues,
} from "@/lib/risk";
import type { RiskEntry } from "@/types";

const form = (overrides: Partial<RiskFormValues> = {}): RiskFormValues => ({
  title: "Scope-Creep",
  probability: "mittel",
  impact: "hoch",
  priority: "hoch",
  status: "open",
  owner: "PO",
  mitigation: "MVP abgrenzen",
  escalation: "Steering",
  ...overrides,
});

const risk = (overrides: Partial<RiskEntry> = {}): RiskEntry => ({
  id: "R-1",
  title: "Bestehendes Risiko",
  probability: "mittel",
  impact: "mittel",
  priority: "mittel",
  status: "open",
  ...overrides,
});

describe("risk status meta (TASK-045)", () => {
  it("maps every status to a StatusBadge token and label", () => {
    expect(riskStatusBadge("open").status).toBe("danger");
    expect(riskStatusBadge("mitigating").status).toBe("warning");
    expect(riskStatusBadge("monitoring").status).toBe("info");
    expect(riskStatusBadge("closed").status).toBe("success");
    for (const status of RISK_STATUS_ORDER) {
      expect(RISK_STATUS[status].label).toBeTruthy();
    }
  });
});

describe("createRisk", () => {
  it("assigns the injected id and trims text fields", () => {
    const entry = createRisk(
      form({ title: "  Scope  ", owner: "  PO  ", mitigation: "  do x  " }),
      () => "fixed-id",
    );
    expect(entry).toMatchObject({
      id: "fixed-id",
      title: "Scope",
      owner: "PO",
      mitigation: "do x",
      status: "open",
    });
  });

  it("drops empty optional fields to undefined", () => {
    const entry = createRisk(
      form({ owner: "  ", mitigation: "", escalation: "   " }),
      () => "id",
    );
    expect(entry.owner).toBeUndefined();
    expect(entry.mitigation).toBeUndefined();
    expect(entry.escalation).toBeUndefined();
  });
});

describe("addRisk", () => {
  it("appends a new risk", () => {
    const next = addRisk([risk()], form({ title: "Neu" }), () => "R-2");
    expect(next).toHaveLength(2);
    expect(next[1]).toMatchObject({ id: "R-2", title: "Neu" });
  });

  it("ignores a blank title (array unchanged)", () => {
    const start = [risk()];
    expect(addRisk(start, form({ title: "   " }))).toBe(start);
  });
});

describe("updateRisk", () => {
  it("replaces fields while preserving the id", () => {
    const start = [risk({ id: "R-9", title: "Alt", status: "open" })];
    const next = updateRisk(start, "R-9", form({ title: "Neu", status: "closed" }));
    expect(next[0]).toMatchObject({ id: "R-9", title: "Neu", status: "closed" });
  });

  it("is a no-op for an unknown id", () => {
    const start = [risk({ id: "R-9" })];
    const next = updateRisk(start, "missing", form());
    expect(next[0]).toEqual(start[0]);
  });
});

describe("removeRisk", () => {
  it("removes a risk by id", () => {
    const start = [risk({ id: "A" }), risk({ id: "B" })];
    expect(removeRisk(start, "A").map((r) => r.id)).toEqual(["B"]);
  });
});

describe("riskFormValues", () => {
  it("round-trips an entry into editable form defaults", () => {
    const values = riskFormValues(
      risk({ owner: undefined, mitigation: undefined, escalation: undefined }),
    );
    expect(values.owner).toBe("");
    expect(values.mitigation).toBe("");
    expect(values.escalation).toBe("");
  });
});

describe("withRiskStatus (migration backfill)", () => {
  it("defaults a missing status to 'open'", () => {
    const legacy = { ...risk() } as Partial<RiskEntry>;
    delete legacy.status;
    expect(withRiskStatus(legacy as RiskEntry).status).toBe("open");
  });

  it("keeps an explicit status", () => {
    expect(withRiskStatus(risk({ status: "closed" })).status).toBe("closed");
  });
});
