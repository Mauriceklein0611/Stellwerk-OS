import type {
  Backlog,
  PipelineHooks,
  PipelineResult,
  ProjectDraft,
  ProjectIdea,
  Requirements,
  RiskRegister,
} from "@/types";
import { MockAgentService } from "@/lib/mock-agent-service";
import { useAgentStore } from "@/store/useAgentStore";
import { useProjectStore } from "@/store/useProjectStore";
import { useBacklogStore } from "@/store/useBacklogStore";
import { useRiskStore } from "@/store/useRiskStore";

/**
 * The pipeline seam. UI and stores depend on this interface only – never on a
 * concrete implementation. In M6 the mock is swapped for an API client without
 * any UI change.
 */
export interface AgentService {
  runDraft(idea: ProjectIdea): Promise<ProjectDraft>;
  runRequirements(draft: ProjectDraft): Promise<Requirements>;
  runScrum(requirements: Requirements): Promise<Backlog>;
  runRisk(draft: ProjectDraft, backlog: Backlog): Promise<RiskRegister>;
  runPipeline(idea: ProjectIdea, hooks?: PipelineHooks): Promise<PipelineResult>;
}

let instance: AgentService | null = null;

/** Composition root: the only place that knows the concrete implementation. */
export function getAgentService(): AgentService {
  if (!instance) instance = new MockAgentService();
  return instance;
}

/**
 * Run the full pipeline for an idea and wire progress into the stores:
 * runs/status into the agent store, artifacts into the project store.
 * `service` is injectable so tests can run without artificial latency.
 */
export async function runPipelineForIdea(
  idea: ProjectIdea,
  service: AgentService = getAgentService(),
): Promise<PipelineResult> {
  const agentStore = useAgentStore.getState();
  agentStore.reset();
  agentStore.setRunning(true);

  try {
    const result = await service.runPipeline(idea, {
      onStatus: (status) => useAgentStore.getState().setStatus(status),
      onRun: (run) => useAgentStore.getState().addRun(run),
    });
    // Keep the run snapshot as an artifact …
    useProjectStore.getState().setArtifacts(idea.id, result.artifacts);
    // … and promote its backlog into the store (additive & idempotent, TASK-056):
    // a re-run enriches the backlog instead of replacing it.
    useBacklogStore
      .getState()
      .importBacklog(idea.id, result.artifacts.backlog, "agent");
    // … same for the risk register (additive & idempotent over risk id, TASK-061):
    // a re-run never overwrites human-edited risks.
    useRiskStore.getState().importRisks(idea.id, result.artifacts.risks.risks);
    return result;
  } finally {
    useAgentStore.getState().setRunning(false);
  }
}
