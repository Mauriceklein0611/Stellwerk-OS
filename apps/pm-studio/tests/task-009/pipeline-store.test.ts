import { beforeEach, describe, expect, it } from "vitest";

import { runPipelineForIdea } from "@/lib/agent-service";
import { MockAgentService } from "@/lib/mock-agent-service";
import { useAgentStore } from "@/store/useAgentStore";
import { useProjectStore } from "@/store/useProjectStore";
import { useBacklogStore } from "@/store/useBacklogStore";
import { useRiskStore } from "@/store/useRiskStore";
import type { ProjectIdea } from "@/types";

const fastService = new MockAgentService({ delayMs: 0 });

const idea: ProjectIdea = {
  id: "idea-42",
  createdAt: new Date().toISOString(),
  status: "idea",
  name: "Store-Test",
  description: "desc",
  problem: "problem",
  features: ["A", "B"],
  approach: "agil",
};

beforeEach(() => {
  useAgentStore.getState().reset();
  useProjectStore.setState({ ideas: [], artifacts: {} });
  useBacklogStore.setState({ epics: [], stories: [], artifactsMigrated: true });
  useRiskStore.setState({ risks: {}, artifactsMigrated: true });
});

describe("runPipelineForIdea", () => {
  it("records runs in the agent store and artifacts in the project store", async () => {
    const result = await runPipelineForIdea(idea, fastService);

    // Agent store: one run per agent, not running anymore.
    expect(useAgentStore.getState().runs).toHaveLength(4);
    expect(useAgentStore.getState().isRunning).toBe(false);

    // Project store: artifacts stored under the idea id.
    const stored = useProjectStore.getState().artifacts[idea.id];
    expect(stored).toBeDefined();
    expect(stored).toEqual(result.artifacts);

    // Backlog store: the run's backlog was promoted into store entities (TASK-056).
    const backlog = useBacklogStore.getState();
    expect(backlog.epics.length).toBeGreaterThan(0);
    expect(backlog.stories.length).toBeGreaterThan(0);
    expect(backlog.stories.every((s) => s.projectId === idea.id)).toBe(true);

    // Risk store: the run's risks were promoted into the store (TASK-061).
    const storedRisks = useRiskStore.getState().risks[idea.id];
    expect(storedRisks).toEqual(result.artifacts.risks.risks);
  });
});
