import { describe, expect, it } from "vitest";

import { MockAgentService } from "@/lib/mock-agent-service";
import type { ProjectIdea } from "@/types";

const service = new MockAgentService({ delayMs: 0 });

const makeIdea = (overrides: Partial<ProjectIdea> = {}): ProjectIdea => ({
  id: "idea-1",
  createdAt: new Date().toISOString(),
  status: "idea",
  name: "Alpha",
  description: "Eine Test-Idee",
  problem: "Manuelle Prozesse",
  features: ["Login", "Export"],
  approach: "agil",
  ...overrides,
});

describe("MockAgentService – schema conformance", () => {
  it("runDraft returns a complete draft that reflects the idea", async () => {
    const idea = makeIdea();
    const draft = await service.runDraft(idea);

    expect(draft.summary).toContain("Alpha");
    expect(draft.mvp.features).toEqual(["Login", "Export"]);
    expect(draft.phases.length).toBeGreaterThanOrEqual(1);
    expect(draft.open_questions.length).toBeGreaterThan(0);
  });

  it("runScrum yields >= 3 epics and every story has >= 2 acceptance criteria", async () => {
    const idea = makeIdea();
    const draft = await service.runDraft(idea);
    const requirements = await service.runRequirements(draft);
    const backlog = await service.runScrum(requirements);

    expect(backlog.epics.length).toBeGreaterThanOrEqual(3);
    const stories = backlog.epics.flatMap((epic) => epic.stories);
    expect(stories.length).toBeGreaterThan(0);
    for (const story of stories) {
      expect(story.acceptance_criteria.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("runRisk yields >= 4 risks", async () => {
    const idea = makeIdea();
    const draft = await service.runDraft(idea);
    const requirements = await service.runRequirements(draft);
    const backlog = await service.runScrum(requirements);
    const register = await service.runRisk(draft, backlog);

    expect(register.risks.length).toBeGreaterThanOrEqual(4);
  });
});

describe("MockAgentService – runPipeline", () => {
  it("produces complete artifacts and one run per agent", async () => {
    const statuses: string[] = [];
    const { artifacts, runs } = await service.runPipeline(makeIdea(), {
      onStatus: (s) => statuses.push(s),
      onRun: () => {},
    });

    expect(artifacts.draft).toBeDefined();
    expect(artifacts.requirements).toBeDefined();
    expect(artifacts.backlog).toBeDefined();
    expect(artifacts.risks).toBeDefined();

    expect(runs.map((r) => r.agent)).toEqual([
      "Draft-Agent",
      "Requirements-Agent",
      "Scrum-Agent",
      "Risk-Agent",
    ]);
    expect(runs.every((r) => r.status === "success")).toBe(true);
    expect(statuses.length).toBeGreaterThan(0);
  });

  it("does not crash for an idea without features (legacy/malformed input)", async () => {
    // An idea persisted before `features` existed has no array – the pipeline
    // must fall back to defaults instead of throwing on `.length`.
    const idea = makeIdea();
    delete (idea as { features?: string[] }).features;

    const { artifacts } = await service.runPipeline(idea);

    expect(artifacts.draft.mvp.features.length).toBeGreaterThan(0);
    expect(artifacts.backlog.epics.length).toBeGreaterThanOrEqual(3);
  });

  it("reacts to the input: different ideas yield different artifacts", async () => {
    const a = await service.runPipeline(
      makeIdea({ id: "a", name: "Alpha", features: ["Login", "Export"] }),
    );
    const b = await service.runPipeline(
      makeIdea({ id: "b", name: "Beta", features: ["Chat", "Suche"] }),
    );

    expect(a.artifacts.draft.summary).not.toBe(b.artifacts.draft.summary);

    const titlesA = a.artifacts.backlog.epics[0].stories.map((s) => s.title);
    const titlesB = b.artifacts.backlog.epics[0].stories.map((s) => s.title);
    expect(titlesA).toEqual(["Login", "Export"]);
    expect(titlesB).toEqual(["Chat", "Suche"]);
  });
});
